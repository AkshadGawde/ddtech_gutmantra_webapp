import { motion } from "motion/react";
import { Star, User } from "lucide-react";
import { useState } from "react";

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  verified?: boolean;
}

interface ReviewsSectionProps {
  productId: string;
  productName: string;
}

// Mock reviews data - replace with Firestore fetch
const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    author: "Priya Sharma",
    rating: 5,
    text: "Excellent quality! The Lokwan Premium atta is incredibly fine and perfect for rotis. Highly recommended!",
    date: "2 weeks ago",
    verified: true,
  },
  {
    id: "2",
    author: "Rajesh Kumar",
    rating: 4,
    text: "Good product and fast delivery. Would prefer if packaging was even more premium.",
    date: "1 month ago",
    verified: true,
  },
  {
    id: "3",
    author: "Neha Patel",
    rating: 5,
    text: "Best atta I've used! The texture is perfect and it lasts longer than other brands.",
    date: "1 month ago",
    verified: true,
  },
];

export default function ReviewsSection({ productId, productName }: ReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", rating: 5, text: "" });

  const reviews = MOCK_REVIEWS;

  const averageRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }));

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.text) {
      alert("Please fill all fields");
      return;
    }
    // TODO: Send to Firestore
    console.log("New review:", newReview);
    setNewReview({ name: "", rating: 5, text: "" });
    setShowReviewForm(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-20 border-t border-gray-200"
    >
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Customer Reviews
        </h2>

        {reviews.length === 0 ? (
          // EMPTY STATE
          <div className="py-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Star size={40} className="text-primary/30" />
            </div>
            <p className="text-gray-600 font-bold mb-2 text-lg">Be the first to review this product</p>
            <p className="text-gray-500 mb-6">Share your experience with others</p>
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold uppercase text-sm"
            >
              Write a Review
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-12">
            {/* LEFT: RATING SUMMARY */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-8 rounded-2xl">
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-primary mb-2">{averageRating}</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < Math.floor(Number(averageRating))
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Based on {reviews.length} reviews</p>
                </div>

                {/* RATING BARS */}
                <div className="space-y-3">
                  {ratingDistribution.map(({ rating, count }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-600 w-6">{rating}★</span>
                      <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{
                            width: `${(count / reviews.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>

                {/* WRITE REVIEW BUTTON */}
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full mt-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold uppercase text-sm"
                >
                  Write a Review
                </button>
              </div>
            </div>

            {/* RIGHT: REVIEWS LIST */}
            <div className="md:col-span-2 space-y-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-gray-50 rounded-2xl hover:shadow-md transition-all"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{review.author}</h4>
                          {review.verified && (
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{review.date}</p>
                      </div>
                    </div>
                  </div>

                  {/* RATING */}
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={`${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* REVIEW TEXT */}
                  <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* REVIEW FORM */}
      {showReviewForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-8 bg-gray-50 rounded-2xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Share Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating })}
                    className="focus:outline-none transition"
                  >
                    <Star
                      size={32}
                      className={`${
                        rating <= newReview.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      } hover:text-yellow-300 transition`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Your Review
              </label>
              <textarea
                value={newReview.text}
                onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                placeholder="Share your experience with this product..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold uppercase text-sm"
              >
                Submit Review
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-bold uppercase text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </motion.section>
  );
}
