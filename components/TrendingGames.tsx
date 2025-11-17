import { useState, useEffect } from 'react';
import { Users, Star, TrendingUp } from 'lucide-react';
import { gameDatabase, type GameDatabaseEntry } from '../services/gameDatabase';

interface TrendingGamesProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export function TrendingGames({ limit = 6, showTitle = true, className = '' }: TrendingGamesProps) {
  const [trendingGames, setTrendingGames] = useState<GameDatabaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrendingGames = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const trending = await gameDatabase.getTrendingGames(limit);
        setTrendingGames(trending);
      } catch (err) {
        console.error('Error loading trending games:', err);
        setError('Failed to load trending games');
        // Set empty array on error
        setTrendingGames([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingGames();
  }, [limit]);

  const formatPlayerCount = (count: number | undefined): string => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getTrendingBadge = (index: number) => {
    if (index === 0) return '🔥';
    if (index === 1) return '⚡';
    if (index === 2) return '🚀';
    return `${index + 1}`;
  };

  if (loading) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Trending Games</h2>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="aspect-3/4 rounded-xl overflow-hidden bg-gray-800 mb-3 shadow-lg animate-pulse">
                <div className="w-full h-full bg-gray-700"></div>
              </div>
              <div className="h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Trending Games</h2>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">⚠️</div>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (trendingGames.length === 0) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Trending Games</h2>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🎮</div>
          <p className="text-gray-400">No trending games available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Trending Games</h2>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {trendingGames.map((game, index) => (
          <div key={`trending-${game.appid}-${index}`} className="group cursor-pointer relative">
            {/* Trending Badge */}
            <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {getTrendingBadge(index)}
            </div>
            
            {/* Game Image */}
            <div className="aspect-3/4 rounded-xl overflow-hidden bg-gray-800 mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300 relative">
              <img
                src={game.header_image}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/300x400/1f2937/9ca3af?text=Game';
                }}
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Game Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors">
                {game.name}
              </h3>
              
              {/* Player Count */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Users className="w-3 h-3" />
                <span>{formatPlayerCount(game.player_count?.current)} players</span>
              </div>
              
              {/* Price */}
              {game.price_overview && (
                <div className="flex items-center gap-2">
                  {game.price_overview.discount_percent > 0 && (
                    <span className="text-xs bg-red-600 text-white px-1 py-0.5 rounded">
                      -{game.price_overview.discount_percent}%
                    </span>
                  )}
                  <span className="text-xs text-green-400 font-medium">
                    {game.price_overview.final_formatted}
                  </span>
                </div>
              )}
              
              {/* Genres */}
              {game.genres && game.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {game.genres.slice(0, 2).map((genre, genreIndex) => (
                    <span 
                      key={`genre-${game.appid}-${genreIndex}-${genre}`}
                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Metacritic Score */}
              {game.metacritic_score && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-gray-400">
                    {game.metacritic_score}/100
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
