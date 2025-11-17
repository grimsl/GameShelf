import { useMemo } from 'react';

// Define types locally to avoid import issues
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

interface GameStats {
  totalGames: number;
  playing: number;
  finished: number;
  paused: number;
  dropped: number;
  planning: number;
  averageRating: number;
  totalHoursPlayed: number;
}

/**
 * Hook to calculate game statistics
 */
export const useGameStats = (games: Game[]): GameStats => {
  return useMemo(() => {
    const totalGames = games.length;
    const playing = games.filter(game => game.status === 'playing').length;
    const finished = games.filter(game => game.status === 'finished').length;
    const paused = games.filter(game => game.status === 'paused').length;
    const dropped = games.filter(game => game.status === 'dropped').length;
    const planning = games.filter(game => game.status === 'planning').length;
    
    const ratedGames = games.filter(game => game.rating > 0);
    const averageRating = ratedGames.length > 0 
      ? ratedGames.reduce((sum, game) => sum + game.rating, 0) / ratedGames.length 
      : 0;
    
    const totalHoursPlayed = games.reduce((sum, game) => sum + (game.hoursPlayed || 0), 0);
    
    return {
      totalGames,
      playing,
      finished,
      paused,
      dropped,
      planning,
      averageRating: Math.round(averageRating * 10) / 10,
      totalHoursPlayed: Math.round(totalHoursPlayed)
    };
  }, [games]);
};
