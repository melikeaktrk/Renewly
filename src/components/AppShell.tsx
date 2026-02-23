'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const publicRoutes = ['/login', '/register'];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (isPublicRoute) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
    }
  }, [isPublicRoute, router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  return (
    <div className="min-h-screen">
      {!isPublicRoute && (
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/dashboard" className="text-slate-700 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/subscriptions" className="text-slate-700 hover:text-slate-900">
                Subscriptions
              </Link>
              <Link href="/categories" className="text-slate-700 hover:text-slate-900">
                Categories
              </Link>
              <Link href="/notifications" className="text-slate-700 hover:text-slate-900">
                Notifications
              </Link>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </nav>
      )}
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
