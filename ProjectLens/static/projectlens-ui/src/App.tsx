import { useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SettingsPage from './pages/SettingsPage';

type Page = { name: 'dashboard' } | { name: 'detail'; projectKey: string } | { name: 'settings' };

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'dashboard' });

  if (page.name === 'detail') {
    return <ProjectDetailPage projectKey={page.projectKey} onBack={() => setPage({ name: 'dashboard' })} />;
  }
  if (page.name === 'settings') {
    return <SettingsPage onBack={() => setPage({ name: 'dashboard' })} />;
  }
  return (
    <DashboardPage
      onProjectClick={(key) => setPage({ name: 'detail', projectKey: key })}
      onSettingsClick={() => setPage({ name: 'settings' })}
    />
  );
}
