'use client';

import { useState } from 'react';
import { Folder, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface FolderStructure {
  name: string;
  emailCount: number;
  path: string;
}

interface FolderStructureDisplayProps {
  isVisible: boolean;
  folderStructure?: FolderStructure[];
  onProceed: () => void;
  onBack: () => void;
}

export default function FolderStructureDisplay({ 
  isVisible, 
  folderStructure = [], 
  onProceed, 
  onBack 
}: FolderStructureDisplayProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  if (!isVisible) return null;

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  // Add null checking for folderStructure
  const safeFolderStructure = folderStructure || [];
  const totalEmails = safeFolderStructure.reduce((sum, folder) => sum + folder.emailCount, 0);
  const totalFolders = safeFolderStructure.length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Folder className="w-6 h-6 text-blue-500" />
            Folder Structure Found
          </h2>
          <p className="text-gray-600 mt-1">
            Found {totalFolders} folders with {totalEmails.toLocaleString()} total emails
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onProceed}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Proceed with Scan
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{totalFolders}</div>
            <div className="text-sm text-gray-600">Total Folders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{totalEmails.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Emails</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {totalFolders > 0 ? Math.round(totalEmails / totalFolders) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Emails/Folder</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {safeFolderStructure.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No folders found or unable to access mailbox structure.</p>
            <p className="text-sm mt-2">Please check your IMAP credentials and try again.</p>
          </div>
        ) : (
          safeFolderStructure.map((folder) => (
            <div
              key={folder.path}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">{folder.name}</div>
                    <div className="text-sm text-gray-500">{folder.path}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-700">
                    {folder.emailCount.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">emails</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {safeFolderStructure.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Ready to Scan</h3>
              <p className="text-sm text-blue-700 mt-1">
                The folder structure looks good! Click "Proceed with Scan" to start scanning for duplicate emails.
                This will process all {totalEmails.toLocaleString()} emails across {totalFolders} folders.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
