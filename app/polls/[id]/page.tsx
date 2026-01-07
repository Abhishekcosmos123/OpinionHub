'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import CustomCaptcha from '@/components/CustomCaptcha';
import SuccessModal from '@/components/SuccessModal';
import { Poll, VoteResponse } from '@/types';
import { getDeviceId } from '@/lib/deviceId';

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voted, setVoted] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  const checkVoteStatus = useCallback(async (deviceId: string) => {
    try {
      const res = await fetch('/api/polls/check-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          deviceId,
        }),
      });

      const data = await res.json();
      if (data.success && data.hasVoted) {
        setVoted(true);
      }
    } catch (err) {
      // Silently fail - if check fails, allow user to try voting
    }
  }, [pollId]);

  const fetchPoll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/polls/${pollId}`);
      const data = await res.json();
      if (data.success) {
        setPoll(data.poll);
      } else {
        setError(data.error || 'Poll not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch poll');
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    fetchPoll();
    // Get device ID on component mount
    const id = getDeviceId();
    setDeviceId(id);
    
    // Check if user has already voted
    if (pollId) {
      checkVoteStatus(id);
    }
  }, [pollId, fetchPoll, checkVoteStatus]);

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
      setVoteLoading(true);
      setError('');

      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll?._id,
          vote,
          captchaToken: token,
          deviceId: deviceId || getDeviceId(),
        }),
      });

      const data: VoteResponse = await res.json();

      if (data.success) {
        setVoted(true);
        setSuccess(true);
        setShowCaptcha(false);
        setCaptchaToken(null);
        // Refresh poll data
        fetchPoll();
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
      setVoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading poll...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-center max-w-2xl mx-auto">
            <p className="font-medium">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

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
      {/* Render CAPTCHA modal outside page using portal */}
      {typeof window !== 'undefined' && createPortal(captchaModal, document.body)}
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <SuccessModal
            isOpen={success}
            onClose={() => {
              setSuccess(false);
              fetchPoll();
            }}
            message="Your vote has been recorded successfully!"
          />

          <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Product Image */}
            <div className="relative h-96 w-full">
              <Image
                src={poll.productImage}
                alt={poll.productName}
                fill
                className="object-cover"
                unoptimized
              />
              {poll.isTrending && (
                <div className="absolute top-4 right-4">
                  <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Trending
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {poll.productName}
              </h1>
              
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                {poll.statement}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}


              {/* Vote Buttons */}
              {!voted && !success && !showCaptcha && (
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => handleVoteClick('yes')}
                    disabled={voteLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                  >
                    {poll.yesButtonText}
                  </button>
                  <button
                    onClick={() => handleVoteClick('no')}
                    disabled={voteLoading}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                  >
                    {poll.noButtonText}
                  </button>
                </div>
              )}

              {/* Vote Statistics */}
              {totalVotes > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between text-lg font-semibold text-gray-700 mb-4">
                    <span className="text-green-600">
                      {poll.yesButtonText}: {yesPercentage}%
                    </span>
                    <span className="text-red-600">
                      {poll.noButtonText}: {noPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${yesPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 font-medium">
                      {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
                    </p>
                    <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500">
                      <span>{poll.yesVotes} {poll.yesButtonText} votes</span>
                      <span>{poll.noVotes} {poll.noButtonText} votes</span>
                    </div>
                  </div>
                </div>
              )}

              {totalVotes === 0 && !voted && (
                <div className="text-center py-8 border-t border-gray-200">
                  <p className="text-gray-500 text-lg mb-4">No votes yet. Be the first to vote!</p>
                </div>
              )}

              {voted && !showCaptcha && (
                <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-lg text-center font-medium text-lg">
                  ✓ You have voted!
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

