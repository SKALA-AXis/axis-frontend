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

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview onNavigate={setActiveView} />;
      case 'issues':
        return <IssuesView onNavigate={setActiveView} />;
      case 'peers':
        return <PeersView onNavigate={setActiveView} />;
      case 'search':
        return <SearchView />;
      case 'briefings':
        return <BriefingsView onNavigate={setActiveView} />;
      case 'alerts':
        return <AlertsView />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return <AdminView />;
      case 'rawArticles':
        return <RawArticlesView />;
      default:
        return <DashboardOverview onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-neutral-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      {renderView()}
    </div>
  );
}
