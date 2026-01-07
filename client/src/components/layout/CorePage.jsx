import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import authService from "../../services/auth.service";

function CorePage() {
  const location = useLocation();
  const hasSidebar = location.pathname !== '/login' && location.pathname !== '/register';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    setIsSidebarOpen(false);

  }, [location]); // Re-check login status on route change

  return (
    <div>
      <Topbar hasSidebar={hasSidebar} isLoggedIn={isLoggedIn}         
      onAdminToggle={() => setIsSidebarOpen((prev) => !prev)}
 />
       {hasSidebar && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <main style={{ flexGrow: 1, marginLeft: isSidebarOpen ? 260 : 0,
          transition: "margin-left 0.3s ease", }}>
        <Outlet />
      </main>
    </div>
  );
}

export default CorePage;
