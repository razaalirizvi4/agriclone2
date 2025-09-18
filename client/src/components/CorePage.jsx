import { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

function CorePage() {
  const location = useLocation();
  const hasSidebar = location.pathname !== '/login';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      <Topbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} hasSidebar={hasSidebar} />
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
