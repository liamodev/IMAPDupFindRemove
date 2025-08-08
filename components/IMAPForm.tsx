'use client';

import { useState } from 'react';
import { Mail, Eye, EyeOff } from 'lucide-react';

interface IMAPFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export default function IMAPForm({ onSuccess, onError, setIsLoading }: IMAPFormProps) {
  const [formData, setFormData] = useState({
    host: '',
    port: '993',
    user: '',
    password: '',
    secure: true,
    mailboxId: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.message);
        setFormData({
          host: '',
          port: '993',
          user: '',
          password: '',
          secure: true,
          mailboxId: ''
        });
      } else {
        onError(data.error || 'Failed to scan mailbox');
      }
    } catch (error) {
      onError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">
            IMAP Host
          </label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleChange}
            placeholder="e.g., imap.gmail.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
            Port
          </label>
          <input
            type="number"
            id="port"
            name="port"
            value={formData.port}
            onChange={handleChange}
            placeholder="993"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
            Username/Email
          </label>
          <input
            type="email"
            id="user"
            name="user"
            value={formData.user}
            onChange={handleChange}
            placeholder="your-email@gmail.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Your password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="mailboxId" className="block text-sm font-medium text-gray-700 mb-1">
            Mailbox ID
          </label>
          <input
            type="text"
            id="mailboxId"
            name="mailboxId"
            value={formData.mailboxId}
            onChange={handleChange}
            placeholder="e.g., gmail-account-1"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="secure" className="block text-sm font-medium text-gray-700 mb-1">
            Secure Connection
          </label>
          <select
            id="secure"
            name="secure"
            value={formData.secure.toString()}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">Yes (SSL/TLS)</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Mail className="w-4 h-4" />
          Scan Mailbox
        </button>
      </div>
    </form>
  );
}
