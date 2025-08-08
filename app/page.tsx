'use client';

import { useState } from 'react';
import { Mail, Search, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import IMAPForm from '@/components/IMAPForm';
import DuplicateList from '@/components/DuplicateList';
import CrossMailboxForm from '@/components/CrossMailboxForm';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'single' | 'cross'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            IMAP Duplicate Finder & Remover
          </h1>
          <p className="text-gray-600">
            Find and remove duplicate emails across IMAP mailboxes
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-2 px-4 py-2 font-medium ${
                activeTab === 'single'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-4 h-4" />
              Single Mailbox
            </button>
            <button
              onClick={() => setActiveTab('cross')}
              className={`flex items-center gap-2 px-4 py-2 font-medium ${
                activeTab === 'cross'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="w-4 h-4" />
              Cross-Mailbox Comparison
            </button>
          </div>

          {activeTab === 'single' ? (
            <IMAPForm 
              onSuccess={(message) => showMessage('success', message)}
              onError={(message) => showMessage('error', message)}
              setIsLoading={setIsLoading}
            />
          ) : (
            <CrossMailboxForm 
              onSuccess={(message) => showMessage('success', message)}
              onError={(message) => showMessage('error', message)}
              setIsLoading={setIsLoading}
            />
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Processing...</span>
          </div>
        )}

        <DuplicateList />
      </div>
    </div>
  );
}
