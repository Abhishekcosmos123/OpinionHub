'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CustomCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

// Predefined images for CAPTCHA (using emoji or simple shapes)
const CAPTCHA_IMAGES = [
  { emoji: '🐼', name: 'Panda' },
  { emoji: '🐨', name: 'Koala' },
  { emoji: '🦁', name: 'Lion' },
  { emoji: '🐻', name: 'Bear' },
  { emoji: '🐰', name: 'Rabbit' },
  { emoji: '🐸', name: 'Frog' },
  { emoji: '🐵', name: 'Monkey' },
  { emoji: '🐶', name: 'Dog' },
];

export default function CustomCaptcha({ onVerify, onError, onExpire }: CustomCaptchaProps) {
  const [rotation, setRotation] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{ emoji: string; name: string } | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expireTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetCaptcha = useCallback(() => {
    const randomImage = CAPTCHA_IMAGES[Math.floor(Math.random() * CAPTCHA_IMAGES.length)];
    const randomRotation = Math.floor(Math.random() * 4) * 90;
    setSelectedImage(randomImage);
    setRotation(randomRotation);
    setTargetRotation(0);
    setIsVerified(false);
    setError(false);
    setShowInstructions(false);
  }, []);

  useEffect(() => {
    // Initialize CAPTCHA with random image and rotation
    const randomImage = CAPTCHA_IMAGES[Math.floor(Math.random() * CAPTCHA_IMAGES.length)];
    const randomRotation = Math.floor(Math.random() * 4) * 90; // 0, 90, 180, or 270
    setSelectedImage(randomImage);
    setRotation(randomRotation);
    setTargetRotation(0); // Target is always upright (0 degrees)
    setShowInstructions(true);

    // Set expiration timer (2 minutes)
    expireTimeoutRef.current = setTimeout(() => {
      if (onExpire) {
        onExpire();
      }
      resetCaptcha();
    }, 120000); // 2 minutes

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (expireTimeoutRef.current) {
        clearTimeout(expireTimeoutRef.current);
      }
    };
  }, [onExpire, resetCaptcha]);

  const rotateLeft = () => {
    if (isVerified) return;
    setRotation((prev) => (prev - 90 + 360) % 360);
    setError(false);
  };

  const rotateRight = () => {
    if (isVerified) return;
    setRotation((prev) => (prev + 90) % 360);
    setError(false);
  };

  const handleVerify = () => {
    if (isVerified) return;

    // Check if rotation matches target (with small tolerance)
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const normalizedTarget = ((targetRotation % 360) + 360) % 360;

    if (normalizedRotation === normalizedTarget) {
      setIsVerified(true);
      setError(false);
      
      // Generate a verification token
      const token = generateToken();
      
      // Clear expiration timer
      if (expireTimeoutRef.current) {
        clearTimeout(expireTimeoutRef.current);
        expireTimeoutRef.current = null;
      }

      // Call onVerify with token
      onVerify(token);
    } else {
      setError(true);
      if (onError) {
        onError();
      }
      
      // Auto-reset after showing error
      timeoutRef.current = setTimeout(() => {
        resetCaptcha();
      }, 2000);
    }
  };

  const generateToken = (): string => {
    // Generate a simple token based on image, rotation, and timestamp
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const imageHash = selectedImage?.name || 'unknown';
    const rotationHash = rotation.toString();
    const tokenString = `${imageHash}-${rotationHash}-${timestamp}-${random}`;
    const base64Token = btoa(tokenString);
    // Use full base64 token, don't truncate
    return base64Token;
  };

  const handleStart = () => {
    setShowInstructions(false);
  };

  if (showInstructions) {
    return (
      <div className="text-center py-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Verification</h3>
        <p className="text-gray-600 mb-6 text-lg max-w-xl mx-auto">
          Please verify you&apos;re not a spammer by doing this quick activity!
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto"
        >
          Verify
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span className="font-semibold">Custom CAPTCHA</span>
          <button
            onClick={resetCaptcha}
            className="hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
          <p className="text-red-700 font-semibold text-center">
            Whoops! That&apos;s not quite right.
          </p>
        </div>
      )}

      {isVerified && (
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
          <p className="text-green-700 font-semibold text-center flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verification successful!
          </p>
        </div>
      )}

      <div className="text-center mb-6">
        <p className="text-gray-700 font-semibold text-lg mb-3">
          {error
            ? "When the main image is the right way up touch Done!"
            : "When the main image is the right way up touch Done!"}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Rotate Left Button */}
        <button
          onClick={rotateLeft}
          disabled={isVerified}
          className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110"
          title="Rotate Left"
        >
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Image Container */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-gray-300 shadow-inner"></div>
          <div
            className="w-48 h-48 flex items-center justify-center text-8xl transition-transform duration-300"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {selectedImage?.emoji || '🐼'}
          </div>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-28 h-28 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Rotate Right Button */}
        <button
          onClick={rotateRight}
          disabled={isVerified}
          className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110"
          title="Rotate Right"
        >
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Done Button */}
      <div className="text-center">
        {error ? (
          <button
            onClick={resetCaptcha}
            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto"
          >
            Try again
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleVerify}
            disabled={isVerified}
            className={`px-8 py-3 font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto ${
              isVerified
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
            }`}
          >
            Done
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
        <span className="font-semibold">Custom CAPTCHA</span>
        <div className="flex items-center gap-3">
          <button
            onClick={resetCaptcha}
            className="hover:text-gray-700 transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

