'use client';

import api from '@/lib/api';
import { NotificationLog } from '@/types';
import { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (err) {
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {notifications.map((notification) => (
              <li key={notification.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{notification.message}</p>
                <p className="text-slate-600">
                  Scheduled: {new Date(notification.scheduledFor).toLocaleString()}
                </p>
                <p className="text-slate-500">Created: {new Date(notification.createdAt).toLocaleString()}</p>
              </li>
            ))}
            {!notifications.length && <li className="text-slate-500">No notifications found.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}
