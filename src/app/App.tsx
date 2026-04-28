import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { IssuesView } from './components/IssuesView';
import { SearchView } from './components/SearchView';
import { BriefingsView } from './components/BriefingsView';
import { AlertsView } from './components/AlertsView';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';
import { PeersView } from './components/PeersView';
import { RawArticlesView } from './components/RawArticlesView';

export type UserRole = 'admin' | 'strategist' | 'analyst' | 'viewer';

const readCurrentUserRole = (): UserRole => {
  const storedRole = window.localStorage.getItem('axis:userRole');
  return storedRole === 'admin' || storedRole === 'strategist' || storedRole === 'analyst' || storedRole === 'viewer'
    ? storedRole
    : 'strategist';
};

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentUserRole] = useState<UserRole>(readCurrentUserRole);

  const isAdmin = currentUserRole === 'admin';

  const handleViewChange = (view: string) => {
    setActiveView(view === 'admin' && !isAdmin ? 'dashboard' : view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview onNavigate={handleViewChange} />;
      case 'issues':
        return <IssuesView onNavigate={handleViewChange} />;
      case 'peers':
        return <PeersView onNavigate={handleViewChange} />;
      case 'search':
        return <SearchView />;
      case 'briefings':
        return <BriefingsView onNavigate={handleViewChange} />;
      case 'alerts':
        return <AlertsView />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return isAdmin ? <AdminView /> : <DashboardOverview onNavigate={handleViewChange} />;
      case 'rawArticles':
        return <RawArticlesView />;
      default:
        return <DashboardOverview onNavigate={handleViewChange} />;
    }
  };

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-neutral-50 md:flex-row">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} currentUserRole={currentUserRole} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">{renderView()}</main>
    </div>
  );
}
