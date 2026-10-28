import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { RealtimeToast } from '../types';
import { subscribeLocalEvents } from '../services/api';

interface RealtimeEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

interface RealtimeContextType {
  isConnected: boolean;
  toasts: RealtimeToast[];
  lastEvent: RealtimeEvent | null;
  addToast: (toast: Omit<RealtimeToast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [toasts, setToasts] = useState<RealtimeToast[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const addToast = useCallback((toast: Omit<RealtimeToast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: RealtimeToast = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for broadcast events from Firestore real-time listeners & local changes
  useEffect(() => {
    const unsubscribe = subscribeLocalEvents((eventName, payload) => {
      setLastEvent({
        type: eventName,
        payload,
        timestamp: Date.now(),
      });
      setIsConnected(true);

      // Trigger user-friendly real-time notification
      if (eventName === 'SHIPS_CREATED' || eventName === 'SHIPS_UPDATED') {
        addToast({
          type: 'info',
          title: 'Update Data Kapal Real-time',
          message: `${payload?.name || 'Kapal'} telah diperbarui dalam database.`,
        });
      } else if (eventName === 'VOYAGES_UPDATED' || eventName === 'VOYAGES_CREATED') {
        addToast({
          type: 'info',
          title: 'Perjalanan Kapal Diperbarui',
          message: `Status pelayaran ${payload?.voyage_number || ''} (${payload?.status || ''}) disinkronkan.`,
        });
      } else if (eventName === 'MANIFEST_CERTIFIED') {
        addToast({
          type: 'success',
          title: 'Manifest Disahkan Syahbandar',
          message: `Manifest ${payload?.manifest?.manifest_number || ''} telah divalidasi dengan QR code resmi.`,
        });
      } else if (eventName === 'PASSENGERS_CREATED' || eventName === 'PASSENGERS_UPDATED') {
        addToast({
          type: 'info',
          title: 'Data Penumpang Diperbarui',
          message: `${payload?.full_name || 'Penumpang'} berhasil dicatat.`,
        });
      } else if (eventName === 'CARGO_CREATED' || eventName === 'CARGO_UPDATED') {
        addToast({
          type: 'info',
          title: 'Transaksi Muatan Kargo',
          message: `Muatan ${payload?.item_name || 'Kargo'} berhasil dicatat ke sistem.`,
        });
      }
    });

    // Also attempt SSE stream if server is running full-stack
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/events');
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          setLastEvent({
            type: parsed.event || 'UPDATE',
            payload: parsed.data,
            timestamp: Date.now(),
          });
        } catch (err) {
          // ignore
        }
      };
      eventSource.onerror = () => {
        // Fall back to broadcast / Firestore without UI breakage
        setIsConnected(true);
      };
    } catch (e) {
      setIsConnected(true);
    }

    return () => {
      unsubscribe();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [addToast]);

  return (
    <RealtimeContext.Provider value={{ isConnected, toasts, lastEvent, addToast, removeToast }}>
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
