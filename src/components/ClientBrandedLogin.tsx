'use client';

import { getClientConfig } from '@/lib/client-config';

/**
 * Client-branded login page
 * Shows client-specific title and branding
 */
export function ClientBrandedLogin() {
  const config = getClientConfig();

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
        Dental Practice Management System
      </p>

      {/* Login Form Container */}
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* This is a placeholder - replace with your actual login form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            style={{ backgroundColor: config.primaryColor }}
          >
            Sign In
          </button>
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
