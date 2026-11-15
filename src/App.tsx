/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EcoTrackProvider, useEcoTrack } from './context/EcoTrackContext';
import { canAccessRoute } from './services/apiClient';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WasteDataPage } from './pages/WasteDataPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { EducationPage } from './pages/EducationPage';
import { EventsPage } from './pages/EventsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

const EcoTrackRouter: React.FC = () => {
  const { currentUser, activeRoute } = useEcoTrack();

  if (!currentUser) {
    return <LoginPage />;
  }

  const safeRoute = canAccessRoute(currentUser, activeRoute) ? activeRoute : 'dashboard';

  const renderPage = () => {
    switch (safeRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'waste-data':
        return <WasteDataPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'processing':
        return <ProcessingPage />;
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UsersPage />;
      case 'education':
        return <EducationPage />;
      case 'events':
        return <EventsPage />;
      case 'profile':
        return <ProfileSettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <AppShell>{renderPage()}</AppShell>;
};

export default function App() {
  return (
    <EcoTrackProvider>
      <EcoTrackRouter />
    </EcoTrackProvider>
  );
}
