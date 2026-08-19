import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initializeColleges } from './utils/initializeColleges';
import { Navbar } from './components/layout/Navbar';
import { WelcomePage } from './components/welcome/WelcomePage';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { SellForm } from './components/sell/SellForm';
import { BuyPage } from './components/buy/BuyPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfilePage } from './components/profile/ProfilePage';
import { UserProfile } from './components/profile/UserProfile';
import { ItemDetails } from './components/buy/ItemDetails';
import { MessagesPage } from './components/messages/MessagesPage';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { EventsPage } from './components/events/EventsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfUse } from './components/legal/TermsOfUse';
import { TeammateFinder } from './components/teammates/TeammateFinder';
import { CampusWhisperPage } from './components/campusWhisper/CampusWhisperPage';
import { PlacementPage } from './components/placements/PlacementPage';
import { PlacementDetailsPage } from './components/placements/PlacementDetailsPage';
import { ResumeAnalyzerPage } from './components/placements/ResumeAnalyzerPage';
import { SupportPage } from './components/support/SupportPage';
import { DummyPage } from './components/common/DummyPage';
import { DownloadPage } from './components/download/DownloadPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  return currentUser && isAdmin ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  if (currentUser) {
    return isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  const { currentUser } = useAuth();

  React.useEffect(() => {
    // Initialize colleges in Firebase on app startup
    initializeColleges();
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      {currentUser && <Navbar />}
      
      <Routes>
        <Route path="/" element={
          <WelcomePage />
        } />
        
        <Route path="/login" element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        } />
        
        <Route path="/signup" element={
          <PublicRoute>
            <SignupForm />
          </PublicRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/sell" element={
          <ProtectedRoute>
            <SellForm />
          </ProtectedRoute>
        } />
        
        <Route path="/buy" element={
          <ProtectedRoute>
            <BuyPage />
          </ProtectedRoute>
        } />
        
        <Route path="/item/:itemId" element={
          <ProtectedRoute>
            <ItemDetails />
          </ProtectedRoute>
        } />
        
        <Route path="/events" element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/vault" element={
          <ProtectedRoute>
            <div className="p-8">
              <h1 className="text-2xl font-bold">CampusVault - Coming Soon</h1>
              <p>Secure storage solutions for your items.</p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/teammates" element={
          <ProtectedRoute>
            <TeammateFinder />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile/:userId" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/messages" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        
        <Route path="/campus-whisper" element={<CampusWhisperPage />} />
        <Route path="/placement" element={<PlacementPage />} />
        <Route path="/placement/:placementId" element={<PlacementDetailsPage />} />
        <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
        <Route path="/support" element={
          <ProtectedRoute>
            <SupportPage />
          </ProtectedRoute>
        } />
        <Route path="/download-app" element={<DownloadPage />} />
        {/* Legal Pages - Public Routes */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
