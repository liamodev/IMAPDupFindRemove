'use client';

import { useState } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';

interface CrossMailboxFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export default function CrossMailboxForm({ onSuccess, onError, setIsLoading }: CrossMailboxFormProps) {
  const [formData, setFormData] = useState({
    mailbox1: {
      host: '',
      port: '993',
      user: '',
      password: '',
      secure: true,
      mailboxId: ''
    },
    mailbox2: {
      host: '',
      port: '993',
      user: '',
      password: '',
      secure: true,
      mailboxId: ''
    }
  });
  const [showPasswords, setShowPasswords] = useState({ mailbox1: false, mailbox2: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First scan mailbox 1
      const response1 = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData.mailbox1),
      });

      if (!response1.ok) {
        const data1 = await response1.json();
        throw new Error(`Mailbox 1: ${data1.error || 'Failed to scan mailbox'}`);
      }

      // Then scan mailbox 2
      const response2 = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData.mailbox2),
      });

      if (!response2.ok) {
        const data2 = await response2.json();
        throw new Error(`Mailbox 2: ${data2.error || 'Failed to scan mailbox'}`);
      }

      onSuccess('Both mailboxes scanned successfully. Check the duplicates list below.');
      
      // Reset form
      setFormData({
        mailbox1: {
          host: '',
          port: '993',
          user: '',
          password: '',
          secure: true,
          mailboxId: ''
        },
        mailbox2: {
          host: '',
          port: '993',
          user: '',
          password: '',
          secure: true,
          mailboxId: ''
        }
      });

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to scan mailboxes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (mailbox: 'mailbox1' | 'mailbox2', field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [mailbox]: {
        ...prev[mailbox],
        [field]: value
      }
    }));
  };

  const MailboxForm = ({ mailbox, title }: { mailbox: 'mailbox1' | 'mailbox2'; title: string }) => (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            IMAP Host
          </label>
          <input
            type="text"
            value={formData[mailbox].host}
            onChange={(e) => handleChange(mailbox, 'host', e.target.value)}
            placeholder="e.g., imap.gmail.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Port
          </label>
          <input
            type="number"
            value={formData[mailbox].port}
            onChange={(e) => handleChange(mailbox, 'port', e.target.value)}
            placeholder="993"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username/Email
          </label>
          <input
            type="email"
            value={formData[mailbox].user}
            onChange={(e) => handleChange(mailbox, 'user', e.target.value)}
            placeholder="your-email@gmail.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPasswords[mailbox] ? 'text' : 'password'}
              value={formData[mailbox].password}
              onChange={(e) => handleChange(mailbox, 'password', e.target.value)}
              placeholder="Your password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, [mailbox]: !prev[mailbox] }))}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords[mailbox] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Friendly Mailbox Name
          </label>
          <input
            type="text"
            value={formData[mailbox].mailboxId}
            onChange={(e) => handleChange(mailbox, 'mailboxId', e.target.value)}
            placeholder="e.g., My Gmail Account, Work Outlook"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secure Connection
          </label>
          <select
            value={formData[mailbox].secure.toString()}
            onChange={(e) => handleChange(mailbox, 'secure', e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">Yes (SSL/TLS)</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MailboxForm mailbox="mailbox1" title="Mailbox 1" />
        <MailboxForm mailbox="mailbox2" title="Mailbox 2" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Search className="w-4 h-4" />
          Compare Mailboxes
        </button>
      </div>
    </form>
  );
}
