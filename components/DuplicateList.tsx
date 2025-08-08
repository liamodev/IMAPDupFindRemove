'use client';

import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface DuplicateEmail {
  id: number;
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  folderName: string;
  mailboxId: string;
  uid: number;
  size: number;
  duplicateCount: number;
  duplicates: any[];
}

export default function DuplicateList() {
  const [duplicates, setDuplicates] = useState<DuplicateEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [showDetails, setShowDetails] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/duplicates');
      const data = await response.json();
      
      if (response.ok) {
        setDuplicates(data.duplicates || []);
      } else {
        console.error('Failed to fetch duplicates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleSelectEmail = (emailId: number) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === duplicates.length) {
      setSelectedEmails(new Set());
    } else {
      const allIds = new Set(duplicates.map(d => d.id));
      setSelectedEmails(allIds);
    }
  };

  const handleDeleteSelected = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    if (selectedEmails.size === 0) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: Array.from(selectedEmails)
        }),
      });

      if (response.ok) {
        setSelectedEmails(new Set());
        setDeleteConfirm(false);
        fetchDuplicates(); // Refresh the list
      } else {
        const data = await response.json();
        alert(`Failed to delete emails: ${data.error}`);
      }
    } catch (error) {
      alert('Error deleting emails');
    } finally {
      setDeleting(false);
    }
  };

  const toggleDetails = (emailId: number) => {
    const newShowDetails = new Set(showDetails);
    if (newShowDetails.has(emailId)) {
      newShowDetails.delete(emailId);
    } else {
      newShowDetails.add(emailId);
    }
    setShowDetails(newShowDetails);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading duplicates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Duplicate Emails ({duplicates.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchDuplicates}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {selectedEmails.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleteConfirm ? 'Confirm Delete' : `Delete Selected (${selectedEmails.size})`}
            </button>
          )}
        </div>
      </div>

      {duplicates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p>No duplicate emails found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={selectedEmails.size === duplicates.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({selectedEmails.size} of {duplicates.length})
            </span>
          </div>

          {duplicates.map((duplicate) => (
            <div key={duplicate.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedEmails.has(duplicate.id)}
                  onChange={() => handleSelectEmail(duplicate.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 truncate">
                        {duplicate.subject || '(No Subject)'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        From: {duplicate.from} | To: {duplicate.to}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(duplicate.date)} | {duplicate.folderName} | {formatSize(duplicate.size)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                        {duplicate.duplicateCount} duplicates
                      </span>
                      <button
                        onClick={() => toggleDetails(duplicate.id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {showDetails.has(duplicate.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {showDetails.has(duplicate.id) && (
                    <div className="mt-4 pl-4 border-l-2 border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Duplicate Locations:</h4>
                      <div className="space-y-2">
                        {duplicate.duplicates?.map((dup, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <p><strong>Folder:</strong> {dup.folderName}</p>
                            <p><strong>Mailbox:</strong> {dup.mailboxId}</p>
                            <p><strong>Date:</strong> {formatDate(dup.date)}</p>
                            <p><strong>Size:</strong> {formatSize(dup.size)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to permanently delete {selectedEmails.size} email(s)? 
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
