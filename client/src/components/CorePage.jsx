import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import authService from '../services/auth.service';

function CorePage() {
  const location = useLocation();
  const hasSidebar = location.pathname !== '/login' && location.pathname !== '/register';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [location]); // Re-check login status on route change

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      <Topbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} hasSidebar={hasSidebar} isLoggedIn={isLoggedIn} />
      <div style={{ display: 'flex' }}>
        {hasSidebar && <Sidebar isOpen={isSidebarOpen} />}
        <main style={{ flexGrow: 1, marginLeft: hasSidebar && isSidebarOpen ? '250px' : '0', transition: 'margin-left 0.3s' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default CorePage;
