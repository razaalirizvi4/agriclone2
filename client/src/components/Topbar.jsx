import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

const Topbar = ({ isSidebarOpen, toggleSidebar, hasSidebar, isLoggedIn }) => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
    window.location.reload(); // Reload to update Topbar/Sidebar state
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#f0f0f0',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #ccc'
    }}>
      {/* Left Section: Logo + Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Logo */}
        <div style={{ marginRight: '20px' }}>Logo</div>
      </div>

      {/* Center Section: Navigation */}
      <nav style={{ flexGrow: 1 }}>
        <ul style={{ display: 'flex', justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
          <li style={{ margin: '0 15px' }}><a href="/">Home</a></li>
          <li style={{ margin: '0 15px' }}><a href="/about">About</a></li>
          <li style={{ margin: '0 15px' }}><a href="/event-stream">Event Stream</a></li>
          <li style={{ margin: '0 15px' }}><a href="/locations">Locations</a></li>
        </ul>
      </nav>

      {/* Right Section (conditional based on login status) */}
      {isLoggedIn && currentUser ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* User Icon */}
          <div style={{ marginRight: '10px' }}>User Icon</div>
          {/* User Name */}
          <div style={{ marginRight: '10px' }}>{currentUser.name}</div>
          {/* Logout Button */}
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        null
      )}
    </header>
  );
};

export default Topbar;
