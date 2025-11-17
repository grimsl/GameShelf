import { Link } from 'react-router-dom';
import { Star, Calendar, Edit, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { ReviewModal } from './ReviewModal';

interface GameCardProps {
  entry: any;
  showUser?: boolean;
}

export function GameCard({ entry, showUser = false }: GameCardProps) {
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

  return (
    <div className="card group hover:scale-105 transition-transform">
      {/* Game Cover */}
      <div className="aspect-[3/4] mb-4 rounded-lg overflow-hidden bg-gray-700">
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
            {formatDate(entry.createdAt)}
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

