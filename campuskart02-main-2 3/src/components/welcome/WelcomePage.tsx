import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Users, 
  Sparkles,
  TrendingUp,
  Star,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Globe,
  Heart,
  Download
} from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'Campus Whisper',
      description: 'Share anonymous campus thoughts and ask questions'
    },
    {
      icon: TrendingUp,
      title: 'Placements & Internships',
      description: 'Discover top company opportunities and apply'
    },
    {
      icon: Users,
      title: 'Find Teammates',
      description: 'Connect with study partners and project collaborators'
    },
    {
      icon: ShoppingBag,
      title: 'Buy & Sell',
      description: 'Trade items safely within your college community'
    }
  ];

  const benefits = [
    'College-verified community',
    'Secure transactions',
    'Real-time messaging',
    'Event notifications',
    'Profile management',
    'Mobile-friendly design'
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 bg-[linear-gradient(135deg,_rgba(79,70,229,0.8),_rgba(168,85,247,0.75),_rgba(99,102,241,0.7),_rgba(15,23,42,0.95))] bg-[length:300%_300%] animate-gradient-move text-slate-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">CampusKart</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105 text-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-16 left-10 h-24 w-24 rounded-full bg-sky-400/20 blur-3xl animate-core-move" />
          <div className="absolute top-24 right-16 h-20 w-20 rounded-full bg-fuchsia-400/20 blur-3xl animate-core-move" />
          <div className="absolute bottom-24 left-1/4 h-16 w-16 rounded-full bg-cyan-300/15 blur-3xl animate-core-move" />
          <div className="absolute bottom-12 right-28 h-12 w-12 rounded-full bg-violet-300/15 blur-3xl animate-core-move" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="h-4 w-4 mr-2" />
              India's Premier College Marketplace
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Your Campus
              <span className="bg-gradient-to-r from-cyan-300 to-sky-200 bg-clip-text text-transparent">
                {' '}Marketplace
              </span>
            </h1>
            
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect, trade, and collaborate with your college community. Buy and sell items, 
              discover events, find study partners, and build lasting connections.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="group bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/download-app"
                className="inline-flex items-center rounded-full border border-blue-200 bg-white px-8 py-4 text-lg font-semibold text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-50"
              >
                <Download className="mr-2 h-5 w-5" />
                Download APK
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="hidden sm:block absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20"></div>
        <div className="hidden sm:block absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
        <div className="hidden sm:block absolute bottom-20 left-20 w-12 h-12 bg-green-200 rounded-full opacity-20"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Campus Life
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From buying textbooks to finding study partners, CampusKart has you covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  <feature.icon className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-lg font-medium text-gray-700">Login to see more features and unlock the full CampusKart experience.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Why Choose CampusKart?
              </h2>
              <p className="text-blue-100 text-lg mb-8">
                Built specifically for college students, by college students. 
                Experience the safest and most convenient way to trade within your campus community.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center text-white">
                    <CheckCircle className="h-5 w-5 text-green-300 mr-3 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <div className="flex items-center mb-6">
                  <div className="bg-white/20 p-3 rounded-full mr-4">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Mobile Ready</h3>
                    <p className="text-blue-100">Access anywhere, anytime</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-6">
                  <div className="bg-white/20 p-3 rounded-full mr-4">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">College Network</h3>
                    <p className="text-blue-100">Connect with your peers</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-full mr-4">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Community First</h3>
                    <p className="text-blue-100">Built for students</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join Your Campus Community?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start buying, selling, and connecting with thousands of students across India
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="border border-gray-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Main Footer Content */}
            <div className="flex flex-col md:flex-row justify-between items-center w-full">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-white">CampusKart</span>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-400 mb-1">
                  © 2025 CampusKart. Made with ❤️ for college students.
                </p>
                <p className="text-gray-400 text-sm mb-1"></p>
               <p className="text-gray-500 text-sm">
  Created & Maintained by{' '}
  <a href="https://www.linkedin.com/in/siddhartha-singh-3939s/" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-medium hover:text-blue-300">Siddhartha Singh</a>,{' '}
  <a href="https://www.linkedin.com/in/sishant-verma/" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-medium hover:text-blue-300">Sishant Verma</a> &{' '}
  <a href="https://www.linkedin.com/in/apoorva2004/" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-medium hover:text-blue-300">Apoorva Singh</a>
</p>

              </div>
            </div>
            
            {/* Legal Links */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 pt-4 border-t border-gray-800 w-full justify-center">
              <Link 
                to="/privacy-policy" 
                className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="hidden sm:block text-gray-600">•</span>
              <Link 
                to="/terms-of-use" 
                className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
