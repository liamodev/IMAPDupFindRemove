'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Folder, Mail, Database, Loader2 } from 'lucide-react';

interface ProgressUpdate {
  type: 'connecting' | 'folders' | 'scanning' | 'processing' | 'saving' | 'complete' | 'error';
  message: string;
  current?: number;
  total?: number;
  folder?: string;
  percentage?: number;
}

interface ProgressDisplayProps {
  isVisible: boolean;
  progress?: ProgressUpdate | null;
}

export default function ProgressDisplay({ isVisible, progress }: ProgressDisplayProps) {
  const [history, setHistory] = useState<ProgressUpdate[]>([]);

  useEffect(() => {
    if (!isVisible) {
      setHistory([]);
    }
  }, [isVisible]);

  // Add progress to history when it changes
  useEffect(() => {
    if (progress) {
      setHistory(prev => [...prev, progress]);
    }
  }, [progress]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'folders':
        return <Folder className="w-4 h-4" />;
      case 'scanning':
        return <Mail className="w-4 h-4" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'saving':
        return <Database className="w-4 h-4" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  const getProgressBar = () => {
    if (!progress?.percentage && progress?.current && progress?.total) {
      const percentage = Math.round((progress.current / progress.total) * 100);
      return percentage;
    }
    return progress?.percentage || 0;
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        Scanning Mailbox
      </h3>

      {progress && (
        <div className="space-y-4">
          {/* Current Progress */}
          <div className="flex items-center gap-3">
            {getIcon(progress.type)}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{progress.message}</p>
              {progress.folder && (
                <p className="text-xs text-gray-500">Folder: {progress.folder}</p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(progress.percentage || (progress.current && progress.total)) && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressBar()}%` }}
              ></div>
            </div>
          )}

          {/* Progress Text */}
          {progress.current && progress.total && (
            <p className="text-sm text-gray-600">
              {progress.current} of {progress.total} ({getProgressBar()}%)
            </p>
          )}
        </div>
      )}

      {/* Progress History */}
      {history.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Progress History</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {history.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {getIcon(item.type)}
                <span className="text-gray-600">{item.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
