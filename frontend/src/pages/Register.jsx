import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, User, Users } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const[gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const[password, setPassword] = useState('');
  const [error, setError] = useState('');
  const[isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gender) {
      setError('Please select a gender.');
      return;
    }
    setError(''); 
    setIsLoading(true);
    try {
      // Pass the new fields to the AuthContext
      await register(name, gender, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 transition-colors duration-300 animate-fade-in-up">
        
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Create an account</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Start building your AI-generated websites instantly.</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>}
          
          <div className="space-y-4">
            
            {/* NAME FIELD */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  placeholder="e.g. John Doe" 
                />
              </div>
            </div>

            {/* GENDER FIELD */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <select 
                  required 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  className={`appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-colors ${gender ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  <option value="" disabled hidden>Select Gender</option>
                  <option value="Male" className="text-gray-900 dark:text-white">Male</option>
                  <option value="Female" className="text-gray-900 dark:text-white">Female</option>
                  <option value="Non-Binary" className="text-gray-900 dark:text-white">Non-Binary</option>
                  <option value="Prefer not to say" className="text-gray-900 dark:text-white">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* EMAIL FIELD */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  placeholder="you@example.com" 
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input 
                  type="password" 
                  required 
                  minLength="6" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  placeholder="••••••••" 
                />
              </div>
            </div>

          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-white bg-gray-900 dark:bg-brand-600 hover:bg-brand-600 dark:hover:bg-brand-500 font-bold disabled:opacity-70 transition-all hover:-translate-y-1"
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account? <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;