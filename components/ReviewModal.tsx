import { useState } from 'react';
import { Star, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameCover?: string;
  initialRating?: number;
  initialNotes?: string;
  onSave: (rating: number, notes: string) => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  gameTitle,
  gameCover,
  initialRating = 0,
  initialNotes = '',
  onSave,
}: ReviewModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [notes, setNotes] = useState(initialNotes);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSave = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    onSave(rating, notes);
    onClose();
    toast.success('Review saved successfully!');
  };

  const handleClose = () => {
    setRating(initialRating);
    setNotes(initialNotes);
    setHoveredRating(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Write a Review</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Game Info */}
          <div className="flex items-center gap-4 mb-6">
            {gameCover && (
              <img
                src={gameCover}
                alt={gameTitle}
                className="w-16 h-20 object-cover rounded"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{gameTitle}</h3>
              <p className="text-gray-400">Rate and review this game</p>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">
              Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-600'
                    }`}
                    fill={star <= (hoveredRating || rating) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
              <span className="ml-3 text-gray-400">
                {rating > 0 && (
                  <>
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">
              Review (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
              rows={6}
              placeholder="Share your thoughts about this game..."
              maxLength={1000}
            />
            <div className="text-right text-sm text-gray-400 mt-1">
              {notes.length}/1000 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
