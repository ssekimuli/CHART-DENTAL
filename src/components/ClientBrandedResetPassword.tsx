'use client';

import { useState } from 'react';
import { getClientConfig } from '@/lib/client-config';
import Link from 'next/link';

interface ResetPasswordProps {
  token?: string; // Reset token from email link
}

/**
 * Client-branded reset password page
 * Shows client-specific title and branding
 * Used when user clicks reset link from email
 */
export function ClientBrandedResetPassword({ token }: ResetPasswordProps) {
  const config = getClientConfig();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords
    if (!password) {
      setError('Please enter a new password');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      setLoading(false);
      return;
    }

    try {
      // Call your backend reset password endpoint
      const response = await fetch(`${config.backendUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          password_confirmation: confirmPassword,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(
          data.message || 'Failed to reset password. Please try again or request a new link.'
        );
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Password Reset Successful
        </h1>

        <p className="text-lg text-gray-600 mb-8 text-center">
          Your password has been reset successfully.
        </p>

        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <p className="text-gray-700 mb-6">
            You can now sign in with your new password.
          </p>

          <Link
            href="/login"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            style={{ backgroundColor: config.primaryColor }}
          >
            Go to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-500">
          © 2024 {config.displayName}. All rights reserved.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Logo/Icon */}
      <div className="mb-8">
        <img
          src="/assets/dental-hygiene.png"
          alt={config.appName}
          className="w-24 h-24 rounded-lg shadow-lg"
        />
      </div>

      {/* Client Name */}
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        {config.appName}
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-gray-600 mb-8">
        Create a New Password
      </p>

      {/* Reset Password Form Container */}
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Password Requirements */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
            <p className="font-semibold mb-2">Password Requirements:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>At least 8 characters</li>
              <li>Mix of letters, numbers, and symbols</li>
              <li>Different from your previous password</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            style={{ backgroundColor: loading ? '#999' : config.primaryColor }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-semibold hover:underline"
              style={{ color: config.primaryColor }}
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Support Info */}
        {(config.supportEmail || config.supportPhone) && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
            <p className="font-semibold mb-2">Need help?</p>
            {config.supportEmail && (
              <p>
                Email:{' '}
                <a
                  href={`mailto:${config.supportEmail}`}
                  className="text-blue-600 hover:underline"
                >
                  {config.supportEmail}
                </a>
              </p>
            )}
            {config.supportPhone && (
              <p>
                Phone:{' '}
                <a
                  href={`tel:${config.supportPhone}`}
                  className="text-blue-600 hover:underline"
                >
                  {config.supportPhone}
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-500">
        © 2024 {config.displayName}. All rights reserved.
      </p>
    </div>
  );
}
