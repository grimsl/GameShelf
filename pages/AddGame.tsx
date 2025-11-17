import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Save, ArrowLeft, Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
// Define Game interface and data locally to avoid import issues
interface Game {
  id: string;
  title: string;
  cover: string;
  description: string;
  genre: string;
  platform: string;
  releaseYear: number;
  rating: number;
  developer: string;
  publisher: string;
}

// Game library data --mock data until the database is implemented properly again
const gameLibrary: Game[] = [
  {
    id: '1',
    title: 'Baldur\'s Gate 3',
    cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6w2a.jpg',
    description: 'A next-generation RPG set in the world of Dungeons & Dragons.',
    genre: 'RPG',
    platform: 'PC',
    releaseYear: 2023,
    rating: 4.8,
    developer: 'Larian Studios',
    publisher: 'Larian Studios'
  },
  {
    id: '2',
    title: 'Cyberpunk 2077',
    cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg',
    description: 'An open-world, action-adventure story set in Night City.',
    genre: 'Action RPG',
    platform: 'PC',
    releaseYear: 2020,
    rating: 4.2,
    developer: 'CD Projekt RED',
    publisher: 'CD Projekt RED'
  },
  {
    id: '3',
    title: 'The Legend of Zelda: Breath of the Wild',
    cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
    description: 'An action-adventure game set in an open world environment.',
    genre: 'Action Adventure',
    platform: 'Nintendo Switch',
    releaseYear: 2017,
    rating: 4.9,
    developer: 'Nintendo EPD',
    publisher: 'Nintendo'
  },
  {
    id: '4',
    title: 'Elden Ring',
    cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2rpf.jpg',
    description: 'A fantasy action-RPG adventure set within a world created by Hidetaka Miyazaki.',
    genre: 'Action RPG',
    platform: 'PC',
    releaseYear: 2022,
    rating: 4.7,
    developer: 'FromSoftware',
    publisher: 'Bandai Namco Entertainment'
  },
  {
    id: '5',
    title: 'God of War',
    cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r6y.jpg',
    description: 'A third-person action-adventure game set in ancient Greece.',
    genre: 'Action Adventure',
    platform: 'PlayStation',
    releaseYear: 2018,
    rating: 4.6,
    developer: 'Santa Monica Studio',
    publisher: 'Sony Interactive Entertainment'
  }
];

const searchGames = (query: string): Game[] => {
  const lowercaseQuery = query.toLowerCase();
  return gameLibrary.filter(game => 
    game.title.toLowerCase().includes(lowercaseQuery) ||
    game.genre.toLowerCase().includes(lowercaseQuery) ||
    game.developer.toLowerCase().includes(lowercaseQuery)
  );
};

const GAME_STATUSES = [
  { value: 'playing', label: 'Currently Playing' },
  { value: 'finished', label: 'Finished' },
  { value: 'paused', label: 'Paused' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'planning', label: 'Planning to Play' },
];

export function AddGame() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({
    status: 'planning',
    rating: 0,
    notes: '',
  });

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchGames(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setSearchQuery(game.title);
    setSearchResults([]);
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    if (!selectedGame) {
      console.log('Please select a game from the library');
      toast.error('Please select a game from the library');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting to add game...');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create new game entry
      const newGame = {
        id: Date.now().toString(), // Simple ID generation
        gameTitle: selectedGame.title,
        gameCover: selectedGame.cover,
        description: selectedGame.description,
        status: formData.status,
        rating: formData.rating,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        user: { userHandle: 'demo_user' },
      };

      // Get existing games from localStorage
      const existingGames = localStorage.getItem('gameshelf-games');
      const games = existingGames ? JSON.parse(existingGames) : [];
      
      // Add new game to the beginning of the array
      games.unshift(newGame);
      
      // Save back to localStorage
      localStorage.setItem('gameshelf-games', JSON.stringify(games));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('gameAdded', { detail: newGame }));

      console.log('AddGame: Game added to localStorage:', newGame);
      console.log('AddGame: Total games in localStorage:', games.length);

      toast.success('Game added to your library!');
      navigate('/');
    } catch (error) {
      console.error('Error adding game:', error);
      toast.error('Failed to add game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => handleRatingChange(i + 1)}
        className="star"
      >
        <Star
          className={`w-6 h-6 ${i < formData.rating ? 'filled' : ''}`}
          fill={i < formData.rating ? 'currentColor' : 'none'}
        />
      </button>
    ));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-white">Add New Game</h1>
        <p className="text-gray-400 mt-2">
          Add a game to your library and start tracking your progress
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game Search Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">Select Game from Library</h2>
          
          <div className="form-group">
            <label htmlFor="gameSearch" className="form-label">
              Search Games *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="gameSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10"
                placeholder="Search for a game..."
                required
              />
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto border border-gray-600 rounded-lg bg-gray-800">
                {searchResults.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => handleGameSelect(game)}
                    className="flex items-center gap-4 p-4 hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <img
                      src={game.cover}
                      alt={game.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{game.title}</h3>
                      <p className="text-sm text-gray-400">{game.genre} • {game.platform} • {game.releaseYear}</p>
                      <p className="text-xs text-gray-500 mt-1">{game.developer}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Game Display */}
          {selectedGame && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-indigo-500">
              <div className="flex items-center gap-4">
                <img
                  src={selectedGame.cover}
                  alt={selectedGame.title}
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{selectedGame.title}</h3>
                  <p className="text-sm text-gray-400">{selectedGame.genre} • {selectedGame.platform} • {selectedGame.releaseYear}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedGame.developer}</p>
                  <p className="text-sm text-gray-300 mt-2">{selectedGame.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGame(null);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">Your Progress</h2>
          
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-input"
              >
                {GAME_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Rating</label>
              <div className="star-rating">
                {renderStars()}
                {formData.rating > 0 && (
                  <span className="ml-2 text-sm text-gray-400">
                    {formData.rating}/5
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="form-input form-textarea"
                placeholder="Your thoughts, progress, or anything else about this game..."
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="spinner w-4 h-4"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Add to Library
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
