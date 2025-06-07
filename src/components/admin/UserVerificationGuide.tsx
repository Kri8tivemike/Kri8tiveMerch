import React from 'react';
import { X, UserCheck, CheckCircle, RefreshCw, AlertTriangle, ExternalLink, Trash2, Users } from 'lucide-react';

interface UserVerificationGuideProps {
  onClose: () => void;
}

/**
 * User Verification Guide Component
 * Provides comprehensive documentation for user verification features
 */
const UserVerificationGuide: React.FC<UserVerificationGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Super Admin User Management Guide
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete guide for managing users with the simplified 3-status system
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* NEW: Status System Overview */}
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300">
                📋 Simplified Status System
              </h3>
            </div>
            
            <div className="space-y-4 text-blue-800 dark:text-blue-300">
              <p className="font-medium">
                ✨ The system now uses only 3 clear status types for better management:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm">New users awaiting verification. Cannot access system features.</p>
                </div>
                
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Verified
                    </span>
                  </div>
                  <p className="text-sm">Active users with full access to system features.</p>
                </div>
                
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Deactivated
                    </span>
                  </div>
                  <p className="text-sm">Blocked users who cannot access the system.</p>
                </div>
              </div>
            </div>
          </section>

          {/* NEW: Bulk Actions Section */}
          <section className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-300">
                🔥 Bulk Actions (NEW!)
              </h3>
            </div>
            
            <div className="space-y-4 text-purple-800 dark:text-purple-300">
              <p className="font-medium">
                🚀 New bulk functionality for efficient user management:
              </p>
              
              <div className="space-y-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">✅ Select Multiple Users:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Use the checkbox in the table header to select all visible users</li>
                    <li>Use individual checkboxes to select specific users</li>
                    <li>Selected users are highlighted with a blue background</li>
                    <li>Selected count is shown in the top-right corner</li>
                  </ul>
                </div>
                
                <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🗑️ Bulk Delete:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Select users and click "Delete Selected" button</li>
                    <li>Confirmation dialog shows number of users to be deleted</li>
                    <li><strong>⚠️ Warning:</strong> This action is permanent and cannot be undone</li>
                    <li>Use for removing spam accounts or test users</li>
                  </ul>
                </div>
                
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">🚨 Safety Guidelines:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
                    <li>Always double-check selections before bulk deletion</li>
                    <li>Consider deactivating users instead of deleting them</li>
                    <li>Keep backups of important user data</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Updated Individual Actions */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Individual User Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Verify Pending Users */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Verify User</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Change status from "Pending" to "Verified" for immediate access
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ✅ Available for: Pending users
                </div>
              </div>

              {/* Deactivate Users */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <X className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Deactivate User</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Block user access by changing status to "Deactivated"
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  🔶 Available for: Verified users
                </div>
              </div>

              {/* Reactivate Users */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Reactivate User</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Restore access by changing status from "Deactivated" to "Verified"
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  🔴 Available for: Deactivated users
                </div>
              </div>

              {/* Sync Status */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Sync Status</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Sync verification status between Appwrite Auth and database
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  🔄 Available for: All users
                </div>
              </div>
            </div>
          </section>

          {/* User Management Workflow */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📋 User Management Workflow
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">🔄 Standard User Lifecycle:</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-xs font-medium">
                    Pending
                  </span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                    Verified
                  </span>
                  <span>→ (if needed) →</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs font-medium">
                    Deactivated
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">✅ When to Verify:</h4>
                  <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                    <li>• Legitimate new registrations</li>
                    <li>• Users who completed email verification</li>
                    <li>• Shop managers after approval process</li>
                    <li>• Known users with technical issues</li>
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">🚫 When to Deactivate:</h4>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    <li>• Suspicious account activity</li>
                    <li>• Policy violations</li>
                    <li>• User requests account suspension</li>
                    <li>• Security concerns</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* SMTP Configuration - Still Important */}
          <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xl font-semibold text-amber-800 dark:text-amber-300">
                📧 Email Configuration (Optional)
              </h3>
            </div>
            
            <div className="space-y-4 text-amber-800 dark:text-amber-300">
              <p className="font-medium">
                ⚠️ If you want automatic email verification, configure SMTP in Appwrite:
              </p>
              
              <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Quick SMTP Setup Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to your <strong>Appwrite Console</strong></li>
                  <li>Navigate to <strong>Settings → SMTP</strong></li>
                  <li>Configure your email provider (Gmail, SendGrid, etc.)</li>
                  <li>Test the SMTP connection</li>
                  <li>Save the configuration</li>
                </ol>
              </div>

              <button
                onClick={() => {
                  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT?.replace('/v1', '') || 'https://cloud.appwrite.io';
                  window.open(`${endpoint}/console/project-${import.meta.env.VITE_APPWRITE_PROJECT_ID}/settings/smtp`, '_blank');
                }}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Appwrite SMTP Settings
              </button>
            </div>
          </section>

          {/* Best Practices - Updated */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              💡 Best Practices
            </h3>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                  <span><strong>Use search and filters</strong> to efficiently find specific users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                  <span><strong>Verify identity</strong> before manually approving accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                  <span><strong>Use deactivation</strong> instead of deletion for reversible actions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                  <span><strong>Bulk actions</strong> are ideal for managing test accounts or spam</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                  <span><strong>Regular monitoring</strong> of pending accounts is recommended</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                  <span><strong>Use sync function</strong> if you notice status inconsistencies</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Quick Reference Card */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🎯 Quick Reference Card
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">🔍 Navigation:</h4>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Search box: Find users by name/email</li>
                    <li>• Checkboxes: Select for bulk actions</li>
                    <li>• Icons: Quick action buttons</li>
                    <li>• Status badges: Current user state</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⚡ Quick Actions:</h4>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• ✅ = Verify pending user</li>
                    <li>• ❌ = Deactivate user</li>
                    <li>• 👤 = Reactivate user</li>
                    <li>• 🔄 = Sync status</li>
                    <li>• ✏️ = Edit user details</li>
                    <li>• 🗑️ = Delete user</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserVerificationGuide; 