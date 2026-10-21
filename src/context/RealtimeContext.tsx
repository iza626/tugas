import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { RealtimeToast } from '../types';
import { subscribeLocalEvents } from '../services/api';

interface RealtimeContextType {
  isConnected: boolean;
  toasts: RealtimeToast[];
  addToast: (toast: Omit<RealtimeToast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  lastEvent: { type: string; payload: any } | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [toasts, setToasts] = useState<RealtimeToast[]>([]);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);

  const addToast = useCallback((toast: Omit<RealtimeToast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: RealtimeToast = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: any = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/realtime/events');

      eventSource.addEventListener('CONNECTED', (e: MessageEvent) => {
        setIsConnected(true);
      });

      eventSource.addEventListener('MANIFEST_CERTIFIED', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setLastEvent({ type: 'MANIFEST_CERTIFIED', payload: data });
          addToast({
            type: 'success',
            title: 'Manifest Kapal Disahkan!',
            message: data.message || `Manifest ${data.manifest?.manifest_number} resmi disahkan dengan QR Syahbandar.`,
          });
        } catch (err) {
          // ignore parse error
        }
      });

      const handleGenericEvent = (type: string, title: string) => (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setLastEvent({ type, payload: data });
          if (type.includes('DELETED')) {
            addToast({
              type: 'warning',
              title,
              message: `Data dengan ID [${data.id}] telah dihapus dari database.`,
            });
          } else if (type.includes('CREATED')) {
            addToast({
              type: 'info',
              title,
              message: `Data baru berhasil disimpan secara real-time ke sistem.`,
            });
          }
        } catch (err) {
          // ignore
        }
      };

      eventSource.addEventListener('SHIPS_CREATED', handleGenericEvent('SHIPS_CREATED', 'Data Kapal Ditambahkan'));
      eventSource.addEventListener('SHIPS_UPDATED', handleGenericEvent('SHIPS_UPDATED', 'Data Kapal Diperbarui'));
      eventSource.addEventListener('SHIPS_DELETED', handleGenericEvent('SHIPS_DELETED', 'Data Kapal Dihapus'));

      eventSource.addEventListener('VOYAGES_CREATED', handleGenericEvent('VOYAGES_CREATED', 'Perjalanan Kapal Baru'));
      eventSource.addEventListener('VOYAGES_UPDATED', handleGenericEvent('VOYAGES_UPDATED', 'Status Perjalanan Diperbarui'));

      eventSource.addEventListener('CARGO_TRANSACTIONS_CREATED', handleGenericEvent('CARGO_TRANSACTIONS_CREATED', 'Muatan Baru Tercatat'));
      eventSource.addEventListener('CARGO_TRANSACTIONS_UPDATED', handleGenericEvent('CARGO_TRANSACTIONS_UPDATED', 'Status Muatan Diperbarui'));

      eventSource.addEventListener('PASSENGER_TRANSACTIONS_CREATED', handleGenericEvent('PASSENGER_TRANSACTIONS_CREATED', 'Tiket Penumpang Terbit'));

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        // retry in 4 seconds
        retryTimeout = setTimeout(connectSSE, 4000);
      };
    };

    connectSSE();

    const unsubscribeLocal = subscribeLocalEvents((type, payload) => {
      setLastEvent({ type, payload });
      setIsConnected(true);
      if (type.includes('CREATED')) {
        addToast({ type: 'info', title: 'Data Diperbarui', message: 'Data baru tersinkronisasi antar tab.' });
      } else if (type === 'MANIFEST_CERTIFIED') {
        addToast({ type: 'success', title: 'Manifest Disahkan!', message: 'Dokumen manifest resmi disahkan.' });
      }
    });

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
      unsubscribeLocal();
    };
  }, [addToast]);

  return (
    <RealtimeContext.Provider value={{ isConnected, toasts, addToast, removeToast, lastEvent }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};
