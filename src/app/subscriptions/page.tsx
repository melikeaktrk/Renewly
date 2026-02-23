'use client';

import api from '@/lib/api';
import { Category, Subscription } from '@/types';
import { FormEvent, useEffect, useState } from 'react';

const initialForm = {
  name: '',
  planName: '',
  amount: '',
  currency: 'USD',
  billingCycle: 'MONTHLY',
  startDate: '',
  nextBillingDate: '',
  autoRenew: true,
  reminderDaysBefore: '3',
  categoryId: ''
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPageData = async () => {
    setLoading(true);
    setError('');

    try {
      const [subscriptionsResponse, categoriesResponse] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/categories')
      ]);

      setSubscriptions(subscriptionsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (err) {
      setError('Failed to load subscriptions data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/subscriptions', {
        ...formData,
        amount: Number(formData.amount),
        reminderDaysBefore: Number(formData.reminderDaysBefore)
      });

      setFormData(initialForm);
      await fetchPageData();
    } catch (err) {
      setError('Failed to create subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Subscriptions</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Create Subscription</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'planName', label: 'Plan Name', type: 'text' },
            { key: 'amount', label: 'Amount', type: 'number' },
            { key: 'currency', label: 'Currency', type: 'text' },
            { key: 'billingCycle', label: 'Billing Cycle', type: 'text' },
            { key: 'startDate', label: 'Start Date', type: 'date' },
            { key: 'nextBillingDate', label: 'Next Billing Date', type: 'date' },
            { key: 'reminderDaysBefore', label: 'Reminder Days Before', type: 'number' }
          ].map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium">{field.label}</label>
              <input
                required
                type={field.type}
                value={formData[field.key as keyof typeof formData] as string}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    [field.key]: event.target.value
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              required
              value={formData.categoryId}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  categoryId: event.target.value
                }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.autoRenew}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    autoRenew: event.target.checked
                  }))
                }
              />
              Auto Renew
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Create'}
        </button>
      </form>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <p className="p-6">Loading...</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Billing Cycle</th>
                <th className="px-4 py-3">Next Billing</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{subscription.name}</td>
                  <td className="px-4 py-3">{subscription.planName}</td>
                  <td className="px-4 py-3">
                    {subscription.amount} {subscription.currency}
                  </td>
                  <td className="px-4 py-3">{subscription.billingCycle}</td>
                  <td className="px-4 py-3">{new Date(subscription.nextBillingDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{subscription.status}</td>
                </tr>
              ))}
              {!subscriptions.length && (
                <tr>
                  <td className="px-4 py-3 text-slate-500" colSpan={6}>
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
