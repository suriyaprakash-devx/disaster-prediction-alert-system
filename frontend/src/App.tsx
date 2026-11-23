import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { AgentsPage } from './pages/AgentsPage';
import { VisualSearchPage } from './pages/VisualSearchPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="visual-search" element={<VisualSearchPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
