/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchasing from './pages/Purchasing';

// Placeholder components for other pages
const Finance = () => <div className="p-4"><h1 className="text-2xl font-bold">Finance Module</h1><p>Kas In/Out, Transfer, AR, AP, Giro</p></div>;
const Accounting = () => <div className="p-4"><h1 className="text-2xl font-bold">Accounting Module</h1><p>Journal Entry, Close Book</p></div>;
const Reports = () => <div className="p-4"><h1 className="text-2xl font-bold">Reports Module</h1><p>Sales, Purchase, AR, AP, Inventory, Accounting</p></div>;

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {user ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="purchasing" element={<Purchasing />} />
            <Route path="sales" element={<Sales />} />
            <Route path="finance" element={<Finance />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
