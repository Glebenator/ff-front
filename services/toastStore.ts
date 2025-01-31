// services/toastStore.ts
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type ToastCallback = (toast: Toast | null) => void;

class ToastStore {
  private subscribers: ToastCallback[] = [];
  private currentToast: Toast | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  subscribe(callback: ToastCallback) {
    this.subscribers.push(callback);
    callback(this.currentToast);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach(callback => callback(this.currentToast));
  }

  show(message: string, type: ToastType = 'info') {
    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Create new toast
    this.currentToast = {
      id: Math.random().toString(36).substring(7),
      message,
      type
    };
    this.notify();

    // Auto dismiss after 2 seconds
    this.timeoutId = setTimeout(() => {
      this.currentToast = null;
      this.notify();
      this.timeoutId = null;
    }, 2000);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }
}

export const toastStore = new ToastStore();