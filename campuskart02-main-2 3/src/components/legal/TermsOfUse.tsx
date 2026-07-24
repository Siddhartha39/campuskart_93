import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, FileText, Users, Shield, AlertTriangle, Scale } from 'lucide-react';

export const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">CampusKart</span>
            </Link>
            <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
            <p className="text-gray-600">Last updated: January 16, 2025</p>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  By accessing and using CampusKart, you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-600" />
                Platform Purpose & Community
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  CampusKart is a college-focused marketplace platform designed exclusively for students to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Buy and sell items within their college community</li>
                  <li>Discover and participate in campus events</li>
                  <li>Find study partners and teammates for projects</li>
                  <li>Access secure storage solutions through CampusVault</li>
                  <li>Connect with fellow students in a safe, verified environment</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-orange-600" />
                Important: No Financial Transactions
              </h2>
              <div className="space-y-4 text-gray-700 bg-orange-50 border border-orange-200 rounded-lg p-6">
                <p className="font-semibold text-orange-800">
                  CampusKart does NOT handle any financial transactions or payments.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We do not process payments, collect money, or handle financial transactions</li>
                  <li>All payments and money exchanges are conducted directly between users</li>
                  <li>Users are responsible for their own payment arrangements and methods</li>
                  <li>CampusKart is not liable for any financial disputes or payment issues</li>
                  <li>We recommend meeting in person for safe transactions within your college campus</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
              <div className="space-y-4 text-gray-700">
                <p>As a user of CampusKart, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and truthful information in your profile and listings</li>
                  <li>Use the platform only for legitimate educational and marketplace purposes</li>
                  <li>Respect other users and maintain a positive community environment</li>
                  <li>Not post illegal, harmful, or inappropriate content</li>
                  <li>Not engage in fraudulent activities or scams</li>
                  <li>Handle all financial transactions independently and responsibly</li>
                  <li>Report suspicious activities or violations to our support team</li>
                  <li>Keep your account credentials secure and confidential</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prohibited Activities</h2>
              <div className="space-y-4 text-gray-700">
                <p>The following activities are strictly prohibited on CampusKart:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Posting illegal items or services</li>
                  <li>Harassment, bullying, or threatening other users</li>
                  <li>Creating fake accounts or impersonating others</li>
                  <li>Spamming or sending unsolicited messages</li>
                  <li>Attempting to hack or compromise the platform's security</li>
                  <li>Using the platform for commercial purposes outside of student marketplace activities</li>
                  <li>Posting adult content or inappropriate material</li>
                  <li>Violating intellectual property rights</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" />
                Platform Limitations & Disclaimers
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>Please understand that:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>CampusKart is a platform for connecting students - we do not guarantee the quality, safety, or legality of items listed</li>
                  <li>We are not responsible for disputes between buyers and sellers</li>
                  <li>Users interact at their own risk and should exercise caution when meeting strangers</li>
                  <li>We recommend all meetings take place in safe, public locations on campus</li>
                  <li>The platform is provided "as is" without warranties of any kind</li>
                  <li>We reserve the right to remove content or suspend accounts that violate these terms</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Management</h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                  <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                  <li>You may delete your account at any time through your profile settings</li>
                  <li>Upon account deletion, your data will be removed according to our Privacy Policy</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  The CampusKart platform, including its design, features, and content, is owned by Siddhartha Singh and Sishant Verma. 
                  Users retain ownership of the content they post but grant us a license to display it on the platform.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Scale className="h-6 w-6 mr-2 text-blue-600" />
                Limitation of Liability
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  CampusKart, its creators, and operators shall not be liable for any direct, indirect, incidental, 
                  consequential, or punitive damages arising from your use of the platform. This includes but is not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Financial losses from transactions between users</li>
                  <li>Damages from defective or misrepresented items</li>
                  <li>Personal injury or property damage</li>
                  <li>Data loss or security breaches</li>
                  <li>Service interruptions or technical issues</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modifications to Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We reserve the right to modify these terms at any time. Users will be notified of significant changes, 
                  and continued use of the platform constitutes acceptance of the modified terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  These terms shall be governed by and construed in accordance with the laws of India. 
                  Any disputes arising from these terms or use of the platform shall be subject to the jurisdiction of Indian courts.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  For questions about these Terms of Use, please contact us at:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Email:</strong> helpdesk.campuskart@gmail.com</p>
                  <p><strong>Platform:</strong> CampusKart Support System</p>
                  <p><strong>Creators:</strong> Siddhartha Singh & Sishant Verma</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              These Terms of Use are effective as of January 16, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
