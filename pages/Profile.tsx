import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Edit, Save, X, Star, Trophy, Clock, Gamepad2, Heart, Eye, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { SteamConnect } from '../components/SteamConnect';
import { SteamAmplifyService } from '../services/steamAmplifyService';
import { authService } from '../services/authService';
// Define types locally to avoid import issues
interface UserType {
  id: string;
  userHandle: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

import type {
  Game,
  GameStatus,
  SteamGameDisplay,
  LibraryEntry,
} from '../types';

interface SteamAchievement {
  id: string;
  achievement: string;
  game: string;
  gameIcon: string;
  unlockedAt: string;
  description?: string;
}

interface ProfileFormData {
  userHandle: string;
  bio: string;
  avatarUrl: string;
}
import { ErrorHandler } from '../utils/errorHandler';
import { useGameStats } from '../hooks/useGameStats';
import { validateUserHandle, validateNotes } from '../utils/validation';

export function Profile() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState<ProfileFormData>({
    userHandle: '',
    bio: '',
    avatarUrl: '',
  });
  const [steamConnected, setSteamConnected] = useState(false);
  const [recentAchievements, setRecentAchievements] = useState<SteamAchievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get Steam games data (user-specific)
  const getSteamGames = (): SteamGameDisplay[] => {
    const userId = user?.id || '1';
    
    // Try to load from database first, then fallback to localStorage
    const libraryEntries = localStorage.getItem(`gameshelf-library-entries-${userId}`);
    if (libraryEntries) {
      const entries: LibraryEntry[] = JSON.parse(libraryEntries);
      // Convert LibraryEntry format to SteamGameDisplay format for display
      return entries.map((entry) => {
        // Extract appId from gameId (format: "steam-game-{appId}")
        const appId = parseInt(entry.gameId?.replace('steam-game-', '') || '0');
        
        return {
          appId,
          name: entry.gameTitle || 'Unknown Game',
          header_image: entry.gameCover || '',
          logoUrl: entry.gameCover || '',
          iconUrl: entry.gameCover || '',
          playtimeTotal: entry.steamPlaytimeTotal || 0,
          playtimeRecent: entry.steamPlaytimeRecent || 0,
          steamPlaytimeTotal: entry.steamPlaytimeTotal || 0,
          steamPlaytimeRecent: entry.steamPlaytimeRecent || 0,
          steamLastPlayed: entry.steamLastPlayed,
          lastPlayed: entry.steamLastPlayed ? new Date(entry.steamLastPlayed).getTime() / 1000 : null,
          hasStats: false, // Will be populated from Game relationship if available
          status: entry.status || 'planning',
          rating: entry.rating || 0,
          notes: entry.notes || '',
          hoursPlayed: entry.steamPlaytimeTotal ? Math.round(entry.steamPlaytimeTotal / 60) : 0,
        } as SteamGameDisplay;
      });
    }
    
    // Fallback to raw Steam games from localStorage (GraphQL SteamGame format)
    const steamGames = localStorage.getItem(`gameshelf-steam-games-${userId}`);
    if (steamGames) {
      const games = JSON.parse(steamGames);
      // Convert SteamGame format to SteamGameDisplay format
      return games.map((game: any) => ({
        ...game,
        appId: game.appId || game.appid, // Handle both formats
        header_image: game.logoUrl || game.iconUrl || '',
        capsule_image: game.logoUrl || '',
        steamPlaytimeTotal: game.playtimeTotal || 0,
        steamPlaytimeRecent: game.playtimeRecent || 0,
        steamLastPlayed: game.lastPlayed ? new Date(game.lastPlayed * 1000).toISOString() : undefined,
        hoursPlayed: game.playtimeTotal ? Math.round(game.playtimeTotal / 60) : 0,
      } as SteamGameDisplay));
    }
    
    return [];
  };

  const [steamGames, setSteamGames] = useState<SteamGameDisplay[]>(getSteamGames());
  
  // Use the game stats hook - convert SteamGameDisplay to Game format
  const convertedGames: Game[] = steamGames
    .filter((steamGame) => steamGame && steamGame.appId) // Filter out invalid games
    .map((steamGame) => ({
      id: steamGame.appId.toString(),
      title: steamGame.name || 'Unknown Game',
      cover: steamGame.header_image || steamGame.logoUrl || '',
      status: (steamGame.status as GameStatus) || 'planning',
      rating: steamGame.rating || 0,
      notes: steamGame.notes || '',
      createdAt: new Date().toISOString(),
      user: { userHandle: user?.userHandle || 'demo_user' },
      hoursPlayed: steamGame.hoursPlayed || 0,
    }));
  
  const gameStats = useGameStats(convertedGames);
  

  // Get currently playing games (recently played)
  const currentlyPlaying = steamGames
    .filter((game) => (game.playtimeRecent || game.steamPlaytimeRecent || 0) > 0)
    .sort((a, b) => {
      const aTime = a.steamLastPlayed ? new Date(a.steamLastPlayed).getTime() : 0;
      const bTime = b.steamLastPlayed ? new Date(b.steamLastPlayed).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3)
    .map((game) => ({
      id: game.appId.toString(),
      gameTitle: game.name,
      gameCover: game.header_image || game.logoUrl || '',
      status: 'playing' as GameStatus,
      rating: game.rating || 0,
      notes: game.notes || '',
      createdAt: new Date().toISOString(),
      user: { userHandle: user?.userHandle || 'demo_user' },
      hoursPlayed: game.hoursPlayed || 0,
    }));


  const displayCurrentlyPlaying = currentlyPlaying.length > 0 ? currentlyPlaying : [];

  // Get real recent activity from Steam data
  const getRecentActivity = () => {
    if (steamConnected && steamGames.length > 0) {
      const activities = [];
      
      // Add recently played games
      const recentlyPlayed = steamGames
        .filter(game => game.steamLastPlayed && (game.playtimeRecent || game.steamPlaytimeRecent || 0) > 0)
        .sort((a, b) => {
          const aTime = a.steamLastPlayed ? new Date(a.steamLastPlayed).getTime() : 0;
          const bTime = b.steamLastPlayed ? new Date(b.steamLastPlayed).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5)
        .map(game => ({
          id: `played-${game.appId}`,
          action: 'played' as const,
          game: game.name,
          gameCover: game.header_image || game.logoUrl || '',
          timestamp: game.steamLastPlayed!,
          hoursPlayed: game.hoursPlayed || 0,
          recentHours: Math.round((game.playtimeRecent || game.steamPlaytimeRecent || 0) / 60), // Convert minutes to hours
        }));
      
      activities.push(...recentlyPlayed);
      
      // Add games explicitly marked as finished (not just games with no recent activity)
      const finishedGames = steamGames
        .filter(game => game.status === 'finished')
        .sort((a, b) => {
          const aTime = a.steamLastPlayed ? new Date(a.steamLastPlayed).getTime() : 0;
          const bTime = b.steamLastPlayed ? new Date(b.steamLastPlayed).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 3)
        .map(game => ({
          id: `finished-${game.appId}`,
          action: 'finished' as const,
          game: game.name,
          gameCover: game.header_image || game.logoUrl || '',
          timestamp: game.steamLastPlayed || new Date().toISOString(),
          hoursPlayed: game.hoursPlayed || 0,
          rating: game.rating || 0,
        }));
      
      activities.push(...finishedGames);
      
      // Sort all activities by timestamp and return most recent
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    }
    
    // Return empty array if no Steam data
    return [];
  };

  const recentActivity = getRecentActivity();

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Load Steam data from database when user is available
  useEffect(() => {
    const loadSteamDataFromDatabase = async () => {
      if (user?.id) {
        try {
          console.log('Loading Steam data from database for user:', user.id);
          
          // Load Steam profile
          const steamProfile = await SteamAmplifyService.loadSteamProfileFromDatabase(user.id);
          if (steamProfile) {
            setSteamConnected(true);
          }
          
          // Load Steam games
          const steamGames = await SteamAmplifyService.loadSteamGamesFromDatabase(user.id);
          setSteamGames(steamGames);
          
          console.log('Steam data loaded from database:', { steamProfile, gamesCount: steamGames.length });
        } catch (error) {
          console.error('Error loading Steam data from database:', error);
        }
      }
    };

    loadSteamDataFromDatabase();
  }, [user?.id]);

  // Load Steam data when Steam is connected
  useEffect(() => {
    if (steamConnected) {
      loadSteamData();
    }
  }, [steamConnected]);

  // Listen for Steam library sync events
  useEffect(() => {
    const handleSteamLibrarySynced = (event: CustomEvent) => {
      console.log('Steam library synced event received:', event.detail);
      // Reload Steam data when library is synced
      if (steamConnected) {
        loadSteamData();
      }
    };

    window.addEventListener('steamLibrarySynced', handleSteamLibrarySynced as EventListener);
    return () => {
      window.removeEventListener('steamLibrarySynced', handleSteamLibrarySynced as EventListener);
    };
  }, [steamConnected]);

  // Listen for My Games updates
  useEffect(() => {
    const handleMyGamesUpdate = () => {
      // Force re-render by updating a dummy state
      setUser((prev: any) => prev ? { ...prev } : null);
    };

    window.addEventListener('myGamesUpdated', handleMyGamesUpdate);
    return () => {
      window.removeEventListener('myGamesUpdated', handleMyGamesUpdate);
    };
  }, []);

  const loadSteamData = async () => {
    try {
      const userId = user?.id || '1';
      const steamData = localStorage.getItem(`gameshelf-steam-data-${userId}`);
      if (!steamData) {
        console.log('No Steam data found for user');
        return;
      }
      
      const { steamId, steamPersonaName, steamProfileUrl, steamAvatarUrl } = JSON.parse(steamData);
      console.log('Loading Steam data for user:', { steamId, steamPersonaName });
      
      // Update Steam connection state
      setSteamConnected(true);
      
      // Load achievements
      await loadAchievements(steamId);
      
      console.log('Steam data loaded successfully');
    } catch (error) {
      console.error('Error loading Steam data:', error);
    }
  };

  const loadAchievements = async (steamId: string) => {
    if (!steamConnected) return;
    
    setLoadingAchievements(true);
    try {
      // Get Steam games from localStorage
      const userId = user?.id || '1';
      const libraryEntries = localStorage.getItem(`gameshelf-library-entries-${userId}`);
      
      if (!libraryEntries) {
        console.log('No Steam library entries found');
        setLoadingAchievements(false);
        return;
      }
      
      const steamGames = JSON.parse(libraryEntries);
      console.log('Loading achievements for', steamGames.length, 'Steam games');
      
      const achievements = await SteamAmplifyService.getRecentAchievements(steamId, steamGames);
      setRecentAchievements(achievements);
      console.log('Achievements loaded:', achievements.length);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoadingAchievements(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get current authenticated user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      // Load Steam data from localStorage (user-specific)
      const steamData = localStorage.getItem(`gameshelf-steam-data-${currentUser.id}`);
      const steamConnected = steamData ? JSON.parse(steamData).steamConnected : false;
      
      // Use real user data with Steam integration
      const userData = {
        ...currentUser,
        steamConnected,
        steamPersonaName: steamData ? JSON.parse(steamData).steamPersonaName : null,
        steamProfileUrl: steamData ? JSON.parse(steamData).steamProfileUrl : null,
        steamAvatarUrl: steamData ? JSON.parse(steamData).steamAvatarUrl : null,
      };
      
      setUser(userData);
      setSteamConnected(steamConnected);
      setFormData({
        userHandle: userData.userHandle || '',
        bio: userData.bio || '',
        avatarUrl: userData.avatarUrl || '',
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSave = async () => {
    try {
      console.log('Profile save initiated with data:', formData);
      
      // Validate form data
      const errors: Record<string, string> = {};
      
      const userHandleError = validateUserHandle(formData.userHandle);
      if (userHandleError) errors.userHandle = userHandleError;
      
      const bioError = validateNotes(formData.bio);
      if (bioError) errors.bio = bioError;
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error('Please fix the validation errors');
        return;
      }

      console.log('Starting to save profile...');
      
      // Update user profile using auth service
      const updatedUser = await authService.updateProfile({
        userHandle: formData.userHandle,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
      });

      console.log('Profile data saved:', updatedUser);

      toast.success('Profile updated successfully!');
      setEditing(false);
      setValidationErrors({});
      loadUserProfile();
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      userHandle: user?.userHandle || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}
        fill={i < rating ? 'currentColor' : 'none'}
      />
    ));
  };

  // Get user's games from localStorage
  const getMyGames = (): any[] => {
    if (!user?.id) return [];
    
    try {
      const myGamesKey = `gameshelf-my-games-${user.id}`;
      const myGames = localStorage.getItem(myGamesKey);
      return myGames ? JSON.parse(myGames) : [];
    } catch (error) {
      console.error('Error loading my games:', error);
      return [];
    }
  };


  // Add game to My Games
  const handleAddToMyGames = (game: any) => {
    if (!user?.id) {
      toast.error('Please sign in to add games to your collection');
      return;
    }
    
    try {
      const myGamesKey = `gameshelf-my-games-${user.id}`;
      const existingGames = JSON.parse(localStorage.getItem(myGamesKey) || '[]');
      
      // Check if game already exists
      if (existingGames.some((g: any) => g.appid === game.id)) {
        toast.error('Game already in your collection');
        return;
      }

      // Add game to collection
      const newGame = {
        appid: game.id,
        name: game.gameTitle,
        header_image: game.gameCover,
        capsule_image: game.gameCover,
        short_description: '',
        genres: [],
        developers: [],
        publishers: [],
        release_date: '',
        price_overview: null,
        metacritic_score: game.rating,
        is_free: false,
        platforms: { windows: true, mac: false, linux: false },
        addedDate: new Date().toISOString(),
        status: 'wishlist'
      };

      existingGames.push(newGame);
      localStorage.setItem(myGamesKey, JSON.stringify(existingGames));
      
      toast.success(`Added ${game.gameTitle} to your collection!`);
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('myGamesUpdated'));
    } catch (error) {
      console.error('Error adding game to collection:', error);
      toast.error('Failed to add game to collection');
    }
  };

  // Remove game from My Games
  const handleRemoveFromMyGames = (gameId: number) => {
    if (!user?.id) return;
    
    try {
      const myGamesKey = `gameshelf-my-games-${user.id}`;
      const existingGames = JSON.parse(localStorage.getItem(myGamesKey) || '[]');
      const updatedGames = existingGames.filter((g: any) => g.appid !== gameId);
      localStorage.setItem(myGamesKey, JSON.stringify(updatedGames));
      
      toast.success('Game removed from your collection');
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('myGamesUpdated'));
    } catch (error) {
      console.error('Error removing game from collection:', error);
      toast.error('Failed to remove game from collection');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'activity', label: 'Activity', icon: Clock },
  ];

  return (
    <div className="w-full">
      {/* Profile Header - Steam-style */}
      <div className="relative">
        {/* Background Banner */}
        <div className="h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
        
        {/* Profile Content */}
        <div className="relative -mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              {/* Avatar */}
              <div className="relative">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-800 shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-800 shadow-xl">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {editing && (
                  <button className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full transition-colors shadow-lg">
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      {editing ? (
                        <input
                          type="text"
                          name="userHandle"
                          value={formData.userHandle}
                          onChange={handleInputChange}
                          className="form-input text-4xl font-bold bg-transparent border-none p-0"
                          placeholder="Enter username"
                          aria-label="Username"
                          aria-describedby={validationErrors.userHandle ? "userHandle-error" : undefined}
                          aria-invalid={!!validationErrors.userHandle}
                        />
                      ) : (
                        formData.userHandle || 'Set your username'
                      )}
                    </h1>
                    {editing && validationErrors.userHandle && (
                      <div id="userHandle-error" className="text-red-400 text-sm mt-1">
                        {validationErrors.userHandle}
                      </div>
                    )}
                    <p className="text-gray-400 mb-4 text-lg">
                      {user?.email || 'user@example.com'}
                    </p>
                    
                    {/* Bio */}
                    {editing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="form-input form-textarea bg-gray-800 border-gray-600"
                        placeholder="Tell us about yourself..."
                        rows={3}
                        aria-label="Bio"
                        aria-describedby={validationErrors.bio ? "bio-error" : undefined}
                        aria-invalid={!!validationErrors.bio}
                      />
                    ) : (
                      <p className="text-gray-300 max-w-2xl text-lg">
                        {formData.bio || 'No bio yet. Click edit to add one!'}
                      </p>
                    )}
                    {editing && validationErrors.bio && (
                      <div id="bio-error" className="text-red-400 text-sm mt-1">
                        {validationErrors.bio}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {editing ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="btn btn-primary flex items-center gap-2 px-6 py-3"
                        >
                          <Save className="w-5 h-5" />
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="btn btn-secondary flex items-center gap-2 px-6 py-3"
                        >
                          <X className="w-5 h-5" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditing(true)}
                        className="btn btn-secondary flex items-center gap-2 px-6 py-3"
                      >
                        <Edit className="w-5 h-5" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      {/* Stats Cards - In Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-indigo-500 mb-2">
              {steamConnected ? steamGames.length : 127}
            </div>
            <div className="text-gray-400">Games Owned</div>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {steamConnected ? steamGames.filter((g) => {
                // Only count games explicitly marked as "finished"
                // Users should manually mark games as finished when they complete them
                return g.status === 'finished';
              }).length : 89}
            </div>
            <div className="text-gray-400">Completed</div>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {steamConnected ? 
                (steamGames.filter((g: any) => g.rating).length > 0 ? 
                  (steamGames.filter((g: any) => g.rating).reduce((sum: any, g: any) => sum + g.rating, 0) / steamGames.filter((g: any) => g.rating).length).toFixed(1) : 
                  'N/A') : 
                '4.2'}
            </div>
            <div className="text-gray-400">Avg Rating</div>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-purple-500 mb-2">
              {steamConnected ? 
                Math.round(steamGames.reduce((sum, g) => {
                  // Convert Steam playtime from minutes to hours
                  const totalPlaytime = g.playtimeTotal || g.steamPlaytimeTotal || 0;
                  const steamHours = Math.round(totalPlaytime / 60);
                  const manualHours = g.hoursPlayed || 0;
                  return sum + steamHours + manualHours;
                }, 0)) : 
                '1,247'}
            </div>
            <div className="text-gray-400">Hours Played</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="border-b border-gray-700 mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

        {/* Tab Content */}
        {activeTab === 'games' && (
          <div className="space-y-8">
            {/* My Games - Full Collection */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-green-400" />
                  My Games Collection
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    {getMyGames().length} games
                  </span>
                  <Link 
                    to="/library" 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add More Games
                  </Link>
                </div>
              </div>
              
              {getMyGames().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getMyGames().map((game) => (
                    <div key={game.appid} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all duration-300 group border border-gray-700 hover:border-gray-600">
                      <div className="aspect-[3/4] mb-3 rounded overflow-hidden relative">
                        <img
                          src={game.header_image}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {game.status === 'wishlist' ? 'Wishlist' : 'Owned'}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium">
                              View Game
                            </button>
                          </div>
                        </div>
                      </div>
                      <h4 className="font-semibold text-white mb-1 text-sm line-clamp-2">{game.name}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {game.metacritic_score && (
                            <>
                              <Star className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-gray-400 ml-1">{game.metacritic_score}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleRemoveFromMyGames(game.appid)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Remove from My Games"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-white transition-colors">
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gamepad2 className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-2">No games in your collection yet</p>
                  <p className="text-gray-500 text-sm mb-4">Browse the library to add games to your collection!</p>
                  <Link 
                    to="/library" 
                    className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
                  >
                    Browse Library
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
            {/* My Games Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                  <Gamepad2 className="w-7 h-7 text-green-400" />
                  My Games
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-gray-300 font-medium">
                    {getMyGames().length} games
                  </span>
                  <Link 
                    to="/library" 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Games
                  </Link>
                </div>
              </div>
              {getMyGames().length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {getMyGames().slice(0, 8).map((game) => (
                    <div key={game.appid} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all duration-300 group border border-gray-700 hover:border-gray-600">
                      <div className="aspect-[3/4] mb-3 rounded-lg overflow-hidden relative">
                        <img
                          src={game.header_image}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {game.status === 'wishlist' ? 'Wishlist' : 'Owned'}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium">
                              View Game
                            </button>
                          </div>
                        </div>
                      </div>
                      <h4 className="font-semibold text-white mb-2 text-sm line-clamp-2">{game.name}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {game.metacritic_score && (
                            <>
                              <Star className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-gray-400 ml-1">{game.metacritic_score}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleRemoveFromMyGames(game.appid)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Remove from My Games"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-white transition-colors">
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Gamepad2 className="w-12 h-12 text-gray-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">No games in your collection yet</h4>
                  <p className="text-gray-400 mb-6">Browse the library to add games to your collection!</p>
                  <Link 
                    to="/library" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Browse Library
                  </Link>
                </div>
              )}
            </div>

            {/* Recently Played Games */}
            <div className="card">
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Clock className="w-7 h-7 text-blue-400" />
                Recently Played Games
              </h3>
              {displayCurrentlyPlaying.length > 0 ? (
                <div className="space-y-4">
                  {displayCurrentlyPlaying.slice(0, 3).map((game: any) => (
                    <div key={game.id} className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group">
                      <div className="relative">
                        <img
                          src={game.gameCover}
                          alt={game.gameTitle}
                          className="w-16 h-20 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-semibold">Play</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{game.gameTitle}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                          <span>{game.hoursPlayed} hours on record</span>
                          <span>Last played 2 days ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Achievement Progress</span>
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                          <span className="text-sm text-gray-400">26 of 49</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {renderStars(game.rating)}
                          <span className="text-sm text-gray-400 ml-2">({game.rating}/5)</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors">
                          View Game
                        </button>
                        <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors">
                          Screenshots
                        </button>
                        <button 
                          onClick={() => handleAddToMyGames(game)}
                          className="flex items-center justify-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                        >
                          <Heart className="w-3 h-3" fill="currentColor" />
                          Add to My Games
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No recently played games</h4>
                  <p className="text-gray-400">Start playing some games to see them here!</p>
                </div>
              )}
            </div>

            {/* Recent Activity & Achievements - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                    <Clock className="w-6 h-6 text-blue-400" />
                    Recent Activity
                  </h3>
                  <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                    View All
                  </button>
                </div>
                  <div className="space-y-2">
                    {recentActivity.length > 0 ? (
                      recentActivity.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                          {activity.gameCover && (
                            <img 
                              src={activity.gameCover} 
                              alt={activity.game}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 truncate">
                              <span className="font-medium text-white">
                                {activity.action === 'finished' && 'Finished'}
                                {activity.action === 'played' && 'Played'}
                                {activity.action === 'started' && 'Started'}
                                {activity.action === 'rated' && 'Rated'}
                              </span>
                              {' '}
                              <span className="text-gray-400">{activity.game}</span>
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{SteamAmplifyService.formatTimeAgo(new Date(activity.timestamp))}</span>
                              {activity.hoursPlayed && (
                                <>
                                  <span>•</span>
                                  <span>{activity.hoursPlayed}h</span>
                                </>
                              )}
                            </div>
                          </div>
                          {activity.rating && (
                            <div className="flex items-center gap-1">
                              {renderStars(activity.rating)}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>

              {/* Recent Achievements */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    Recent Achievements
                  </h3>
                  <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                    View All
                  </button>
                </div>
                  <div className="space-y-2">
                    {loadingAchievements ? (
                      <div className="text-center py-4 text-gray-400">
                        <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">Loading...</p>
                      </div>
                    ) : recentAchievements.length > 0 ? (
                      recentAchievements.slice(0, 4).map((achievement) => (
                        <div key={achievement.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{achievement.achievement}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{achievement.game}</span>
                              <span>•</span>
                              <span>{SteamAmplifyService.formatTimeAgo(new Date(achievement.unlockedAt))}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No recent achievements</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
              {/* Quick Stats */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300 text-sm">Achievements</span>
                    </div>
                    <span className="text-white font-bold text-lg">
                      {steamConnected ? recentAchievements.length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300 text-sm">Perfect Games</span>
                    </div>
                    <span className="text-white font-bold text-lg">
                      {steamConnected ? steamGames.filter((g: any) => g.rating === 5).length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300 text-sm">Completion Rate</span>
                    </div>
                    <span className="text-white font-bold text-lg">
                      {steamConnected ? 
                        Math.round((steamGames.filter((g: any) => g.status === 'finished').length / steamGames.length) * 100) || 0 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Friends Activity */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Friends Activity
                </h3>
                <div className="space-y-3">
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">No friends yet</p>
                    <p className="text-gray-500 text-xs mb-3">Connect with other gamers!</p>
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors">
                      Find Friends
                    </button>
                  </div>
                </div>
              </div>

              {/* Gaming Level */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  Gaming Level
                </h3>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-2xl">12</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">Level 12</p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-gray-400 text-xs">650 / 1000 XP</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}


        {activeTab === 'activity' && (
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-6">Activity Feed</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-medium">
                        {activity.action === 'finished' && 'Finished'}
                        {activity.action === 'started' && 'Started playing'}
                        {activity.action === 'rated' && 'Rated'}
                      </span>
                      {' '}
                      <span className="text-indigo-400">{activity.game}</span>
                    </p>
                    {activity.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        {renderStars(activity.rating)}
                        <span className="text-sm text-gray-400 ml-2">({activity.rating}/5)</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Steam Connection - Bottom Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <SteamConnect
          userId={user?.id || ''}
          steamConnected={steamConnected}
          steamPersonaName={(user as any)?.steamPersonaName}
          steamProfileUrl={(user as any)?.steamProfileUrl}
          steamAvatarUrl={(user as any)?.steamAvatarUrl}
          onSteamConnected={() => {
            // Reload profile to get updated Steam data
            loadUserProfile();
          }}
        />
      </div>
    </div>
  );
}
