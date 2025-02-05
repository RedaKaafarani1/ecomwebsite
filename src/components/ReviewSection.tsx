import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ReviewSectionProps {
  productId: number;
  reviews: Review[];
  onReviewAdded: () => void;
}

export function ReviewSection({ productId, reviews, onReviewAdded }: ReviewSectionProps) {
  const { user } = useAuth();
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewReactions, setReviewReactions] = useState<Record<number, { up: number; down: number; user_reaction?: 'up' | 'down' }>>({});

  useEffect(() => {
    async function fetchReactions() {
      if (!reviews.length) return;

      try {
        // Fetch all reactions for the reviews
        const { data: reactions, error } = await supabase
          .from('review_reactions')
          .select('*')
          .in('review_id', reviews.map(r => r.id));

        if (error) throw error;

        // Calculate counts and user reactions
        const reactionCounts: Record<number, { up: number; down: number; user_reaction?: 'up' | 'down' }> = {};
        
        reviews.forEach(review => {
          const reviewReactions = reactions?.filter(r => r.review_id === review.id) || [];
          const upCount = reviewReactions.filter(r => r.reaction_type === 'up').length;
          const downCount = reviewReactions.filter(r => r.reaction_type === 'down').length;
          const userReaction = reviewReactions.find(r => r.user_id === user?.id)?.reaction_type;

          reactionCounts[review.id] = {
            up: upCount,
            down: downCount,
            user_reaction: userReaction as 'up' | 'down' | undefined
          };
        });

        setReviewReactions(reactionCounts);
      } catch (err) {
        console.error('Error fetching reactions:', err);
      }
    }

    fetchReactions();
  }, [reviews, user?.id]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const ratingCounts = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleReaction = async (reviewId: number, type: 'up' | 'down') => {
    if (!user) return;

    try {
      const currentReaction = reviewReactions[reviewId]?.user_reaction;

      if (currentReaction === type) {
        // Remove reaction if clicking the same button
        const { error } = await supabase
          .from('review_reactions')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);

        if (error) throw error;

        setReviewReactions(prev => ({
          ...prev,
          [reviewId]: {
            up: type === 'up' ? prev[reviewId].up - 1 : prev[reviewId].up,
            down: type === 'down' ? prev[reviewId].down - 1 : prev[reviewId].down,
            user_reaction: undefined
          }
        }));
      } else {
        // If there's an existing reaction, remove it first
        if (currentReaction) {
          await supabase
            .from('review_reactions')
            .delete()
            .eq('review_id', reviewId)
            .eq('user_id', user.id);
        }

        // Add new reaction
        const { error } = await supabase
          .from('review_reactions')
          .insert({
            review_id: reviewId,
            user_id: user.id,
            reaction_type: type
          });

        if (error) throw error;

        setReviewReactions(prev => ({
          ...prev,
          [reviewId]: {
            up: type === 'up' ? prev[reviewId].up + 1 : currentReaction === 'up' ? prev[reviewId].up - 1 : prev[reviewId].up,
            down: type === 'down' ? prev[reviewId].down + 1 : currentReaction === 'down' ? prev[reviewId].down - 1 : prev[reviewId].down,
            user_reaction: type
          }
        }));
      }
    } catch (err) {
      console.error('Error updating reaction:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const { error: submitError } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          title: title.trim(),
          content: content.trim()
        });

      if (submitError) throw submitError;

      setIsWritingReview(false);
      setRating(5);
      setTitle('');
      setContent('');
      onReviewAdded();
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="text-center md:text-left">
          <div className="text-4xl font-bold text-vitanic-dark-olive mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className="text-yellow-500"
                fill={star <= Math.round(averageRating) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <div className="text-sm text-vitanic-dark-olive/60">
            Based on {reviews.length} reviews
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-24">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className="text-yellow-500"
                    fill={s <= star ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{
                    width: `${(ratingCounts[star] || 0) / reviews.length * 100}%`
                  }}
                />
              </div>
              <div className="w-12 text-sm text-vitanic-dark-olive/60 text-right">
                {ratingCounts[star] || 0}
              </div>
            </div>
          ))}
        </div>

        <div>
          {user ? (
            <button
              onClick={() => setIsWritingReview(true)}
              className="px-6 py-3 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors"
            >
              Write a Review
            </button>
          ) : (
            <p className="text-sm text-vitanic-dark-olive/60">
              Please sign in to write a review
            </p>
          )}
        </div>
      </div>

      {/* Review Form */}
      {isWritingReview && (
        <form onSubmit={handleSubmit} className="border border-vitanic-pale-olive rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-vitanic-dark-olive mb-2">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-yellow-500 hover:scale-110 transition-transform"
                >
                  <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-vitanic-dark-olive mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-vitanic-pale-olive rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-vitanic-dark-olive mb-2">
              Review
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-vitanic-pale-olive rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive"
              rows={4}
              required
              maxLength={1000}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle size={16} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsWritingReview(false)}
              className="px-4 py-2 text-vitanic-dark-olive hover:bg-vitanic-pale-olive rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-vitanic-pale-olive pb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className="text-yellow-500"
                        fill={star <= review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <h3 className="font-semibold text-vitanic-dark-olive">
                    {review.title}
                  </h3>
                </div>
                <p className="text-sm text-vitanic-dark-olive/60">
                  By {review.user?.first_name} {review.user?.last_name} on{' '}
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReaction(review.id, 'up')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    reviewReactions[review.id]?.user_reaction === 'up'
                      ? 'bg-vitanic-olive text-white'
                      : 'text-vitanic-dark-olive/60 hover:bg-vitanic-pale-olive'
                  }`}
                  title="Helpful"
                >
                  <ThumbsUp size={16} />
                  <span className="text-sm">{reviewReactions[review.id]?.up || 0}</span>
                </button>
                <button
                  onClick={() => handleReaction(review.id, 'down')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    reviewReactions[review.id]?.user_reaction === 'down'
                      ? 'bg-red-500 text-white'
                      : 'text-vitanic-dark-olive/60 hover:bg-vitanic-pale-olive'
                  }`}
                  title="Not Helpful"
                >
                  <ThumbsDown size={16} />
                  <span className="text-sm">{reviewReactions[review.id]?.down || 0}</span>
                </button>
              </div>
            </div>
            <p className="text-vitanic-dark-olive/80 whitespace-pre-line">
              {review.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}