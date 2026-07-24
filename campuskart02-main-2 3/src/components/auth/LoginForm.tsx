import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { database } from '../../config/firebase';
import { ref, get, set } from 'firebase/database';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, Mail, Lock, UserCircle2 } from 'lucide-react';
import AnimatedBackground from '../common/AnimatedBackground';
import CollegeSelect, { CollegeSelectValue } from '../common/CollegeSelect';
export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCollegePrompt, setShowCollegePrompt] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<{
    uid: string;
    name: string;
    email: string;
    mobile: string;
    city: string;
    college: string;
    profilePhoto?: string;
  } | null>(null);
  const [googleCollegeValue, setGoogleCollegeValue] = useState<CollegeSelectValue>({ city: '', college: '' });
  const [collegeError, setCollegeError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (email === 'admin@campuskart.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        client_id: '851217881834-95r6r9nerg472iq8p6gp3gs8oi8olsjq.apps.googleusercontent.com',
      });
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const existingUser = snapshot.exists() ? snapshot.val() : null;
      const updatedProfile = {
        uid: user.uid,
        name: existingUser?.name || user.displayName || '',
        email: existingUser?.email || user.email || '',
        city: existingUser?.city || '',
        college: existingUser?.college || '',
        mobile: existingUser?.mobile || user.phoneNumber || '',
        followers: existingUser?.followers || [],
        following: existingUser?.following || [],
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        profilePhoto: existingUser?.profilePhoto || user.photoURL || ''
      };
      await set(userRef, updatedProfile);
      const isAdmin = user.email === 'admin@campuskart.com';
      if (isAdmin) {
        navigate('/admin');
        return;
      }
      if (!updatedProfile.college) {
        setGoogleUserData(updatedProfile);
        setGoogleCollegeValue({ city: updatedProfile.city || '', college: '' });
        setShowCollegePrompt(true);
        setLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGoogleCollegeSubmit = async () => {
    if (!googleUserData) return;
    if (!googleCollegeValue.college.trim()) {
      setCollegeError('Please select your college to continue');
      return;
    }

    setLoading(true);
    setCollegeError('');

    try {
      const userRef = ref(database, `users/${googleUserData.uid}`);
      await set(userRef, {
        ...googleUserData,
        college: googleCollegeValue.college,
        city: googleCollegeValue.city || googleUserData.city || ''
      });
      setShowCollegePrompt(false);
      setGoogleUserData(null);
      navigate('/dashboard');
    } catch (error: any) {
      setCollegeError(error.message || 'Unable to save college.');
    }

    setLoading(false);
  };

  return (
    <>
      {showCollegePrompt && googleUserData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Complete your profile</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">Welcome, {googleUserData.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">Select your college to continue using CampusKart.</p>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600"
                  onClick={() => setShowCollegePrompt(false)}
                >
                  Close
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Name</label>
                  <input
                    type="text"
                    value={googleUserData.name}
                    disabled
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700"
                  />
                </div>
                <CollegeSelect
                  value={googleCollegeValue}
                  onChange={(val) => setGoogleCollegeValue(val)}
                  required
                  comboMode
                  darkMode={false}
                />
                {collegeError && <p className="text-sm text-red-600">{collegeError}</p>}
                <button
                  type="button"
                  onClick={handleGoogleCollegeSubmit}
                  disabled={loading}
                  className="w-full rounded-3xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
                >
                  {loading ? 'Saving college...' : 'Continue to CampusKart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <AnimatedBackground className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/75 to-slate-900/90" />
        <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 p-4">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-2 text-gray-300">
              Sign in to your CampusKart account
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 overflow-hidden">
            {error && (
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all hover:bg-white/15"
                    placeholder="your.email@college.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all hover:bg-white/15"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.01] hover:shadow-violet-500/45 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCircle2 className="h-5 w-5" />
                Continue with Google
              </button>

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-400">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                    Create one
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer Text */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Safe and secure. We never share your data.</p>
            <p>
              by company{' '}
              <a href="https://zeyotech.in" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">
                zeyOtech
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
