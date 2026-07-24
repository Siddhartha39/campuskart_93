import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { database } from '../../config/firebase';
import { ref, push } from 'firebase/database';
import { X, Send, Ticket, AlertCircle, CheckCircle } from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ isOpen, onClose }) => {
  const { userData, currentUser } = useAuth();
  const [formData, setFormData] = useState({
    purpose: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ticketId, setTicketId] = useState<string>('');

  const purposes = [
    'Account Issues',
    'Payment Problems',
    'Item Listing Issues',
    'Technical Bug',
    'Feature Request',
    'Safety Concerns',
    'Other'
  ];

  const generateTicketId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purpose || !formData.description.trim()) return;

    setIsSubmitting(true);
    const newTicketId = generateTicketId();
    setTicketId(newTicketId);

    try {
      // Save ticket to Firebase for user history
      const ticketData = {
        ticketId: newTicketId,
        userId: currentUser?.uid,
        userName: userData?.name,
        userEmail: userData?.email,
        userCollege: userData?.college,
        purpose: formData.purpose,
        description: formData.description,
        status: 'open',
        createdAt: new Date().toISOString(),
        timestamp: Date.now()
      };

      const ticketsRef = ref(database, `supportTickets/${currentUser?.uid}`);
      await push(ticketsRef, ticketData);

      // Submit to Formspree
      const formspreeData = new FormData();
      formspreeData.append('ticketId', newTicketId);
      formspreeData.append('name', userData?.name || '');
      formspreeData.append('email', userData?.email || '');
      formspreeData.append('college', userData?.college || '');
      formspreeData.append('purpose', formData.purpose);
      formspreeData.append('description', formData.description);
      formspreeData.append('userId', currentUser?.uid || '');

      const response = await fetch('https://formspree.io/f/mrblvzea', {
        method: 'POST',
        body: formspreeData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ purpose: '', description: '' });
      } else {
        throw new Error('Failed to submit ticket');
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ purpose: '', description: '' });
    setSubmitStatus('idle');
    setTicketId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ticket className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Support Ticket</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket Submitted!</h3>
              <p className="text-gray-600 mb-4">
                Your support ticket has been submitted successfully.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Ticket ID:</strong> #{ticketId}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Save this ID for future reference
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          ) : submitStatus === 'error' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Failed</h3>
              <p className="text-gray-600 mb-6">
                There was an error submitting your ticket. Please try again or contact us directly.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose *
                </label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                >
                  <option value="">Select a purpose</option>
                  {purposes.map(purpose => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none placeholder:text-slate-500"
                  placeholder="Please describe your issue or request in detail..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Your Information</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {userData?.name}</p>
                  <p><strong>Email:</strong> {userData?.email}</p>
                  <p><strong>College:</strong> {userData?.college}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.purpose || !formData.description.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
