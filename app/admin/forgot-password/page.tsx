'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setStep('otp');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setStep('reset');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Password reset successfully! You have been automatically logged in. Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/admin/dashboard?tab=dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center px-4 pt-16">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Forgot Password
          </h1>
          <p className="text-gray-600 text-center text-sm">
            {step === 'email' && 'Enter your email to receive an OTP'}
            {step === 'otp' && 'Enter the OTP sent to your email'}
            {step === 'reset' && 'Enter your new password'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              step === 'email' ? 'bg-indigo-600 text-white' : step === 'otp' || step === 'reset' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${step === 'otp' || step === 'reset' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              step === 'otp' ? 'bg-indigo-600 text-white' : step === 'reset' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-12 h-1 ${step === 'reset' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              step === 'reset' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="admin@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="text-center">
              <Link href="/admin/login" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center text-2xl font-bold tracking-widest"
                placeholder="000000"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Check your email for the 6-digit OTP
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center space-x-4">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Change Email
              </button>
              <span className="text-gray-300">|</span>
              <Link href="/admin/login" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <Link href="/admin/login" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

