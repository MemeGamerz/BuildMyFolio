import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Layout, Sparkles, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Listen to scroll position to trigger navbar transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Do not render the Navbar if the user is currently inside the Editor canvas.
  // We keep it for the "New Project" (AI Engine) form.
  const isEditorCanvas = location.pathname.startsWith('/editor/') && location.pathname !== '/editor/new';
  if (isEditorCanvas) return null;

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-3 border-gray-200 dark:border-slate-800'
          : 'bg-transparent py-5 border-gray-200/0 dark:border-slate-800/0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Brand Logo Section */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-brand-600 to-fuchsia-500 p-2 rounded-xl text-white shadow-lg group-hover:scale-105 transition-all duration-300">
              <Layout className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 tracking-tight">
              BuildMyFolio
            </span>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Global Dark/Light Mode Toggler */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-full text-gray-500 hover:text-brand-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:bg-slate-800 transition-all duration-200 active:scale-90"
            >
              {isDark ? (
                <Sun className="h-5 w-5 animate-fade-in" />
              ) : (
                <Moon className="h-5 w-5 animate-fade-in" />
              )}
            </button>

            {user ? (
              <>
                {/* Logged In View */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    user.plan === 'Pro' || user.plan === 'Enterprise'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {user.plan || 'Hobby'}
                  </span>

                  {user.plan !== 'Pro' && user.plan !== 'Enterprise' && (
                    <Link
                      to="/upgrade"
                      className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white shadow-sm hover:opacity-95 transition-opacity"
                    >
                      <Sparkles className="h-3 w-3" /> Upgrade
                    </Link>
                  )}
                </div>

                <Link
                  to="/dashboard"
                  className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold transition-colors text-sm sm:text-base"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors text-sm sm:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Logged Out View */}
                <Link
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold transition-colors text-sm sm:text-base"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 sm:gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium hover:-translate-y-0.5 transition-all shadow-lg shadow-gray-900/20 dark:shadow-white/20 active:scale-95"
                >
                  Get Started <Sparkles className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;