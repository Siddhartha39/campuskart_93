import React, { useState } from 'react';
import { ref, push } from 'firebase/database';
import { database } from '../../config/firebase';
import { uploadSupabaseFile, SUPABASE_BUCKETS, sanitizeFileName } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Upload, DollarSign, Package, Tag, Info, Phone, CheckCircle } from 'lucide-react';
import BackButton from '../common/BackButton';

export const SellForm: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    productName: '',
    type: '',
    price: '',
    category: 'gadgets' as 'gadgets' | 'books' | 'stationary' | 'other',
    condition: 'new' as 'new' | 'like new' | 'used',
    description: '',
    showMobileNumber: false
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'gadgets', label: 'Gadgets' },
    { value: 'books', label: 'Books' },
    { value: 'stationary', label: 'Stationary' },
    { value: 'other', label: 'Other' }
  ];

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like new', label: 'Like New' },
    { value: 'used', label: 'Used' }
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const maxSelection = 6 - images.length;
    const filesToAdd = selectedFiles.slice(0, maxSelection);
    const updatedImages = [...images, ...filesToAdd];
    setImages(updatedImages);

    const readers = filesToAdd.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((previews) => setImagePreviews((prev) => [...prev, ...previews]));

    if (selectedFiles.length > maxSelection) {
      setError('You can upload up to 6 images.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `images/${Date.now()}-${sanitizeFileName(file.name)}`;
    return uploadSupabaseFile(SUPABASE_BUCKETS.images, fileName, file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please log in to post an item.');
      return;
    }
    if (!userData) {
      setError('Your profile is still loading. Please wait a moment and try again.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (images.length === 0) {
        setError('Please select at least one image for your product.');
        setLoading(false);
        return;
      }

      const uploadedImages: string[] = [];
      for (const imageFile of images) {
        try {
          const url = await uploadImage(imageFile);
          uploadedImages.push(url);
        } catch (uploadError: any) {
          console.error('Upload error details:', uploadError);
          setError(uploadError?.message || 'Failed to upload one of the images. Please try again.');
          setLoading(false);
          return;
        }
      }

      const itemData = {
        sellerId: currentUser.uid,
        sellerName: userData.name,
        sellerCollege: userData.college,
        sellerMobile: userData.mobile || '',
        productName: formData.productName,
        productImage: uploadedImages[0],
        productImages: uploadedImages,
        type: formData.type,
        price: parseInt(formData.price),
        category: formData.category,
        condition: formData.condition,
        description: formData.description,
        showMobileNumber: formData.showMobileNumber,
        isActive: true,
        isSold: false,
        createdAt: new Date().toISOString()
      };
      
      const itemsRef = ref(database, 'items');
      await push(itemsRef, itemData);
      
      // Reset form after successful submission
      setFormData({
        productName: '',
        type: '',
        price: '',
        category: 'gadgets',
        condition: 'new',
        description: '',
        showMobileNumber: false
      });
      setImages([]);
      setImagePreviews([]);
      setLoading(false);
      
      navigate('/buy');
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err?.message || 'An error occurred while submitting the form. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.24),_transparent_22%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] text-slate-100 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-20 right-10 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse delay-200" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl animate-pulse delay-400" />
      </div>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-950/95 rounded-[2rem] shadow-2xl border border-slate-800 ring-1 ring-cyan-500/10 p-8 backdrop-blur-xl">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Sell Your Item</h1>
              <p className="text-slate-300">Post your item for sale on CampusKart</p>
              <p className="text-sm text-slate-400 italic mt-2">Note: Your item will be automatically removed after 6 months.</p>
            </div>
            <BackButton toHomeFallback="/dashboard" />
          </div>

          {error && (
            <div className="mb-6 bg-red-950/80 border border-red-700 text-red-200 px-4 py-3 rounded-2xl shadow-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Product Images
              </label>
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-sky-400 transition duration-300 bg-slate-900/70">
                {imagePreviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                          <img src={preview} alt={`Preview ${index + 1}`} className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setImages((prev) => prev.filter((_, i) => i !== index));
                              setImagePreviews((prev) => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-2 right-2 rounded-full bg-red-500/90 p-1 text-white hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-slate-400">You can upload up to 6 images. Add more or replace selected images.</div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-sky-400 mx-auto mb-4" />
                    <p className="text-slate-300 mb-2">Click to upload product images</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-full hover:from-sky-400 hover:to-cyan-400 cursor-pointer transition"
                    >
                      Choose Images
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Product Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-cyan-300" />
                </div>
                <input
                  type="text"
                  name="productName"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter product name"
                  value={formData.productName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Product Type *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-cyan-300" />
                </div>
                <input
                  type="text"
                  name="type"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g., Laptop, Textbook, Notebook"
                  value={formData.type}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Price and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Price (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-cyan-300" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    required
                    min="1"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="0"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  className="block w-full px-3 py-3 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Condition *
              </label>
              <div className="grid grid-cols-3 gap-4">
                {conditions.map(condition => (
                  <label key={condition.value} className="relative">
                    <input
                      type="radio"
                      name="condition"
                      value={condition.value}
                      checked={formData.condition === condition.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-2xl cursor-pointer text-center transition-all ${
                      formData.condition === condition.value
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200 shadow-lg shadow-cyan-500/10'
                        : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-500'
                    }`}>
                      <span className="font-medium">{condition.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <Info className="h-5 w-5 text-cyan-300" />
                </div>
                <textarea
                  name="description"
                  rows={4}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  placeholder="Add details about your item..."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Show Mobile Number */}
            <div className="flex items-center space-x-3 p-4 bg-slate-900 rounded-2xl border border-slate-700">
              <input
                type="checkbox"
                id="showMobileNumber"
                name="showMobileNumber"
                checked={formData.showMobileNumber}
                onChange={handleInputChange}
                className="h-4 w-4 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500"
              />
              <div className="flex items-center space-x-2 text-slate-200">
                <Phone className="h-5 w-5 text-cyan-300" />
                <label htmlFor="showMobileNumber" className="text-sm font-medium">
                  Show my mobile number to potential buyers
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || !currentUser || !userData}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-medium rounded-full hover:from-sky-400 hover:to-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Posting Item...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Post Item for Sale
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};