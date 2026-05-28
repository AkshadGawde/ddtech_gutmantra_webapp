import { motion } from "motion/react";
import { User, MessageSquare, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

interface Review {
  id: string;
  customerName: string;
  reviewText: string;
  createdAt: any;
  verified?: boolean;
}

interface ReviewsSectionProps {
  productId: string;
  productName: string;
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function ReviewsSection({ productId, productName }: ReviewsSectionProps) {
  const { user, userData } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ customerName: "", reviewText: "" });
  const [formError, setFormError] = useState("");

  const isPhoneVerified = userData?.phoneVerified === true || user?.phoneNumber != null;

  useEffect(() => {
    if (!productId) return;
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const q = query(
          collection(db, "products", productId, "reviews"),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const snap = await getDocs(q);
        setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
      } catch {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formData.customerName.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (formData.reviewText.trim().length < 10) {
      setFormError("Review must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "products", productId, "reviews"), {
        customerName: formData.customerName.trim(),
        productName,
        productSku: productId,
        reviewText: formData.reviewText.trim(),
        userId: user!.uid,
        userPhone: userData?.phone || user?.phoneNumber || "",
        createdAt: serverTimestamp(),
        status: "approved",
        helpful: 0,
      });
      setSubmitted(true);
      setFormData({ customerName: "", reviewText: "" });
      setShowForm(false);
      // Re-fetch to show the new review
      const q = query(
        collection(db, "products", productId, "reviews"),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const snap = await getDocs(q);
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
    } catch {
      setFormError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-20 border-t border-gray-200"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Customer Reviews</h2>
        {user && isPhoneVerified && !showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Success banner */}
      {submitted && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-green-800 font-semibold text-sm">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          Review submitted successfully! Thank you for sharing your experience.
        </div>
      )}

      {/* Auth / verification gate */}
      {!user && (
        <div className="mb-8 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-800">
          Please <span className="font-bold">log in</span> to write a review.
        </div>
      )}
      {user && !isPhoneVerified && (
        <div className="mb-8 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-800">
          Only verified customers can write reviews.{" "}
          <a href="/profile" className="font-bold underline">Verify your phone</a> to share your experience.
        </div>
      )}

      {/* Review form */}
      {showForm && user && isPhoneVerified && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-gray-50 rounded-2xl p-6 border border-black/5"
        >
          <h3 className="text-xl font-bold mb-5">Share Your Experience</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-sm transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                Your Review
              </label>
              <textarea
                placeholder="Share your experience with this product… (min 10 characters)"
                value={formData.reviewText}
                onChange={(e) => setFormData({ ...formData, reviewText: e.target.value.slice(0, 500) })}
                disabled={submitting}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-sm resize-none transition-colors disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">{formData.reviewText.length}/500</p>
            </div>
            {formError && (
              <p className="text-sm text-red-600 font-medium">{formError}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                disabled={submitting}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Reviews list */}
      {loadingReviews ? (
        <div className="py-10 text-center text-gray-400 font-medium">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare size={32} className="text-primary/30" />
          </div>
          <p className="text-gray-600 font-bold mb-1">No reviews yet</p>
          <p className="text-gray-400 text-sm">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="p-6 bg-gray-50 rounded-2xl hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{review.customerName}</h4>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{timeAgo(review.createdAt)}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{review.reviewText}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
