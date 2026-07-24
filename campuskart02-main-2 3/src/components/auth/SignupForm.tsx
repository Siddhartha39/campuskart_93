import React, { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, User, Mail, Phone, Lock, UserCircle2 } from 'lucide-react';
import CollegeSelect from '../common/CollegeSelect';
import AnimatedBackground from '../common/AnimatedBackground';

export const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    city: '',
    college: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'city' && { college: '' }) // Reset college when city changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Privacy Policy and Terms of Use to continue");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Save user data to Firebase Realtime Database
      await set(ref(database, `users/${user.uid}`), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        city: formData.city,
        college: formData.college,
        mobile: formData.mobile,
        followers: [],
        following: [],
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
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
      if (!snapshot.exists()) {
        await set(userRef, {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          city: '',
          college: '',
          mobile: user.phoneNumber || '',
          followers: [],
          following: [],
          createdAt: new Date().toISOString(),
          profilePhoto: user.photoURL || ''
        });
      }
      if (user.email === 'admin@campuskart.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-auto scrolling-touch scroll-smooth bg-slate-950 text-slate-100">
      <AnimatedBackground className="opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/70 to-slate-900/80" />
      <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-[2rem] overflow-hidden shadow-2xl bg-slate-950/95 border border-slate-800/90 backdrop-blur-xl">
            <div className="bg-slate-950/95 p-8 sm:p-10">              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 p-4 shadow-lg shadow-violet-500/20 mb-4">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-white">Join CampusKart</h2>
                <p className="mt-2 text-slate-300">Create your account and start your campus journey</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-900/10 bg-slate-950/95 p-8 shadow-xl">
                {error && (
                  <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm backdrop-blur-sm">
                    {error}
                  </div>
                )}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        required
                        className="block w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-lg placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all hover:bg-slate-900"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        className="block w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-lg placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all hover:bg-slate-900"
                        placeholder="your.email@college.com"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      College
                    </label>
                    <div className="rounded-lg relative">
                      <CollegeSelect
                        required
                        value={{ city: formData.city, college: formData.college }}
                        onChange={(val) => setFormData(prev => ({ ...prev, city: val.city, college: val.college }))}
                        comboMode
                        darkMode={true}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="mobile"
                        required
                        className="block w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-lg placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all hover:bg-slate-900"
                        placeholder="+91 10000 00000"
                        value={formData.mobile}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        className="block w-full pl-12 pr-12 py-3 bg-slate-900/90 border border-slate-700 rounded-lg placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all hover:bg-slate-900"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleInputChange}
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        className="block w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-lg placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all hover:bg-slate-900"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.01] hover:shadow-violet-500/45 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCircle2 className="h-5 w-5" />
                    Continue with Google
                  </button>
                  <div className="flex items-start pt-2">
                    <div className="flex items-center h-5">
                      <input
                        id="accept-terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="focus:ring-violet-500 h-4 w-4 text-violet-600 bg-white/10 border-white/20 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="accept-terms" className="text-gray-300">
                        I agree to the{' '}
                        <Link
                          to="/privacy-policy"
                          className="text-violet-400 hover:text-violet-300 underline transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Privacy Policy
                        </Link>
                        {' '}and{' '}
                        <Link
                          to="/terms-of-use"
                          className="text-violet-400 hover:text-violet-300 underline transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Terms of Use
                        </Link>
                      </label>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading || !acceptedTerms}
                      className="group relative w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-400">
                      Already have an account?{' '}
                      <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
              <div className="text-center text-xs text-gray-500 mt-4">
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
      </div>
    </div>
  );
};
