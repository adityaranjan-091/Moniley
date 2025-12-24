import Link from "next/link";
import React from "react";
import ThemeToggle from "../components/ThemeToggle";

const Home = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Theme Toggle - Positioned absolutely */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center gap-8 px-4 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">
            Welcome to{" "}
            <span className="text-blue-600 dark:text-blue-400">Your App</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl transition-colors duration-300">
            Get started by creating an account or logging in to access your
            dashboard
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Login
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Fast
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lightning-fast performance and seamless experience
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Secure
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your data is protected with enterprise-grade security
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Modern
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Built with the latest technologies and best practices
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
