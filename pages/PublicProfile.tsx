import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GameCard } from '../components/GameCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { User, Calendar, Gamepad2 } from 'lucide-react';

// Mock data for development until database is implemented properly again
const mockUser = {
  id: '1',
  userHandle: 'demo_user',
  bio: 'Gaming enthusiast and developer',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  email: 'demo@example.com',
};

const mockGames = [
  {
    id: '1',
    gameTitle: 'The Legend of Zelda: Breath of the Wild',
    gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg',
    status: 'playing',
    rating: 5,
    notes: 'Absolutely incredible open world experience!',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    gameTitle: 'Elden Ring',
    gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2rpf.jpg',
    status: 'finished',
    rating: 5,
    notes: 'Masterpiece of game design and world building.',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    gameTitle: 'Hades',
    gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2l6u.jpg',
    status: 'paused',
    rating: 4,
    notes: 'Great roguelike, taking a break for now.',
    createdAt: '2024-01-05T10:00:00Z',
  },
];

export function PublicProfile() {
  const { userHandle } = useParams<{ userHandle: string }>();
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userHandle) {
      loadUserProfile();
    }
  }, [userHandle]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demo purposes, always return the mock user
      if (userHandle === 'demo_user') {
        setUser(mockUser);
        setGames(mockGames);
      } else {
        // User not found
        setUser(null);
        setGames([]);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalGames = games.length;
    const playing = games.filter(game => game.status === 'playing').length;
    const finished = games.filter(game => game.status === 'finished').length;
    const averageRating = games
      .filter(game => game.rating)
      .reduce((sum, game) => sum + game.rating, 0) / games.filter(game => game.rating).length || 0;

    return { totalGames, playing, finished, averageRating };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-white mb-4">User Not Found</h2>
        <p className="text-gray-400">
          The user "{userHandle}" doesn't exist or their profile is private.
        </p>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.userHandle}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {user.userHandle}
            </h1>
            {user.bio && (
              <p className="text-gray-300 mb-4">{user.bio}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined recently
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="card text-center">
          <div className="text-3xl font-bold text-indigo-500 mb-2">
            {stats.totalGames}
          </div>
          <div className="text-gray-400">Total Games</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-500 mb-2">
            {stats.playing}
          </div>
          <div className="text-gray-400">Currently Playing</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-500 mb-2">
            {stats.finished}
          </div>
          <div className="text-gray-400">Completed</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-500 mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="text-gray-400">Avg Rating</div>
        </div>
      </div>

      {/* Games Library */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Gamepad2 className="w-6 h-6 text-indigo-500" />
          <h2 className="text-2xl font-bold text-white">
            {user.userHandle}'s Game Library
          </h2>
        </div>

        {games.length > 0 ? (
          <div className="game-grid">
            {games.map((game) => (
              <GameCard key={game.id} entry={game} showUser={false} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No games yet
            </h3>
            <p className="text-gray-400">
              {user.userHandle} hasn't added any games to their library yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
