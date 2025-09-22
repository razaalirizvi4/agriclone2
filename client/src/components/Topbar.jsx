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
        <div style={{ marginRight: '10px' }}>Logo</div>
        {/* Hamburger Icon (conditional) */}
        {hasSidebar && (
          <button onClick={toggleSidebar}>
            {isSidebarOpen ? 'Close' : 'Open'}
          </button>
        )}
      </div>

      {/* Center Section (empty for now) */}
      <div style={{ flexGrow: 1, textAlign: 'center' }}></div>

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
