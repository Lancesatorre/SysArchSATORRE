import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { authService } from '../services/authService';

export default function Testimonials() {
  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const user = authService.getUser() || {};

  const fetchTestimonial = async () => {
    try {
      const result = await authService.studentGetTestimonial(user.id_number);
      if (result.success && result.data) {
        const active = result.data.active;
        const historyList = result.data.history || [];

        setCurrentTestimonial(active);
        setHistory(historyList);

        if (active && active.status === 'approved') {
          // If approved, don't pre-fill the form so the student can submit a fresh testimonial!
          setRating(5);
          setFeedback('');
        } else if (active) {
          // If pending or declined, pre-fill so they can update it!
          setRating(active.rating);
          setFeedback(active.feedback);
        } else {
          setRating(5);
          setFeedback('');
        }
      } else {
        setCurrentTestimonial(null);
        setHistory([]);
      }
    } catch (error) {
      console.error('Error fetching testimonial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonial();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setMessage({ text: 'Please enter your feedback', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({ text: '', type: '' });
      const result = await authService.studentSubmitTestimonial(
        user.id_number,
        rating,
        feedback
      );
      if (result.success) {
        setMessage({ text: result.message || 'Feedback submitted successfully!', type: 'success' });
        await fetchTestimonial();
      } else {
        setMessage({ text: result.message || 'Failed to submit testimonial', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      setMessage({ text: error.message || 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/35 text-green-300 rounded-full text-[0.68rem] font-black uppercase tracking-wider shadow-sm">
            Approved
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/35 text-red-300 rounded-full text-[0.68rem] font-black uppercase tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Declined
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/35 text-amber-300 rounded-full text-[0.68rem] font-black uppercase tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="py-6 px-2">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8">

        {/* ── IMMERSIVE HEADER BANNER (Dashboard Style) ── */}
        <div className="bg-[#3c096c] rounded-3xl overflow-hidden shadow-xl shadow-[#3c096c]/25 relative">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
          <div className="absolute -top-16 right-48 w-64 h-64 rounded-full bg-[#ff9100]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-80 h-40 rounded-full bg-violet-500/08 blur-3xl pointer-events-none" />
          <div className="h-1.5 w-full bg-linear-to-r from-[#ff9100] via-violet-400 to-[#3c096c]" />

          <div className="relative px-6 sm:px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-purple-200/60 text-[0.62rem] font-black uppercase tracking-[0.25em] mb-1.5">Voice & Feedback</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none uppercase">System Testimonials</h1>
              <p className="text-xs text-purple-200/70 font-medium mt-2.5 max-w-lg leading-relaxed">
                Share your star rating and experiences to help us improve the lab environment, computer units, and campus portal speed.
              </p>
            </div>

            {/* Status Window widget */}
            <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-3 shrink-0 backdrop-blur-xs">
              <span className="p-2.5 bg-white/10 text-white rounded-xl">
                <ShieldCheck size={20} className="stroke-[2.5]" />
              </span>
              <div className="text-left">
                <p className="text-[0.62rem] text-purple-200/50 font-black uppercase tracking-widest leading-none">My Status</p>
                <div className="mt-1.5">
                  {currentTestimonial ? getStatusBadge(currentTestimonial.status) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/10 text-white/80 rounded-full text-[0.68rem] font-bold">
                      No Submission
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── INFORMATIVE POLICY CARD ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex gap-4 items-start hover:shadow-sm transition-all duration-300">
          <div className="p-3 bg-[#3c096c]/5 text-[#3c096c] rounded-2xl shadow-xs shrink-0">
            <MessageSquare size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#1a0030] tracking-tight uppercase">Portal & Lab Feedback Policy</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold mt-1">
              Unlike transaction-specific checkout logs, testimonials are general system reviews.
              Write about our labs, computers, internet speed, portal accessibility, and admin support!
              Once an administrator reviews and approves your submission, your review will shine on our main homepage slider.
              <span className="text-[#3c096c] font-black ml-1">You can submit another testimonial once approved or update active pending ones.</span>
            </p>
          </div>
        </div>

        {/* ── TESTIMONIAL FORM CONTAINER ── */}
        {isLoading ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-xs">
            <span className="w-8 h-8 border-4 border-[#3c096c]/20 border-t-[#3c096c] rounded-full animate-spin inline-block mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Retrieving Your Testimonial...</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6">
            <h2 className="text-lg font-black text-[#1a0030] uppercase tracking-tight">
              {currentTestimonial && currentTestimonial.status !== 'approved' ? 'Update Your Testimonial' : 'Submit a Testimonial'}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Star Selector */}
              <div>
                <label className="text-[0.68rem] font-black text-gray-400 uppercase tracking-widest block mb-3">
                  Star Rating (1 - 5 Stars)
                </label>
                <div className="flex items-center gap-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={isSubmitting}
                      className="focus:outline-none transition-all hover:scale-115 active:scale-95 cursor-pointer disabled:opacity-50"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                    >
                      <Star
                        size={40}
                        className={`stroke-[1.8] transition-all duration-200 ${star <= (hoveredStar || rating)
                          ? 'fill-amber-400 stroke-amber-500 filter drop-shadow-[0_3px_6px_rgba(245,158,11,0.35)]'
                          : 'stroke-gray-250 fill-transparent hover:stroke-amber-400'
                          }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-[#3c096c] bg-[#3c096c]/05 px-3 py-1.5 rounded-xl border border-[#3c096c]/10 ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Feedback Input Textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.68rem] font-black text-gray-400 uppercase tracking-widest block">
                  Your Review & Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={1000}
                  placeholder="Share your thoughts about SitInSatorre! How helpful are the computer setups, the registration speed, the lab environment, or the administration portal..."
                  className="w-full h-40 px-5 py-4 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border-2 border-gray-150 focus:border-[#3c096c]/25 rounded-2xl text-[0.85rem] font-semibold text-[#1a0030] focus:outline-none transition-all resize-none leading-relaxed shadow-inner"
                />
                <span className="text-[0.62rem] text-right text-gray-400 font-bold uppercase tracking-wider">
                  {feedback.length} / 1000 characters
                </span>
              </div>

              {/* Notification Message */}
              {message.text && (
                <div className={`p-4 rounded-xl border text-xs font-bold ${message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                  {message.text}
                </div>
              )}

              {/* Actions Footer */}
              <button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="w-full py-4 bg-[#3c096c] hover:bg-[#240046] disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-black rounded-2xl transition-all uppercase tracking-widest shadow-md shadow-[#3c096c]/20 hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] duration-150 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Testimonial...
                  </>
                ) : (
                  <>
                    {currentTestimonial && currentTestimonial.status !== 'approved' ? 'Update Testimonial' : 'Post Testimonial'}
                  </>
                )}
              </button>

            </form>
          </div>
        )}

        {/* Past Submissions History Section */}
        {history.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6">
            <div>
              <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#3c096c] mb-1">My Submissions</p>
              <h2 className="text-lg font-black text-[#1a0030] uppercase tracking-tight">Feedback History</h2>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-1">
                A historical log of your system ratings and administrative review status.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-sm"
                >
                  {/* Card Header: Date & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-dashed border-gray-150 pb-3">
                    <span className="text-[0.68rem] font-mono text-gray-400 font-bold">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <div>
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[0.62rem] font-bold">
                          Approved
                        </span>
                      )}
                      {item.status === 'declined' && (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[0.62rem] font-bold">
                          Declined
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[0.62rem] font-bold">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < item.rating ? 'fill-amber-400 stroke-amber-500' : 'stroke-gray-200 fill-transparent'}
                      />
                    ))}
                  </div>

                  {/* Feedback Message */}
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed italic flex-1 min-h-[3rem] whitespace-pre-line relative">
                    <span className="text-2xl text-[#3c096c]/06 font-serif absolute -top-2 -left-1 select-none pointer-events-none">“</span>
                    <span className="relative z-10 pl-2">{item.feedback}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
