import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { database } from '../../config/firebase';
import { normalizeSupabasePublicUrl } from '../../config/supabase';
import { ref, get, push, set } from 'firebase/database';
import { Item, User } from '../../types';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  Calendar, 
  Phone, 
  MessageCircle, 
  User as UserIcon,
  Shield,
  Star,
  Package
} from 'lucide-react';

export const ItemDetails: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (itemId) {
      setSelectedImageIndex(0);
      fetchItemDetails();
    }
  }, [itemId]);

  const fetchItemDetails = async () => {
    if (!itemId) return;
    
    try {
      // Fetch item details
      const itemRef = ref(database, `items/${itemId}`);
      const itemSnapshot = await get(itemRef);
      
      if (itemSnapshot.exists()) {
        const itemData = { id: itemId, ...itemSnapshot.val() };
        setItem(itemData);
        
        // Fetch seller details
        const sellerRef = ref(database, `users/${itemData.sellerId}`);
        const sellerSnapshot = await get(sellerRef);
        
        if (sellerSnapshot.exists()) {
          setSeller(sellerSnapshot.val());
        }
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    } finally {
      setLoading(false);
    }
  };

  const galleryImages = item?.productImages?.filter(Boolean) && item.productImages.length > 0
    ? item.productImages.filter(Boolean)
    : item?.productImage
      ? [item.productImage]
      : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // TODO: Implement messaging functionality
    alert(`Message sent to ${seller?.name}: ${message}`);
    setMessage('');
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !item || !offerPrice) return;
    const numeric = Number(offerPrice);
    if (Number.isNaN(numeric) || numeric <= 0) return;

    try {
      setSubmittingOffer(true);
      const offersRef = ref(database, `offers/${item.id}`);
      const newOfferRef = push(offersRef);
      await set(newOfferRef, {
        itemId: item.id,
        sellerId: item.sellerId,
        buyerId: currentUser.uid,
        offerPrice: numeric,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      setOfferPrice('');
      alert('Offer submitted to seller.');
    } catch (err) {
      console.error('Error submitting offer:', err);
      alert('Failed to submit offer. Please try again.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleStartChat = async () => {
    if (!currentUser || !item || !seller) return;
    try {
      setStartingChat(true);
      const chatsRef = ref(database, 'chats');
      const newChatRef = push(chatsRef);
      await set(newChatRef, {
        itemId: item.id,
        participants: [currentUser.uid, seller.uid],
        lastMessage: message || 'Started a chat about this item',
        updatedAt: new Date().toISOString(),
      });
      // Optional: route to messages page if implemented
      // navigate('/messages');
      alert('Chat started with seller. You can continue in Messages.');
      setMessage('');
    } catch (err) {
      console.error('Error starting chat:', err);
      alert('Failed to start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item?.productName,
        text: `Check out this ${item?.productName} for ₹${item?.price}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Item not found</h2>
          <p className="text-gray-600 mb-4">The item you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/buy')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate('/buy')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Browse
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full ${isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-red-100 hover:text-red-600`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border">
              <img
                src={normalizeSupabasePublicUrl(galleryImages[selectedImageIndex] || item.productImage)}
                alt={item.productName}
                className="w-full h-full object-cover"
              />
            </div>
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`overflow-hidden rounded-xl border ${selectedImageIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} bg-white shadow-sm transition`}
                  >
                    <img src={normalizeSupabasePublicUrl(image)} alt={`${item.productName} ${index + 1}`} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.productName}</h1>
                  <p className="text-lg text-gray-600">{item.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">₹{item.price.toLocaleString()}</div>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    item.condition === 'new' ? 'bg-green-100 text-green-800' :
                    item.condition === 'like new' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.condition}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Posted {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{item.sellerCollege}</span>
                </div>
              </div>

              {item.description && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Seller Information
              </h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  {seller.profilePhoto ? (
                    <img src={seller.profilePhoto} alt={seller.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600">{seller.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{seller.name}</h4>
                  <p className="text-sm text-gray-600">{seller.college}</p>
                  <p className="text-sm text-gray-500">{seller.city}</p>
                </div>
                <button
                  onClick={() => navigate(`/profile/${seller.uid}`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  View Profile
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Verified Student</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>{seller.followers?.length || 0} followers</span>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            {currentUser?.uid !== item.sellerId && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Contact Seller
                </h3>

                {item.showMobileNumber && item.sellerMobile && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Mobile: </span>
                      <a href={`tel:${item.sellerMobile}`} className="font-semibold hover:underline">
                        {item.sellerMobile}
                      </a>
                    </div>
                  </div>
                )}

                {/* Make an Offer */}
                <form onSubmit={handleSubmitOffer} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Make an offer</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min={1}
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Enter your offer price"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingOffer}
                      className="px-5 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {submittingOffer ? 'Submitting...' : 'Send Offer'}
                    </button>
                  </div>
                </form>

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hi ${seller.name}, I'm interested in your ${item.productName}...`}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    required
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Send Message
                    </button>
                    <button
                      type="button"
                      onClick={handleStartChat}
                      disabled={startingChat}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {startingChat ? 'Starting Chat...' : 'Chat with Seller'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
