import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { PublicProfile } from './pages/PublicProfile';
import { Library } from './pages/Library';
import { AddGame } from './pages/AddGame';
import { Auth } from './pages/Auth';
import { Header } from './components/Header';
import { AuthDebug } from './components/AuthDebug';
import { authService, type AuthState } from './services/authService';

import './App.css';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: false,
  });

  useEffect(() => {
    // Listen for auth state changes
    const handleAuthStateChange = (state: AuthState) => {
      console.log('App.tsx: Auth state changed:', state);
      setAuthState(state);
    };

    authService.addAuthStateListener(handleAuthStateChange);

    // Force refresh auth state on app start
    const initializeAuth = async () => {
      console.log('App.tsx: Initializing authentication...');
      await authService.refreshAuthState();
    };
    
    initializeAuth();

    // Cleanup listener on unmount
    return () => {
      authService.removeAuthStateListener(handleAuthStateChange);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAuthSuccess = () => {
    // Auth state will be updated automatically via listener
  };

  // Show loading state while checking authentication
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Debug: Log current auth state
  console.log('App.tsx: Current auth state:', authState);

  // Show main app (public access to home, protected routes for user features)
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <BrowserRouter>
        <Header 
          user={authState.isAuthenticated ? {
            username: authState.user?.userHandle || '',
            email: authState.user?.email || '',
          } : null} 
          signOut={handleSignOut} 
        />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={
              authState.isAuthenticated ? <Profile /> : <Auth onAuthSuccess={handleAuthSuccess} />
            } />
                <Route path="/library" element={
                  authState.isAuthenticated ? <Library /> : <Auth onAuthSuccess={handleAuthSuccess} />
                } />
            <Route path="/add-game" element={
              authState.isAuthenticated ? <AddGame /> : <Auth onAuthSuccess={handleAuthSuccess} />
            } />
            <Route path="/user/:userHandle" element={<PublicProfile />} />
          </Routes>
        </main>
      </BrowserRouter>
      <Toaster position="top-right" />
      <AuthDebug />
    </div>
  );
}