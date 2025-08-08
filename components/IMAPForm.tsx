'use client';

import { useState, useEffect } from 'react';
import { Mail, Search, AlertCircle } from 'lucide-react';
import ProgressDisplay from './ProgressDisplay';
import FolderStructureDisplay from './FolderStructureDisplay';

interface IMAPFormProps {
  onScanComplete: () => void;
}

interface FolderStructure {
  name: string;
  emailCount: number;
  path: string;
}

export default function IMAPForm({ onScanComplete }: IMAPFormProps) {
  const [formData, setFormData] = useState({
    host: '',
    port: '993',
    user: '',
    password: '',
    secure: true,
    mailboxId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [showFolderStructure, setShowFolderStructure] = useState(false);
  const [folderStructure, setFolderStructure] = useState<FolderStructure[]>([]);
  const [scanStep, setScanStep] = useState<'form' | 'folder-structure' | 'scanning'>('form');

  // Debug: Log when folderStructure changes
  useEffect(() => {
    console.log('FolderStructure state changed:', folderStructure);
    console.log('Length:', folderStructure.length);
  }, [folderStructure]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFolderStructureScan = async () => {
    console.log('=== handleFolderStructureScan called ===');
    console.log('Form data:', formData);
    
    // Check if required fields are present
    if (!formData.host || !formData.port || !formData.user || !formData.password) {
      console.error('Missing required fields:', {
        host: !!formData.host,
        port: !!formData.port,
        user: !!formData.user,
        password: !!formData.password
      });
      setError('Please fill in all required fields');
      return;
    }
    
    const requestData = {
      host: formData.host,
      port: parseInt(formData.port),
      user: formData.user,
      password: formData.password,
      secure: formData.secure
    };
    
    console.log('Sending request data:', requestData);
    
    setIsLoading(true);
    setError('');
    setShowProgress(true);
    setProgress({ type: 'connecting', message: 'Connecting to IMAP server...', percentage: 0 });
    setScanStep('folder-structure');

    try {
      console.log('Starting folder structure scan...');
      const response = await fetch('/api/folder-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to start scan: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to read response');
      }

      console.log('Starting to read SSE stream...');
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('SSE stream ended');
          break;
        }

        const chunk = decoder.decode(value);
        console.log('Received chunk:', chunk);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const rawData = line.slice(6);
              console.log('Raw SSE line:', rawData);
              const data = JSON.parse(rawData);
              console.log('Parsed SSE data:', data);
              setProgress(data);

              if (data.type === 'complete') {
                console.log('COMPLETE DATA RECEIVED:', data);
                console.log('Folder structure:', data.data);
                
                // Only process complete messages that have folder structure data
                if (data.data && Array.isArray(data.data)) {
                  console.log('Processing folder structure data:', data.data);
                  setFolderStructure(data.data);
                  setShowProgress(false);
                  setScanStep('folder-structure');
                  setShowFolderStructure(true);
                  return;
                } else {
                  console.log('Ignoring complete message without folder data');
                }
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
              console.error('Raw line was:', line);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in handleFolderStructureScan:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowProgress(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullScan = async () => {
    setIsLoading(true);
    setError('');
    setShowProgress(true);
    setProgress({ type: 'connecting', message: 'Connecting to IMAP server...', percentage: 0 });
    setScanStep('scanning');

    try {
      const response = await fetch('/api/scan-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to start scan');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to read response');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgress(data);

              if (data.type === 'complete') {
                setShowProgress(false);
                onScanComplete();
                return;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowProgress(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setScanStep('form');
    setShowFolderStructure(false);
    setShowProgress(false);
    setProgress(null);
    setError('');
  };

  if (showFolderStructure) {
    return (
      <FolderStructureDisplay
        isVisible={showFolderStructure}
        folderStructure={folderStructure}
        onProceed={handleFullScan}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-900">IMAP Mailbox Scanner</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {showProgress ? (
        <ProgressDisplay isVisible={showProgress} progress={progress} />
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleFolderStructureScan(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">
                IMAP Host
              </label>
              <input
                type="text"
                id="host"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                placeholder="imap.gmail.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onChange={handleInputChange}
                placeholder="993"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="user"
                name="user"
                value={formData.user}
                onChange={handleInputChange}
                placeholder="your-email@gmail.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password/App Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="your-password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="mailboxId" className="block text-sm font-medium text-gray-700 mb-1">
              Friendly Mailbox Name
            </label>
            <input
              type="text"
              id="mailboxId"
              name="mailboxId"
              value={formData.mailboxId}
              onChange={handleInputChange}
              placeholder="e.g., My Gmail Account"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="secure"
              name="secure"
              checked={formData.secure}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="secure" className="text-sm text-gray-700">
              Use SSL/TLS
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Scanning Folder Structure...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Scan Folder Structure
              </>
            )}
          </button>

          {/* TEST BUTTON - REMOVE AFTER FIXING */}
          <button
            type="button"
            onClick={() => {
              console.log('TEST BUTTON CLICKED');
              handleFolderStructureScan();
            }}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 mt-2"
          >
            TEST BUTTON - Click Me
          </button>
        </form>
      )}
    </div>
  );
}
