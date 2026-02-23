'use client';

import api from '@/lib/api';
import { DashboardSummary, Subscription } from '@/types';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [upcoming, setUpcoming] = useState<Subscription[]>([]);
  const [topExpensive, setTopExpensive] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [summaryResponse, upcomingResponse, topExpensiveResponse] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/upcoming?days=7'),
          api.get('/dashboard/top-expensive?limit=5')
        ]);

        setSummary(summaryResponse.data);
        setUpcoming(upcomingResponse.data);
        setTopExpensive(topExpensiveResponse.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Monthly Total</p>
          <p className="mt-2 text-3xl font-semibold">${summary?.monthlyTotal ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Yearly Total</p>
          <p className="mt-2 text-3xl font-semibold">${summary?.yearlyTotal ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Upcoming Renewals</h2>
          <ul className="space-y-2 text-sm">
            {upcoming.map((item) => (
              <li key={item.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-slate-600">{new Date(item.nextBillingDate).toLocaleDateString()}</p>
              </li>
            ))}
            {!upcoming.length && <li className="text-slate-500">No upcoming renewals.</li>}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Top Expensive</h2>
          <ul className="space-y-2 text-sm">
            {topExpensive.map((item) => (
              <li key={item.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-slate-600">
                  {item.amount} {item.currency}
                </p>
              </li>
            ))}
            {!topExpensive.length && <li className="text-slate-500">No records found.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
