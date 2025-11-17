import { generateClient } from 'aws-amplify/data';
import { signIn, signUp, signOut, getCurrentUser, fetchUserAttributes, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface User {
  id: string;
  email: string;
  userHandle: string;
  avatarUrl?: string;
  bio?: string;
  steamId?: string;
  steamPersonaName?: string;
  steamProfileUrl?: string;
  steamAvatarUrl?: string;
  steamConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // Check for existing session on initialization
    this.checkExistingSession();
  }

  /**
   * Check if user is already logged in (from Cognito)
   */
  private async checkExistingSession() {
    try {
      console.log('Checking for existing Cognito session...');
      const user = await getCurrentUser();
      if (user) {
        console.log('Found existing Cognito session:', user);
        console.log('Loading user data for existing session...');
        await this.loadUserData(user.userId);
        console.log('Existing session loaded, current user:', this.currentUser);
      } else {
        console.log('No user found in Cognito');
        this.currentUser = null;
        this.notifyListeners();
      }
    } catch (error) {
      // User not authenticated
      console.log('No existing session found:', error);
      this.currentUser = null;
      this.notifyListeners();
    }
  }

  /**
   * Load user data from database
   */
  private async loadUserData(userId: string) {
    try {
      console.log('Loading user data for userId:', userId);
      const { data } = await client.models.User.get({ id: userId });
      console.log('Database query result:', data);
      
      if (data) {
        console.log('User found in database, setting current user');
        this.currentUser = {
          id: data.id,
          email: data.email,
          userHandle: data.userHandle,
          avatarUrl: data.avatarUrl,
          bio: data.bio,
          steamId: data.steamId,
          steamPersonaName: data.steamPersonaName,
          steamProfileUrl: data.steamProfileUrl,
          steamAvatarUrl: data.steamAvatarUrl,
          steamConnected: data.steamConnected || false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
        console.log('Current user set:', this.currentUser);
        this.notifyListeners();
      } else {
        console.warn('User not found in database, creating user record...');
        // User exists in Cognito but not in database, create user record
        const cognitoUser = await getCurrentUser();
        const userAttributes = await fetchUserAttributes();
        
        console.log('Cognito user attributes:', userAttributes);
        
        const newUser: User = {
          id: userId,
          email: userAttributes.email || '',
          userHandle: userAttributes.preferred_username || userAttributes.email || '',
          steamConnected: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('Creating user in database:', newUser);

        // Create user in database
        const createResult = await client.models.User.create({
          id: userId,
          email: userAttributes.email || '',
          userHandle: userAttributes.preferred_username || userAttributes.email || '',
          steamConnected: false,
        });

        console.log('User created in database:', createResult);

        this.currentUser = newUser;
        console.log('Current user set after creation:', this.currentUser);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.currentUser = null;
      this.notifyListeners();
    }
  }

  /**
   * Register a listener for auth state changes
   */
  addAuthStateListener(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.getAuthState());
  }

  /**
   * Remove a listener
   */
  removeAuthStateListener(listener: (state: AuthState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of auth state changes
   */
  private notifyListeners() {
    const state = this.getAuthState();
    console.log('Notifying listeners with auth state:', state);
    console.log('Number of listeners:', this.listeners.length);
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return {
      isAuthenticated: !!this.currentUser,
      user: this.currentUser,
      loading: false,
    };
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, userHandle: string): Promise<{ requiresConfirmation: boolean; userId?: string }> {
    try {
      // Sign up with Cognito
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            preferred_username: userHandle,
          },
        },
      });

      if (isSignUpComplete) {
        // User created successfully, now create user record in database
        const newUser: User = {
          id: userId,
          email,
          userHandle,
          steamConnected: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Create user in database
        await client.models.User.create({
          id: userId,
          email,
          userHandle,
          steamConnected: false,
        });

        // Set as current user
        this.currentUser = newUser;
        this.notifyListeners();
        return { requiresConfirmation: false, userId };
      } else {
        // Email confirmation required
        return { requiresConfirmation: true, userId };
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Confirm sign up with verification code
   */
  async confirmSignUp(email: string, confirmationCode: string, userHandle: string): Promise<User> {
    try {
      // Confirm the sign up
      await confirmSignUp({
        username: email,
        confirmationCode,
      });

      console.log('Email confirmation successful, user account is now confirmed');
      
      // After confirmation, we need to create the user record in the database
      // We'll use a temporary ID for now since we can't get the Cognito user ID yet
      const tempUserId = `user-${Date.now()}`;
      
      // Create user record in database
      const newUser: User = {
        id: tempUserId,
        email,
        userHandle,
        steamConnected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create user in database
      await client.models.User.create({
        id: tempUserId,
        email,
        userHandle,
        steamConnected: false,
      });

      console.log('User account confirmed and created in database. Please sign in with your credentials.');
      
      return newUser;
    } catch (error) {
      console.error('Confirmation error:', error);
      throw error;
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(email: string): Promise<void> {
    try {
      await resendSignUpCode({ username: email });
    } catch (error) {
      console.error('Resend confirmation error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { isPasswordReset, nextStep } = await signIn({
        username: email,
        password: '', // This will trigger password reset
      });
      
      if (nextStep?.signInStep === 'RESET_PASSWORD') {
        // Password reset initiated
        console.log('Password reset initiated');
      } else {
        throw new Error('Failed to initiate password reset');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // Check if user is already authenticated
      if (this.currentUser) {
        console.log('User already authenticated, returning current user');
        return this.currentUser;
      }

      // Sign in with Cognito
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      console.log('Sign in result:', { isSignedIn, nextStep });

      if (isSignedIn) {
        // Get current user from Cognito
        const cognitoUser = await getCurrentUser();
        console.log('Cognito user:', cognitoUser);
        console.log('Loading user data...');
        await this.loadUserData(cognitoUser.userId);
        
        console.log('After loadUserData, currentUser:', this.currentUser);
        console.log('isAuthenticated:', this.isAuthenticated());
        
        if (this.currentUser) {
          console.log('Login successful, returning user:', this.currentUser);
          return this.currentUser;
        } else {
          console.error('Failed to load user data - currentUser is null');
          throw new Error('Failed to load user data');
        }
      } else if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        throw new Error('Please confirm your email before signing in');
      } else if (nextStep?.signInStep === 'RESET_PASSWORD') {
        throw new Error('Password reset required');
      } else {
        console.error('Sign in failed:', nextStep);
        throw new Error('Sign in failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // If user is already authenticated, try to load their data
      if (error instanceof Error && error.message.includes('UserAlreadyAuthenticatedException')) {
        console.log('User already authenticated, loading existing session...');
        try {
          const cognitoUser = await getCurrentUser();
          if (cognitoUser) {
            await this.loadUserData(cognitoUser.userId);
            if (this.currentUser) {
              return this.currentUser;
            }
          }
        } catch (loadError) {
          console.error('Error loading existing session:', loadError);
        }
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await signOut();
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if signOut fails
      this.currentUser = null;
      this.notifyListeners();
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // Update user in database
      await client.models.User.update({
        id: this.currentUser.id,
        ...updates,
      });

      // Update current user
      const updatedUser = { ...this.currentUser, ...updates, updatedAt: new Date().toISOString() };
      this.currentUser = updatedUser;

      this.notifyListeners();
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  /**
   * Force refresh authentication state
   */
  async refreshAuthState(): Promise<void> {
    console.log('Force refreshing authentication state...');
    await this.checkExistingSession();
  }
}

// Export singleton instance
export const authService = new AuthService();
