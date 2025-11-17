import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TrendingGames } from '../components/TrendingGames';
import { Plus, TrendingUp, Star, Filter, Search, LogIn, UserPlus } from 'lucide-react';
import { authService } from '../services/authService';
import { ErrorHandler } from '../utils/errorHandler';
// Define Game type locally to avoid import issues
interface Game {
  id: string;
  title: string;
  cover?: string;
  status: 'playing' | 'finished' | 'paused' | 'dropped' | 'planning';
  rating: number;
  notes?: string;
  createdAt: string;
  user: { userHandle: string };
  hoursPlayed?: number;
  developer?: string;
  publisher?: string;
  genre?: string[];
  releaseDate?: string;
  metacriticScore?: number;
}

// Mock data for development until database is implemented properly again
const mockGames: Game[] = [
  {
    id: '1',
    title: 'The Legend of Zelda: Breath of the Wild',
    cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg',
    status: 'playing',
    rating: 5,
    notes: 'Absolutely incredible open world experience!',
    createdAt: '2024-01-15T10:00:00Z',
    user: { userHandle: 'demo_user' },
  },
  {
    id: '2',
    title: 'Elden Ring',
    cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2rpf.jpg',
    status: 'finished',
    rating: 5,
    notes: 'Masterpiece of game design and world building.',
    createdAt: '2024-01-10T10:00:00Z',
    user: { userHandle: 'demo_user' },
  },
  {
    id: '3',
    title: 'Hades',
    cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2l6u.jpg',
    status: 'paused',
    rating: 4,
    notes: 'Great roguelike, taking a break for now.',
    createdAt: '2024-01-05T10:00:00Z',
    user: { userHandle: 'demo_user' },
  },
];

// Mock data for friends activity
const mockFriendsActivity = [
  {
    id: '1',
    user: { userHandle: 'gamer_alex', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' },
    action: 'finished',
    game: {
      title: 'Baldur\'s Gate 3',
      cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6w2a.jpg',
    },
    rating: 5,
    timestamp: '2024-01-14T15:30:00Z',
  },
  {
    id: '2',
    user: { userHandle: 'retro_gamer', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' },
    action: 'started',
    game: {
      title: 'Cyberpunk 2077',
      cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2rpg.jpg',
    },
    rating: null,
    timestamp: '2024-01-14T12:15:00Z',
  },
  {
    id: '3',
    user: { userHandle: 'indie_lover', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' },
    action: 'rated',
    game: {
      title: 'Stray',
      cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3l6u.jpg',
    },
    rating: 4,
    timestamp: '2024-01-14T09:45:00Z',
  },
];

// Mock data for popular games
const mockPopularGames = [
  {
    id: '4',
    gameTitle: 'Palworld',
    gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6w2b.jpg',
    status: 'playing',
    rating: 4,
    notes: 'Pokemon meets survival crafting - addictive!',
    createdAt: '2024-01-12T10:00:00Z',
    user: { userHandle: 'demo_user' },
    playCount: 1250,
  },
  {
    id: '5',
    gameTitle: 'Helldivers 2',
    gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6w2c.jpg',
    status: 'playing',
    rating: 5,
    notes: 'Incredible co-op experience with friends!',
    createdAt: '2024-01-11T10:00:00Z',
    user: { userHandle: 'demo_user' },
    playCount: 980,
  },
  {
    id: '6',
    gameTitle: 'Persona 3 Reload',
    gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6w2d.jpg',
    status: 'finished',
    rating: 5,
    notes: 'Perfect remake of a classic JRPG.',
    createdAt: '2024-01-10T10:00:00Z',
    user: { userHandle: 'demo_user' },
    playCount: 750,
  },
];

export function Dashboard() {
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [friendsActivity, setFriendsActivity] = useState<any[]>([]);
  const [popularGames, setPopularGames] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    playing: 0,
    finished: 0,
    paused: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load games from localStorage on component mount and when storage changes
  useEffect(() => {
    const loadGames = () => {
      const savedGames = localStorage.getItem('gameshelf-games');
      if (savedGames) {
        const parsedGames = JSON.parse(savedGames);
        setRecentGames(parsedGames);
      }
    };

    loadGames();

    // Listen for storage changes (when games are added from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gameshelf-games') {
        loadGames();
      }
    };

    // Listen for custom game added event (same tab)
    const handleGameAdded = () => {
      loadGames();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gameAdded', handleGameAdded);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gameAdded', handleGameAdded);
    };
  }, []);


  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const handleAuthStateChange = () => {
      checkAuth();
    };
    
    authService.addAuthStateListener(handleAuthStateChange);
    
    return () => {
      authService.removeAuthStateListener(handleAuthStateChange);
    };
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load saved games from localStorage, fallback to mock data
      const savedGames = localStorage.getItem('gameshelf-games');
      const gamesToShow = savedGames ? JSON.parse(savedGames) : mockGames;
      
      setRecentGames(gamesToShow);
      setFriendsActivity(mockFriendsActivity);
      setPopularGames(mockPopularGames);

      // Calculate stats
      const totalGames = gamesToShow.length;
      const playing = gamesToShow.filter((entry: Game) => entry.status === 'playing').length;
      const finished = gamesToShow.filter((entry: Game) => entry.status === 'finished').length;
      const paused = gamesToShow.filter((entry: Game) => entry.status === 'paused').length;

      setStats({ totalGames, playing, finished, paused });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
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

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Welcome to GameShelf
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-10 max-w-4xl mx-auto leading-relaxed">
              Discover, track, and share your gaming journey with friends
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/add-game" 
                    className="btn btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Game
                  </Link>
                  <Link 
                    to="/library" 
                    className="btn btn-secondary flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Browse Library
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/profile" 
                    className="btn btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold"
                  >
                    <UserPlus className="w-5 h-5" />
                    Get Started
                  </Link>
                  <Link 
                    to="/profile" 
                    className="btn btn-secondary flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search and Filter Section */}
        <div className="mb-16">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for games, friends, or reviews..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 font-medium">Filter:</span>
              </div>
              <select className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                <option>All Games</option>
                <option>Currently Playing</option>
                <option>Finished</option>
                <option>On Hold</option>
              </select>
              <select className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                <option>All Genres</option>
                <option>Action</option>
                <option>RPG</option>
                <option>Adventure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top Games This Week */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">🔥 Trending Games This Week</h2>
            <Link 
              to="/browse" 
              className="text-indigo-500 hover:text-indigo-400 transition-colors font-medium"
            >
              View All Trending →
            </Link>
          </div>
          <TrendingGames limit={6} showTitle={false} />
        </div>

        {/* Friends Activity Feed */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">👥 Friends Activity</h2>
            <Link 
              to="/friends" 
              className="text-indigo-500 hover:text-indigo-400 transition-colors font-medium"
            >
              View All Activity →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friendsActivity.map((activity) => (
              <div key={activity.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <img
                    src={activity.user.avatarUrl}
                    alt={activity.user.userHandle}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">
                        {activity.user.userHandle}
                      </span>
                      <span className="text-sm text-gray-400">
                        {activity.action === 'finished' && 'finished'}
                        {activity.action === 'started' && 'started playing'}
                        {activity.action === 'rated' && 'rated'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={activity.game.cover}
                        alt={activity.game.title}
                        className="w-8 h-10 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {activity.game.title}
                        </p>
                        {activity.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(activity.rating)}
                            <span className="text-xs text-gray-400 ml-1">({activity.rating}/5)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Reviews Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">⭐ Top Reviews This Week</h2>
            <Link 
              to="/reviews" 
              className="text-indigo-500 hover:text-indigo-400 transition-colors font-medium"
            >
              View All Reviews →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mock top reviews */}
            <div className="card">
              <div className="flex items-start gap-4">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                  alt="Reviewer"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">gamer_alex</span>
                    <div className="flex items-center gap-1">
                      {renderStars(5)}
                    </div>
                  </div>
                  <h4 className="font-medium text-white mb-2">Baldur's Gate 3</h4>
                  <p className="text-gray-300 text-sm line-clamp-3">
                    "Absolutely incredible RPG experience. The depth of choice and consequence is unmatched. Every playthrough feels completely different..."
                  </p>
                  <p className="text-xs text-gray-500 mt-2">2 days ago</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start gap-4">
                <img
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
                  alt="Reviewer"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">retro_gamer</span>
                    <div className="flex items-center gap-1">
                      {renderStars(4)}
                    </div>
                  </div>
                  <h4 className="font-medium text-white mb-2">Cyberpunk 2077</h4>
                  <p className="text-gray-300 text-sm line-clamp-3">
                    "The 2.0 update completely transformed this game. Night City finally feels alive and the gameplay is smooth as butter..."
                  </p>
                  <p className="text-xs text-gray-500 mt-2">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
