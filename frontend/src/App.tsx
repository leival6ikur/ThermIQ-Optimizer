import React from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  const [currentPage, setCurrentPage] = React.useState<'dashboard' | 'settings'>('dashboard');

  // Simple routing based on hash or pathname
  React.useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      if (path.includes('settings')) {
        setCurrentPage('settings');
      } else {
        setCurrentPage('dashboard');
      }
    };

    handleNavigation();
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Override link navigation
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const href = target.getAttribute('href') || target.closest('a')?.getAttribute('href');

      if (href === '/' || href === '/settings') {
        e.preventDefault();
        window.history.pushState({}, '', href);
        setCurrentPage(href === '/settings' ? 'settings' : 'dashboard');
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return currentPage === 'settings' ? <SettingsPage /> : <DashboardPage />;
}

export default App;
