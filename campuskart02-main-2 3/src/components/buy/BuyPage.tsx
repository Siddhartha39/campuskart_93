import React, { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List, MapPin, Calendar, Heart, Package, MessageCircle, Phone as PhoneIcon, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../common/BackButton';
import { normalizeSupabasePublicUrl } from '../../config/supabase';

export const BuyPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [autoCollegeApplied, setAutoCollegeApplied] = useState(false);
  const [contactItem, setContactItem] = useState<any | null>(null);

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'gadgets', label: 'Gadgets' },
    { value: 'books', label: 'Books' },
    { value: 'stationary', label: 'Stationary' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    const itemsRef = ref(database, 'items');
    const usersRef = ref(database, 'users');
    
    const unsubscribe = onValue(itemsRef, async (snapshot) => {
      try {
        if (snapshot.exists()) {
          const itemsData = snapshot.val();
          
          // Get users data to check holiday mode
          const usersSnapshot = await get(usersRef);
          const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};
          
          const itemsList = Object.keys(itemsData)
            .map(key => ({ ...itemsData[key], id: key }))
            .filter(item => {
              if (!item.isActive) return false;
              
              // Check if seller is in holiday mode
              const seller = usersData[item.sellerId];
              if (seller?.holidayMode?.isActive) {
                const now = new Date();
                const fromDate = new Date(seller.holidayMode.fromDate);
                const toDate = new Date(seller.holidayMode.toDate);
                
                // Hide items if current date is within holiday period
                if (now >= fromDate && now <= toDate) {
                  return false;
                }
              }
              
              return true;
            });
          setItems(itemsList);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Failed to load buy items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-apply user's registered college as initial filter once
  useEffect(() => {
    if (!autoCollegeApplied && userData?.college) {
      setSelectedCollege(userData.college);
      setAutoCollegeApplied(true);
    }
  }, [userData, autoCollegeApplied]);

  // Get unique colleges from items
  const availableColleges = Array.from(new Set(items.map(item => item.sellerCollege)))
    .filter(college => college && college.toLowerCase().includes(collegeSearch.toLowerCase()))
    .sort();

  const filteredItems = items
    .filter(item => {
      const productName = String(item.productName || '');
      const itemType = String(item.type || '');
      const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           itemType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesCollege = selectedCollege === 'all' || item.sellerCollege === selectedCollege;
      return matchesSearch && matchesCategory && matchesCollege;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'oldest':
          return dateA - dateB;
        default: // newest
          return dateB - dateA;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'radial-gradient(circle at top left, rgba(236,72,153,0.18), transparent 20%), radial-gradient(circle at bottom right, rgba(168,85,247,0.16), transparent 18%), #fdf5ff'
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(56,189,248,0.38), rgba(168,85,247,0.30), rgba(236,72,153,0.28), rgba(96,165,250,0.20))',
            backgroundSize: '300% 300%',
            animation: 'moveGradient 14s ease infinite'
          }}
        />
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute right-10 top-52 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </div>
      <style>{`@keyframes moveGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 text-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Browse Items</h1>
              <p className="text-violet-100 mt-1">Discover amazing deals from your campus community</p>
            </div>
            
            {/* Back + Search */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <BackButton toHomeFallback="/dashboard" />
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <Filter className="h-5 w-5 text-blue-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto bg-white shadow-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            {/* College typeahead filter */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search college..."
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {collegeSearch && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white rounded-md shadow-lg border">
                  {availableColleges.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">No matches</div>
                  ) : (
                    availableColleges.map((college) => (
                      <button
                        type="button"
                        key={college}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setSelectedCollege(college);
                          setCollegeSearch('');
                          setAutoCollegeApplied(true);
                        }}
                      >
                        {college}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedCollege !== 'all' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <span className="truncate max-w-[14rem]">{selectedCollege}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCollege('all');
                    setCollegeSearch('');
                    setAutoCollegeApplied(true);
                  }}
                  aria-label="Clear college filter"
                  className="ml-1 text-blue-700 hover:text-blue-900"
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results Count */}
<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-gray-600 font-medium">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
            </p>
            <div className="rounded-full bg-slate-100 border border-slate-200 px-4 py-2 text-sm text-slate-600 shadow-sm">View mode: {viewMode === 'grid' ? 'Grid' : 'List'}</div>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/item/${item.id}`)}
                className={`bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-2xl transition-all duration-300 cursor-pointer group ${
                  viewMode === 'list' ? 'flex gap-6 p-6' : 'overflow-hidden'
                }`}
              >
                <div className={viewMode === 'list' ? 'w-48 h-36 flex-shrink-0 overflow-hidden rounded-3xl' : 'aspect-square overflow-hidden'}>
                  <img
                    src={normalizeSupabasePublicUrl((item.productImages && item.productImages[0]) || item.productImage) || 'https://via.placeholder.com/300x300?text=No+Image'}
                    alt={item.productName}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className={viewMode === 'list' ? 'flex-1' : 'p-5'}>
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 text-lg">
                      {item.productName}
                    </h3>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-full">
                      <Heart className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-500 mb-3">{item.type}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <span className="text-2xl font-semibold text-sky-600">₹{item.price.toLocaleString()}</span>
                    <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                      item.condition === 'new' ? 'bg-emerald-100 text-emerald-700' :
                      item.condition === 'like new' ? 'bg-sky-100 text-sky-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {item.condition}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {item.sellerCollege}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row gap-3">
                    <button
                      className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      onClick={(e) => { e.stopPropagation(); navigate(`/item/${item.id}`); }}
                    >
                      See Details
                    </button>
                    <button
                      className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 text-white hover:brightness-110 transition shadow-lg"
                      onClick={(e) => { e.stopPropagation(); setContactItem(item); }}
                    >
                      <MessageCircle className="h-4 w-4 inline-block mr-1" /> Contact Seller
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {contactItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setContactItem(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Contact Seller</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Choose how you want to reach the seller for "{contactItem.productName}".</p>
            <div className="space-y-3">
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => {
                  setContactItem(null);
                  navigate(`/messages?userId=${encodeURIComponent(contactItem.sellerId)}&itemId=${encodeURIComponent(contactItem.id)}`);
                }}
              >
                <MessageCircle className="h-5 w-5" /> Message Seller
              </button>
              {contactItem.showMobileNumber && contactItem.sellerMobile && (
                <a
                  href={`tel:${contactItem.sellerMobile}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200"
                  onClick={() => setContactItem(null)}
                >
                  <PhoneIcon className="h-5 w-5" /> Call {contactItem.sellerMobile}
                </a>
              )}
            </div>
            <button
              className="mt-6 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              onClick={() => setContactItem(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};