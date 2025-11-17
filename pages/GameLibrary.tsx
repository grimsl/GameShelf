import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GameCard } from '../components/GameCard';
import { SteamGameCard } from '../components/SteamGameCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SteamSync } from '../components/SteamSync';
import { Plus, Filter, Search } from 'lucide-react';
import { SteamAmplifyService } from '../services/steamAmplifyService';


const STATUS_FILTERS = [
  { value: 'all', label: 'All Games' },
  { value: 'playing', label: 'Currently Playing' },
  { value: 'finished', label: 'Finished' },
  { value: 'paused', label: 'Paused' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'planning', label: 'Planning to Play' },
];

export function GameLibrary() {
  const [games, setGames] = useState<any[]>([]);
  const [filteredGames, setFilteredGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [steamConnected, setSteamConnected] = useState(false);

  useEffect(() => {
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

    // Listen for Steam library sync events
    const handleSteamLibrarySynced = (event: CustomEvent) => {
      console.log('Steam library synced event received in GameLibrary:', event.detail);
      loadGames();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gameAdded', handleGameAdded);
    window.addEventListener('steamLibrarySynced', handleSteamLibrarySynced as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gameAdded', handleGameAdded);
      window.removeEventListener('steamLibrarySynced', handleSteamLibrarySynced as EventListener);
    };
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchTerm, statusFilter]);

  const loadGames = async () => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Load games from localStorage
      const savedGames = localStorage.getItem('gameshelf-games');
      const manualGames = savedGames ? JSON.parse(savedGames) : [];
      
      // Load Steam games if user is connected
      const userId = "demo_user_id"; // In real app, get from auth context
      let steamGames = [];
      
      try {
        // Try to load from database first
        const dbGames = await SteamAmplifyService.loadSteamGamesFromDatabase(userId);
        if (dbGames.length > 0) {
          steamGames = dbGames;
          console.log('GameLibrary: Loaded Steam games from database:', steamGames.length, 'games');
        } else {
          // Fallback to localStorage
          const steamData = localStorage.getItem(`gameshelf-steam-data-${userId}`);
          if (steamData) {
            const libraryEntries = localStorage.getItem(`gameshelf-library-entries-${userId}`);
            if (libraryEntries) {
              steamGames = JSON.parse(libraryEntries);
              console.log('GameLibrary: Loaded Steam games from localStorage:', steamGames.length, 'games');
            }
          }
        }
      } catch (error) {
        console.error('Error loading Steam games:', error);
        // Fallback to localStorage
        const steamData = localStorage.getItem(`gameshelf-steam-data-${userId}`);
        if (steamData) {
          const libraryEntries = localStorage.getItem(`gameshelf-library-entries-${userId}`);
          if (libraryEntries) {
            steamGames = JSON.parse(libraryEntries);
          }
        }
      }
      
      // Combine manual and Steam games
      const allGames = [...manualGames, ...steamGames];
      
      console.log('GameLibrary: Total games loaded:', allGames.length, 'games');
      console.log('GameLibrary: Manual games:', manualGames.length, 'Steam games:', steamGames.length);
      
      setGames(allGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGames = () => {
    let filtered = games;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(game =>
        game.gameTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (game.notes && game.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(game => game.status === statusFilter);
    }

    setFilteredGames(filtered);
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return games.length;
    return games.filter(game => game.status === status).length;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Game Library</h1>
          <p className="text-gray-400 mt-2">
            {games.length} {games.length === 1 ? 'game' : 'games'} in your collection
          </p>
        </div>
        <Link 
          to="/add-game" 
          className="btn btn-primary flex items-center gap-2 w-fit"
        >
          <Plus className="w-5 h-5" />
          Add Game
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input min-w-[200px]"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label} ({getStatusCount(filter.value)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Steam Sync Section */}
      {steamConnected && (
        <div className="mb-8">
          <SteamSync
            userId="demo_user_id"
            steamId="demo_steam_id"
            onSyncComplete={() => {
              loadGames();
            }}
          />
        </div>
      )}

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="game-grid">
          {filteredGames.map((game) => (
            game.isFromSteam ? (
              <SteamGameCard key={game.id} entry={game} />
            ) : (
              <GameCard key={game.id} entry={game} />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {searchTerm || statusFilter !== 'all' ? (
            <>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No games found
              </h3>
              <p className="text-gray-400 mb-8">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Your library is empty
              </h3>
              <p className="text-gray-400 mb-8">
                Start building your game collection by adding your first game
              </p>
              <Link 
                to="/add-game" 
                className="btn btn-primary flex items-center gap-2 mx-auto w-fit"
              >
                <Plus className="w-5 h-5" />
                Add Your First Game
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
