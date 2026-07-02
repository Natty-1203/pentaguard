import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/src/lib/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export default function DashboardLayout() {
  const { user } = useAuth();

  if (user?.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
