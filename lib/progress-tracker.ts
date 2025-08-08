export interface ProgressUpdate {
  type: 'connecting' | 'folders' | 'scanning' | 'processing' | 'saving' | 'complete' | 'error';
  message: string;
  current?: number;
  total?: number;
  folder?: string;
  percentage?: number;
}

export class ProgressTracker {
  private listeners: ((update: ProgressUpdate) => void)[] = [];

  subscribe(listener: (update: ProgressUpdate) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private emit(update: ProgressUpdate) {
    this.listeners.forEach(listener => listener(update));
  }

  connecting(host: string) {
    this.emit({
      type: 'connecting',
      message: `Connecting to ${host}...`
    });
  }

  foldersFound(count: number) {
    this.emit({
      type: 'folders',
      message: `Found ${count} folders to scan`,
      total: count
    });
  }

  scanningFolder(folder: string, current: number, total: number) {
    const percentage = Math.round((current / total) * 100);
    this.emit({
      type: 'scanning',
      message: `Scanning folder: ${folder}`,
      current,
      total,
      folder,
      percentage
    });
  }

  processingEmails(current: number, total: number) {
    const percentage = Math.round((current / total) * 100);
    this.emit({
      type: 'processing',
      message: `Processing emails (${current}/${total})`,
      current,
      total,
      percentage
    });
  }

  savingEmails(count: number) {
    this.emit({
      type: 'saving',
      message: `Saving ${count} emails to database...`
    });
  }

  complete(totalEmails: number) {
    this.emit({
      type: 'complete',
      message: `Scan complete! Found ${totalEmails} emails.`,
      total: totalEmails
    });
  }

  error(message: string) {
    this.emit({
      type: 'error',
      message
    });
  }
}
