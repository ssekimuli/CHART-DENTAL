'use client';

import { useState } from 'react';
import { useClientConfig } from '@/hooks/useClientConfig';
import Link from 'next/link';

/**
 * Client-branded forgot password page
 * Shows client-specific title and branding fetched from API
 */
export function ClientBrandedForgotPassword() {
  const { config, loading: configLoading, error: configError } = useClientConfig();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (configLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (configError || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <p className="text-red-600">Failed to load application configuration</p>
          {configError && <p className="text-sm text-gray-600 mt-2">{configError.message}</p>}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email
    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Call your backend forgot password endpoint
      const response = await fetch(`${config.backendUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Forgot password error:', err);
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
          Check Your Email
        </h1>

        <p className="text-lg text-gray-600 mb-2 text-center">
          We sent a password reset link to:
        </p>

        <p className="text-lg font-semibold text-gray-900 mb-8 text-center">
          {email}
        </p>

        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <p className="text-gray-700 mb-4">
            Click the link in the email to reset your password. The link will expire in 24 hours.
          </p>

          <p className="text-sm text-gray-600 mb-6">
            Didn't receive an email? Check your spam folder or try again with a different email address.
          </p>

          <Link
            href="/login"
            className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            style={{ backgroundColor: config.primaryColor }}
          >
            Back to Login
          </Link>

          <button
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
            className="block w-full text-center mt-3 text-blue-600 hover:text-blue-700 font-semibold py-2"
            style={{ color: config.primaryColor }}
          >
            Try Another Email
          </button>
        </div>

        {/* Support Info */}
        {(config.supportEmail || config.supportPhone) && (
          <div className="mt-8 text-center text-sm text-gray-600">
            <p className="font-semibold mb-2">Still need help?</p>
            {config.supportEmail && (
              <p>
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
        Reset Your Password
      </p>

      {/* Forgot Password Form Container */}
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* Back to Login Link */}
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-700 mb-6 inline-flex items-center gap-1"
          style={{ color: config.primaryColor }}
        >
          <span>←</span>
          Back to Login
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-600">
              Enter the email address associated with your account. We'll send you a link to reset your password.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            style={{ backgroundColor: loading ? '#999' : config.primaryColor }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
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
