import { Link } from 'react-router-dom';
import { Star, Calendar, Edit, MessageSquare, Clock, Trophy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { ReviewModal } from './ReviewModal';
import { SteamAmplifyService } from '../services/steamAmplifyService';

interface SteamGameCardProps {
  entry: any;
  showUser?: boolean;
}

export function SteamGameCard({ entry, showUser = false }: SteamGameCardProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing': return 'status-playing';
      case 'finished': return 'status-finished';
      case 'paused': return 'status-paused';
      case 'dropped': return 'status-dropped';
      case 'planning': return 'status-planning';
      default: return 'status-planning';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSteamDate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}
        fill={i < rating ? 'currentColor' : 'none'}
      />
    ));
  };

  const handleReviewSave = (rating: number, notes: string) => {
    // In a real app, this would update the database
    console.log('Saving review:', { rating, notes, gameId: entry.id });
    // Update the entry with new rating and notes
    entry.rating = rating;
    entry.notes = notes;
  };

  const getAchievementProgress = () => {
    if (!entry.steamAchievements || !Array.isArray(entry.steamAchievements)) {
      return null;
    }
    return SteamAmplifyService.getAchievementProgress(entry.steamAchievements);
  };

  const achievementProgress = getAchievementProgress();

  return (
    <div className="card group hover:scale-105 transition-transform">
      {/* Game Cover */}
      <div className="aspect-[3/4] mb-4 rounded-lg overflow-hidden bg-gray-700 relative">
        {entry.gameCover ? (
          <img
            src={entry.gameCover}
            alt={entry.gameTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <span className="text-4xl">🎮</span>
          </div>
        )}
        
        {/* Steam Badge */}
        {entry.isFromSteam && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Steam
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-white text-lg mb-1 line-clamp-2">
            {entry.gameTitle}
          </h3>
          {showUser && (
            <p className="text-sm text-gray-400">
              by {entry.user?.userHandle || 'Unknown User'}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`status-badge ${getStatusColor(entry.status)}`}>
            {entry.status}
          </span>
          {entry.rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              {renderStars(entry.rating)}
            </div>
          )}
        </div>

        {/* Steam Playtime */}
        {entry.steamPlaytimeTotal !== undefined && entry.steamPlaytimeTotal > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              {SteamAmplifyService.formatPlaytime(entry.steamPlaytimeTotal)}
              {entry.steamPlaytimeRecent > 0 && (
                <span className="text-green-400 ml-1">
                  (+{SteamAmplifyService.formatPlaytime(entry.steamPlaytimeRecent)} recent)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Steam Last Played */}
        {entry.steamLastPlayed && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Last played: {formatSteamDate(new Date(entry.steamLastPlayed).getTime() / 1000)}</span>
          </div>
        )}

        {/* Achievement Progress */}
        {achievementProgress !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Trophy className="w-4 h-4" />
            <span>{achievementProgress}% achievements</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${achievementProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {entry.notes && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {entry.notes}
          </p>
        )}

        {/* Date */}
        {entry.createdAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            Added: {formatDate(entry.createdAt)}
          </div>
        )}

        {/* Steam Sync Date */}
        {entry.steamSyncDate && (
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <ExternalLink className="w-3 h-3" />
            Synced: {formatDate(entry.steamSyncDate)}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to={`/game/${entry.id}`}
            className="text-indigo-500 hover:text-indigo-400 text-sm font-medium transition-colors"
          >
            View Details
          </Link>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowReviewModal(true)}
              className="text-gray-400 hover:text-indigo-400 transition-colors"
              title="Write Review"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors" title="Edit">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        gameTitle={entry.gameTitle}
        gameCover={entry.gameCover}
        initialRating={entry.rating || 0}
        initialNotes={entry.notes || ''}
        onSave={handleReviewSave}
      />
    </div>
  );
}

