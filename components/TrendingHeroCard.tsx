'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import CustomCaptcha from './CustomCaptcha';
import { Poll, VoteResponse } from '@/types';
import SuccessModal from './SuccessModal';
import { getDeviceId } from '@/lib/deviceId';
import { getDeviceFingerprint } from '@/lib/deviceFingerprint';

interface TrendingHeroCardProps {
  poll: Poll;
  totalVotes: number;
  yesPercentage: string | number;
  noPercentage: string | number;
  onVoteSuccess?: () => void; // Callback when vote is successfully cast
}

export default function TrendingHeroCard({ poll: initialPoll, totalVotes: initialTotalVotes, yesPercentage: initialYesPercentage, noPercentage: initialNoPercentage, onVoteSuccess }: TrendingHeroCardProps) {
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [totalVotes, setTotalVotes] = useState<number>(initialTotalVotes);
  const [yesPercentage, setYesPercentage] = useState<string | number>(initialYesPercentage);
  const [noPercentage, setNoPercentage] = useState<string | number>(initialNoPercentage);
  const [voted, setVoted] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');

  // Update poll when prop changes
  useEffect(() => {
    setPoll(initialPoll);
    setTotalVotes(initialTotalVotes);
    setYesPercentage(initialYesPercentage);
    setNoPercentage(initialNoPercentage);
  }, [initialPoll, initialTotalVotes, initialYesPercentage, initialNoPercentage]);

  useEffect(() => {
    const id = getDeviceId();
    const fingerprint = getDeviceFingerprint();
    setDeviceId(id);
    setDeviceFingerprint(fingerprint);
    checkVoteStatus(id, fingerprint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll._id]);

  const checkVoteStatus = async (deviceId: string, fingerprint: string) => {
    try {
      const res = await fetch('/api/polls/check-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll._id,
          deviceId,
          deviceFingerprint: fingerprint,
        }),
      });

      const data = await res.json();
      if (data.success && data.hasVoted) {
        setVoted(true);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleVoteClick = (vote: 'yes' | 'no') => {
    if (voted || success) return;
    setSelectedVote(vote);
    setShowCaptcha(true);
    setError('');
  };

  const handleCaptchaVerify = async (token: string) => {
    setCaptchaToken(token);
    
    try {
      const storeRes = await fetch('/api/captcha/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const storeData = await storeRes.json();
      
      if (!storeData.success) {
        setError('Failed to verify CAPTCHA. Please try again.');
        setShowCaptcha(false);
        setCaptchaToken(null);
        return;
      }
    } catch (err) {
      setError('Failed to verify CAPTCHA. Please try again.');
      setShowCaptcha(false);
      setCaptchaToken(null);
      return;
    }

    if (token && selectedVote) {
      await submitVote(token, selectedVote);
    }
  };

  const handleCaptchaError = () => {
    setError('CAPTCHA verification failed. Please try again.');
    setShowCaptcha(false);
    setCaptchaToken(null);
  };

  const handleCaptchaExpire = () => {
    setError('CAPTCHA expired. Please try again.');
    setShowCaptcha(false);
    setCaptchaToken(null);
  };

  const submitVote = async (token: string, vote: 'yes' | 'no') => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pollId: poll._id,
            vote,
            captchaToken: token,
            deviceId: deviceId || getDeviceId(),
            deviceFingerprint: deviceFingerprint || getDeviceFingerprint(),
          }),
      });

      const data: VoteResponse = await res.json();

      if (data.success) {
        setVoted(true);
        setSuccess(true);
        setShowCaptcha(false);
        setCaptchaToken(null);
        // Update poll data with new vote counts
        if (data.poll) {
          setPoll(data.poll as Poll);
          const updatedTotalVotes = data.poll.totalVotes || data.poll.yesVotes + data.poll.noVotes;
          setTotalVotes(updatedTotalVotes);
          if (data.poll.yesPercentage !== undefined) {
            setYesPercentage(typeof data.poll.yesPercentage === 'number' ? data.poll.yesPercentage.toFixed(1) : data.poll.yesPercentage);
          } else if (updatedTotalVotes > 0) {
            setYesPercentage(((data.poll.yesVotes / updatedTotalVotes) * 100).toFixed(1));
          }
          if (data.poll.noPercentage !== undefined) {
            setNoPercentage(typeof data.poll.noPercentage === 'number' ? data.poll.noPercentage.toFixed(1) : data.poll.noPercentage);
          } else if (updatedTotalVotes > 0) {
            setNoPercentage(((data.poll.noVotes / updatedTotalVotes) * 100).toFixed(1));
          }
        }
        // Notify parent component to re-filter trending polls
        if (onVoteSuccess) {
          setTimeout(() => {
            onVoteSuccess();
          }, 500); // Small delay to ensure vote is saved
        }
      } else {
        setError(data.error || 'Failed to submit vote');
        setShowCaptcha(false);
        setCaptchaToken(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote');
      setShowCaptcha(false);
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const captchaModal = showCaptcha && !success && (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => {}}>
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col">
          <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Verification Required</h3>
            <button
              onClick={() => {
                setShowCaptcha(false);
                setError('');
                setCaptchaToken(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-center p-6">
            <div className="w-full">
              <CustomCaptcha
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SuccessModal
        isOpen={success}
        onClose={() => {
          setSuccess(false);
        }}
        message="Your vote has been recorded successfully!"
      />

      {typeof window !== 'undefined' && createPortal(captchaModal, document.body)}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 flex flex-col md:flex-row animate-fade-in hover:shadow-2xl transition-all duration-300 gap-0">
        {/* Product Image Section - Left */}
        <div className="relative w-full md:w-2/5 h-40 sm:h-48 md:h-auto min-h-[160px] sm:min-h-[200px] md:min-h-[350px] bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-3 md:p-4">
            <Image
              src={poll.productImage}
              alt={poll.productName}
              fill
              className="object-contain drop-shadow-lg"
              unoptimized
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        </div>

        {/* Content Section - Right with Common Background */}
        <div className="relative w-full md:w-3/5 flex-1 min-h-[450px] sm:min-h-[480px] md:min-h-[350px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex-shrink-0">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
          {/* Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/40"></div>

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col px-3 pt-3 pb-0 sm:px-4 sm:pt-4 sm:pb-0 md:px-6 md:pt-6 md:pb-0 lg:px-8 lg:pt-8 lg:pb-0 text-white">
            <div className="flex-shrink-0 mb-3 sm:mb-4">
              {/* Product Name */}
              <div className="mb-1 sm:mb-2">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight drop-shadow-lg line-clamp-1">
                  {poll.productName}
                </h2>
              </div>

              {/* Poll Question */}
              <p className="text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-3 font-medium leading-relaxed drop-shadow-md line-clamp-2">
                {poll.statement}
              </p>

              {/* Category and Total Votes */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                {typeof poll.category === 'object' && poll.category.name && (
                  <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-semibold text-white">Category: {poll.category.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs sm:text-sm font-semibold text-white">Total Votes: {totalVotes}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/90 backdrop-blur-md border border-red-300 text-white px-4 py-3 rounded-lg mb-4 text-sm shadow-lg">
                  {error}
                </div>
              )}
            </div>

            {/* Bottom Section - Results and Buttons - Always visible */}
            <div className="mt-auto flex-shrink-0 pt-2 sm:pt-3 pb-3 sm:pb-4 md:pb-6 lg:pb-8">
              {/* Vote Results */}
              {totalVotes > 0 && (
                <div className="border-t border-white/30 pt-2 sm:pt-3 bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-2.5 mb-2 sm:mb-3">
                  <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-green-300 font-semibold text-xs sm:text-sm">{poll.yesButtonText}: {yesPercentage}%</span>
                      <span className="text-white/80 text-xs">({poll.yesVotes})</span>
                    </div>
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-red-300 font-semibold text-xs sm:text-sm">{poll.noButtonText}: {noPercentage}%</span>
                      <span className="text-white/80 text-xs">({poll.noVotes})</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-2 sm:h-2.5 overflow-hidden shadow-inner">
                    <div
                      className="bg-green-500 h-2 sm:h-2.5 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${yesPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {totalVotes === 0 && !voted && (
                <div className="border-t border-white/30 pt-2 sm:pt-3 text-center bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-2 sm:mb-3">
                  <p className="text-white/90 text-xs sm:text-sm font-medium">No votes yet. Be the first!</p>
                </div>
              )}

              {voted && !showCaptcha && (
                <div className="bg-green-500/90 backdrop-blur-md border-2 border-green-300 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-center mb-2 sm:mb-3 font-semibold text-xs sm:text-sm shadow-lg">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    You have voted!
                  </span>
                </div>
              )}

              {/* Vote Buttons - Always visible at bottom */}
              {!voted && !success && !showCaptcha && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleVoteClick('yes')}
                    disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                  >
                    {poll.yesButtonText}
                  </button>
                  <button
                    onClick={() => handleVoteClick('no')}
                    disabled={loading}
                    className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                  >
                    {poll.noButtonText}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

