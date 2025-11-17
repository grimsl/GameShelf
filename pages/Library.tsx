import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Grid, List, Star, Plus, Heart, Clock, DollarSign } from 'lucide-react';
import { gameDatabase, type GameDatabaseEntry } from '../services/gameDatabase';
// Legacy import removed - using Amplify backend now
import { authService } from '../services/authService';
import { ErrorHandler } from '../utils/errorHandler';
import { useDebounce } from '../hooks/useDebounce';
import { useAsync } from '../hooks/useAsync';
// Define types locally to avoid import issues
interface GameDatabaseEntry {
  appid: number;
  name: string;
  header_image: string;
  capsule_image: string;
  short_description?: string;
  genres?: string[];
  developers?: string[];
  publishers?: string[];
  release_date?: string;
  price_overview?: {
    final: number;
    final_formatted: string;
    initial_formatted?: string;
    discount_percent?: number;
  };
  metacritic_score?: number;
  is_free?: boolean;
  platforms?: string[];
  player_count?: {
    current: number;
    peak_24h: number;
    peak_all_time: number;
  };
}

interface FilterOptions {
  search: string;
  genre: string;
  priceRange: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}
import { ariaLabels, semanticAttributes } from '../utils/accessibility';
import toast from 'react-hot-toast';

interface LibraryFilters {
  search: string;
  genre: string;
  priceRange: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}

const GENRES = [
  'All Genres',
  'Action',
  'Adventure',
  'RPG',
  'Strategy',
  'Simulation',
  'Sports',
  'Racing',
  'Fighting',
  'Shooter',
  'Platformer',
  'Puzzle',
  'Horror',
  'Indie',
  'Free to Play'
];

const PRICE_RANGES = [
  'All Prices',
  'Free',
  'Under $10',
  '$10 - $25',
  '$25 - $50',
  'Over $50'
];

const SORT_OPTIONS = [
  'Most Popular',
  'Newest',
  'Price: Low to High',
  'Price: High to Low',
  'Name A-Z',
  'Name Z-A',
  'Highest Rated'
];

export function Library() {
  const [games, setGames] = useState<GameDatabaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [filters, setFilters] = useState<LibraryFilters>({
    search: '',
    genre: 'All Genres',
    priceRange: 'All Prices',
    sortBy: 'Most Popular',
    viewMode: 'grid'
  });
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 300);

  const ITEMS_PER_PAGE = 20;

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    
    checkAuth();
    authService.addAuthStateListener(checkAuth);
    
    return () => {
      authService.removeAuthStateListener(checkAuth);
    };
  }, []);

  // Load games based on filters (use debounced search)
  useEffect(() => {
    loadGames(true);
  }, [debouncedSearch, filters.genre, filters.priceRange, filters.sortBy]);

  const loadGames = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setCurrentPage(0);
      setGames([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const page = reset ? 0 : currentPage;
      const offset = page * ITEMS_PER_PAGE;

      let gamesData: GameDatabaseEntry[] = [];

      if (debouncedSearch) {
        // Search games
        const searchResult = await gameDatabase.searchGames(debouncedSearch, ITEMS_PER_PAGE, Math.floor(offset / ITEMS_PER_PAGE) + 1);
        gamesData = searchResult.games || [];
      } else if (filters.genre !== 'All Genres') {
        // Filter by genre
        const genreResult = await gameDatabase.getGamesByGenre(filters.genre, ITEMS_PER_PAGE);
        gamesData = genreResult || [];
      } else {
        // Get trending games
        const trendingResult = await gameDatabase.getTrendingGames(ITEMS_PER_PAGE);
        gamesData = trendingResult || [];
      }

      // Apply price filter
      if (filters.priceRange !== 'All Prices') {
        gamesData = gamesData.filter(game => {
          if (!game.price_overview) return filters.priceRange === 'Free';
          
          const price = game.price_overview.final;
          switch (filters.priceRange) {
            case 'Free':
              return price === 0;
            case 'Under $10':
              return price > 0 && price < 1000; // Steam prices in cents
            case '$10 - $25':
              return price >= 1000 && price <= 2500;
            case '$25 - $50':
              return price > 2500 && price <= 5000;
            case 'Over $50':
              return price > 5000;
            default:
              return true;
          }
        });
      }

      // Apply sorting
      gamesData = sortGames(gamesData, filters.sortBy);

      if (reset) {
        setGames(gamesData);
      } else {
        setGames(prev => [...prev, ...gamesData]);
      }

      setHasMore(gamesData.length === ITEMS_PER_PAGE);
      setCurrentPage(page + 1);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Failed to load games');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const sortGames = (games: GameDatabaseEntry[], sortBy: string): GameDatabaseEntry[] => {
    return [...games].sort((a, b) => {
      switch (sortBy) {
        case 'Newest':
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        case 'Price: Low to High':
          return (a.price_overview?.final || 0) - (b.price_overview?.final || 0);
        case 'Price: High to Low':
          return (b.price_overview?.final || 0) - (a.price_overview?.final || 0);
        case 'Name A-Z':
          return a.name.localeCompare(b.name);
        case 'Name Z-A':
          return b.name.localeCompare(a.name);
        case 'Highest Rated':
          return (b.metacritic_score || 0) - (a.metacritic_score || 0);
        default: // Most Popular
          return (b.player_count?.current || 0) - (a.player_count?.current || 0);
      }
    });
  };

  const handleAddToMyGames = async (game: GameDatabaseEntry) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add games to your collection');
      return;
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        toast.error('User not found');
        return;
      }

      // Get existing my games
      const myGamesKey = `gameshelf-my-games-${currentUser.id}`;
      const existingGames = JSON.parse(localStorage.getItem(myGamesKey) || '[]');
      
      // Check if game already exists
      if (existingGames.some((g: any) => g.appid === game.appid)) {
        toast.error('Game already in your collection');
        return;
      }

      // Add game to collection
      const newGame = {
        appid: game.appid,
        name: game.name,
        header_image: game.header_image,
        capsule_image: game.capsule_image,
        short_description: game.short_description,
        genres: game.genres,
        developers: game.developers,
        publishers: game.publishers,
        release_date: game.release_date,
        price_overview: game.price_overview,
        metacritic_score: game.metacritic_score,
        is_free: game.is_free,
        platforms: game.platforms,
        addedDate: new Date().toISOString(),
        status: 'wishlist' // Default status
      };

      existingGames.push(newGame);
      localStorage.setItem(myGamesKey, JSON.stringify(existingGames));
      
      toast.success(`Added ${game.name} to your collection!`);
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('myGamesUpdated'));
    } catch (error) {
      console.error('Error adding game to collection:', error);
      toast.error('Failed to add game to collection');
    }
  };

  // Check if game is already in My Games
  const isGameInMyGames = (game: GameDatabaseEntry): boolean => {
    if (!isAuthenticated) return false;
    
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return false;
      
      const myGamesKey = `gameshelf-my-games-${currentUser.id}`;
      const existingGames = JSON.parse(localStorage.getItem(myGamesKey) || '[]');
      return existingGames.some((g: any) => g.appid === game.appid);
    } catch (error) {
      return false;
    }
  };

  const handleFilterChange = (key: keyof LibraryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadGames(false);
    }
  };

  const formatPrice = (priceOverview: any) => {
    if (!priceOverview) return 'Free';
    return priceOverview.final_formatted || `$${(priceOverview.final / 100).toFixed(2)}`;
  };

  const formatPlayerCount = (count: number | undefined): string => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Game Library</h1>
              <p className="text-gray-400 text-lg">
                Discover and add games from the entire Steam catalog to your collection
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-400">
                {games.length}
              </div>
              <div className="text-sm text-gray-400">games found</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search games..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Genre Filter */}
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {GENRES.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            {/* Price Filter */}
            <select
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRICE_RANGES.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">View:</span>
              <button
                onClick={() => handleFilterChange('viewMode', 'grid')}
                className={`p-2 rounded ${filters.viewMode === 'grid' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleFilterChange('viewMode', 'list')}
                className={`p-2 rounded ${filters.viewMode === 'list' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <div className="text-gray-400">
              {games.length} games found
            </div>
          </div>
        </div>

        {/* Games Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="aspect-3/4 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className={filters.viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {games.map((game) => (
                <div key={game.appid} className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors ${
                  filters.viewMode === 'list' ? 'flex' : ''
                }`}>
                  {/* Game Image */}
                  <div className={`${filters.viewMode === 'list' ? 'w-32 h-20' : 'aspect-3/4'} relative`}>
                    <img
                      src={game.header_image}
                      alt={game.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/300x400/1f2937/9ca3af?text=Game';
                      }}
                    />
                    {game.price_overview?.discount_percent > 0 && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        -{game.price_overview.discount_percent}%
                      </div>
                    )}
                  </div>

                  {/* Game Info */}
                  <div className="p-4 flex-1">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">{game.name}</h3>
                    
                    {filters.viewMode === 'list' && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{game.short_description}</p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatPlayerCount(game.player_count?.current)} players</span>
                      </div>
                      {game.metacritic_score && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-400">{game.metacritic_score}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-green-400 font-medium">
                        {formatPrice(game.price_overview)}
                      </div>
                      <button
                        onClick={() => handleAddToMyGames(game)}
                        disabled={isGameInMyGames(game)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                          isGameInMyGames(game)
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isGameInMyGames(game) ? (
                          <>
                            <Heart className="w-4 h-4" fill="currentColor" />
                            In My Games
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add to My Games
                          </>
                        )}
                      </button>
                    </div>

                    {/* Genres */}
                    {game.genres && game.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {game.genres.slice(0, 2).map((genre, index) => (
                          <span 
                            key={`${game.appid}-genre-${index}-${genre}`}
                            className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? 'Loading...' : 'Load More Games'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
