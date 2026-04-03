import React from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { InsightsPage } from './pages/InsightsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [currentPage, setCurrentPage] = React.useState<'dashboard' | 'settings' | 'insights' | 'alerts'>('dashboard');

  // Simple routing based on hash or pathname
  React.useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      if (path.includes('settings')) {
        setCurrentPage('settings');
      } else if (path.includes('insights')) {
        setCurrentPage('insights');
      } else if (path.includes('alerts')) {
        setCurrentPage('alerts');
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

      if (href === '/' || href === '/settings' || href === '/insights' || href === '/alerts') {
        e.preventDefault();
        window.history.pushState({}, '', href);
        if (href === '/settings') {
          setCurrentPage('settings');
        } else if (href === '/insights') {
          setCurrentPage('insights');
        } else if (href === '/alerts') {
          setCurrentPage('alerts');
        } else {
          setCurrentPage('dashboard');
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <ThemeProvider>
      {currentPage === 'settings' && <SettingsPage />}
      {currentPage === 'insights' && <InsightsPage />}
      {currentPage === 'alerts' && <AlertsPage />}
      {currentPage === 'dashboard' && <DashboardPage />}
    </ThemeProvider>
  );
}

export default App;
