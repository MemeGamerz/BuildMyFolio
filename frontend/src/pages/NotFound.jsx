import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 text-center transition-colors duration-300">
      <div className="p-4 rounded-2xl bg-gradient-to-tr from-brand-600 to-fuchsia-600 text-white shadow-xl mb-6 animate-bounce">
        <Layout className="h-10 w-10" />
      </div>
      <h1 className="text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">Page Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        The page you are looking for might have been moved, deleted, or does not exist.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg hover:-translate-y-0.5 transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
