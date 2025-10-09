import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import authService from '../services/auth.service';

function CorePage() {
  const location = useLocation();
  const hasSidebar = location.pathname !== '/login' && location.pathname !== '/register';
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [location]); // Re-check login status on route change

  return (
    <div>
      <Topbar hasSidebar={hasSidebar} isLoggedIn={isLoggedIn} />
      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default CorePage;
