'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import CustomCaptcha from './CustomCaptcha';
import { Poll, VoteResponse } from '@/types';
import SuccessModal from './SuccessModal';
import { getDeviceId } from '@/lib/deviceId';
import { getDeviceFingerprint } from '@/lib/deviceFingerprint';

interface PollCardProps {
  poll: Poll;
}

function PollCard({ poll: initialPoll }: PollCardProps) {
  const [poll, setPoll] = useState<Poll>(initialPoll);
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
  }, [initialPoll]);

  useEffect(() => {
    // Get device ID and fingerprint on component mount
    const id = getDeviceId();
    const fingerprint = getDeviceFingerprint();
    setDeviceId(id);
    setDeviceFingerprint(fingerprint);
    
    // Check if user has already voted
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
      // Silently fail - if check fails, allow user to try voting
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
    
    // Store token on server - wait for it to complete
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

    // Only submit vote if token was stored successfully
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

  const totalVotes = poll.totalVotes || poll.yesVotes + poll.noVotes;
  const yesPercentage = poll.yesPercentage !== undefined 
    ? poll.yesPercentage 
    : totalVotes > 0 
      ? ((poll.yesVotes / totalVotes) * 100).toFixed(1) 
      : '0';
  const noPercentage = poll.noPercentage !== undefined 
    ? poll.noPercentage 
    : totalVotes > 0 
      ? ((poll.noVotes / totalVotes) * 100).toFixed(1) 
      : '0';

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

      {/* Render CAPTCHA modal outside card using portal */}
      {typeof window !== 'undefined' && createPortal(captchaModal, document.body)}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-gray-100 hover:border-indigo-300 h-full flex flex-col backdrop-blur-sm">
        <div className="relative h-56 w-full group overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <Image
            src={poll.productImage}
            alt={poll.productName}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {poll.isTrending && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-1.5 backdrop-blur-sm border border-white/20 animate-pulse">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Trending
              </span>
            </div>
          )}
          {typeof poll.category === 'object' && poll.category.name && (
            <div className="absolute top-3 left-3 z-10">
              <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full shadow-xl backdrop-blur-sm border border-white/20">
                {poll.category.name}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
            {poll.productName}
          </h3>
          
          <p className="text-gray-600 mb-3 text-sm line-clamp-2 flex-1">
            {poll.statement}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
              {error}
            </div>
          )}


          {!voted && !success && !showCaptcha && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleVoteClick('yes')}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 text-sm transform"
              >
                {poll.yesButtonText}
              </button>
              <button
                onClick={() => handleVoteClick('no')}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 text-sm transform"
              >
                {poll.noButtonText}
              </button>
            </div>
          )}

          {voted && !showCaptcha && (
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 border-2 border-green-400 text-green-800 px-4 py-3 rounded-xl text-sm text-center mb-3 font-bold shadow-lg animate-pulse">
              <span className="inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You have voted!
              </span>
            </div>
          )}

          {totalVotes > 0 && (
            <div className="pt-3 border-t-2 border-gradient-to-r from-gray-100 to-gray-200">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-green-600 font-bold">{poll.yesButtonText}: {yesPercentage}%</span>
                <span className="text-gray-400">•</span>
                <span className="text-red-600 font-bold">{poll.noButtonText}: {noPercentage}%</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-full">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
              </div>
              <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 h-3 rounded-full transition-all duration-700 shadow-lg"
                  style={{ width: `${yesPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {totalVotes === 0 && !voted && (
            <p className="text-xs text-gray-400 text-center pt-3 border-t border-gray-100">
              No votes yet. Be the first!
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(PollCard);

