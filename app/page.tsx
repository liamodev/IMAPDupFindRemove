'use client';

import { useState } from 'react';
import IMAPForm from '@/components/IMAPForm';
import CrossMailboxForm from '@/components/CrossMailboxForm';
import DuplicateList from '@/components/DuplicateList';

type TabType = 'single' | 'cross';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('single');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleScanComplete = () => {
    setMessage('Mailbox scan completed successfully! Check the duplicates tab below.');
    setMessageType('success');
  };

  const handleError = (error: string) => {
    setMessage(error);
    setMessageType('error');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            IMAP Duplicate Email Finder
          </h1>
          <p className="text-lg text-gray-600">
            Scan your IMAP mailboxes for duplicate emails and manage them efficiently
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('single')}
                className={`flex-1 px-6 py-4 text-center font-medium ${
                  activeTab === 'single'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Single Mailbox Scan
              </button>
              <button
                onClick={() => setActiveTab('cross')}
                className={`flex-1 px-6 py-4 text-center font-medium ${
                  activeTab === 'cross'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cross-Mailbox Comparison
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'single' ? (
              <IMAPForm onScanComplete={handleScanComplete} />
            ) : (
              <CrossMailboxForm onSuccess={handleScanComplete} onError={handleError} />
            )}
          </div>
        </div>

        <div className="mt-8">
          <DuplicateList />
        </div>
      </div>
    </div>
  );
}
