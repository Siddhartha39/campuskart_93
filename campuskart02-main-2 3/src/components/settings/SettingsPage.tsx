import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { database } from '../../config/firebase';
import { ref, update } from 'firebase/database';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Settings, User, Lock, Calendar, Eye, EyeOff, Save, X } from 'lucide-react';
import BackButton from '../common/BackButton';

export const SettingsPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  // Removed unused loading state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Name update state
  const [newName, setNewName] = useState(userData?.name || '');
  const [nameLoading, setNameLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Holiday mode state
  const [holidayMode, setHolidayMode] = useState({
    isActive: userData?.holidayMode?.isActive || false,
    fromDate: userData?.holidayMode?.fromDate || '',
    toDate: userData?.holidayMode?.toDate || ''
  });
  const [holidayLoading, setHolidayLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setNewName(userData.name || '');
      setHolidayMode({
        isActive: userData.holidayMode?.isActive || false,
        fromDate: userData.holidayMode?.fromDate || '',
        toDate: userData.holidayMode?.toDate || ''
      });
    }
  }, [userData]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateName = async () => {
    if (!currentUser || !newName.trim()) return;
    
    setNameLoading(true);
    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, { name: newName.trim() });
      showMessage('success', 'Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      showMessage('error', 'Failed to update name. Please try again.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;
    
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('error', 'Please fill in all password fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      // Clear form
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showMessage('error', 'Current password is incorrect.');
      } else {
        showMessage('error', 'Failed to change password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleHolidayMode = async () => {
    if (!currentUser) return;
    
    if (holidayMode.isActive && (!holidayMode.fromDate || !holidayMode.toDate)) {
      showMessage('error', 'Please select both from and to dates for holiday mode.');
      return;
    }
    
    if (holidayMode.isActive && new Date(holidayMode.fromDate) >= new Date(holidayMode.toDate)) {
      showMessage('error', 'From date must be before to date.');
      return;
    }

    setHolidayLoading(true);
    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const holidayData = holidayMode.isActive ? {
        isActive: true,
        fromDate: holidayMode.fromDate,
        toDate: holidayMode.toDate,
        activatedAt: Date.now()
      } : {
        isActive: false,
        fromDate: '',
        toDate: '',
        deactivatedAt: Date.now()
      };
      
      await update(userRef, { holidayMode: holidayData });
      showMessage('success', `Holiday mode ${holidayMode.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating holiday mode:', error);
      showMessage('error', 'Failed to update holiday mode. Please try again.');
    } finally {
      setHolidayLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton toHomeFallback="/dashboard" />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-gray-600 mt-2">Manage your account preferences and privacy settings</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Update Name */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Update Name</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>
            <button
              onClick={handleUpdateName}
              disabled={nameLoading || newName.trim() === userData.name}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nameLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Update Name
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Change Password
            </button>
          </div>
        </div>

        {/* Holiday Mode */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Holiday Mode</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Hide your profile and items from other users during your holiday period. Your items won't appear in search results or marketplace listings.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="holidayMode"
                checked={holidayMode.isActive}
                onChange={(e) => setHolidayMode(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
              />
              <label htmlFor="holidayMode" className="text-sm font-medium text-gray-700">
                Activate Holiday Mode
              </label>
            </div>

            {holidayMode.isActive && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={holidayMode.fromDate}
                    onChange={(e) => setHolidayMode(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={holidayMode.toDate}
                    onChange={(e) => setHolidayMode(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    min={holidayMode.fromDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleHolidayMode}
              disabled={holidayLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                holidayMode.isActive 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {holidayLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : holidayMode.isActive ? (
                <Calendar className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {holidayMode.isActive ? 'Activate Holiday Mode' : 'Deactivate Holiday Mode'}
            </button>
          </div>

          {userData.holidayMode?.isActive && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Holiday Mode Active:</strong> Your profile and items are currently hidden from {new Date(userData.holidayMode.fromDate).toLocaleDateString()} to {new Date(userData.holidayMode.toDate).toLocaleDateString()}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
