import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  toHomeFallback?: string; // default: /dashboard
  label?: string; // default: Back
}

const BackButton: React.FC<BackButtonProps> = ({ className = '', toHomeFallback = '/dashboard', label = 'Back' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // If there is a referrer history, go back; otherwise go to dashboard
    if (window.history.length > 1 && document.referrer && new URL(document.referrer, window.location.href).origin === window.location.origin) {
      navigate(-1);
    } else {
      navigate(toHomeFallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
