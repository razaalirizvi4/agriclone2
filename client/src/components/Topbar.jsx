const Topbar = ({ isSidebarOpen, toggleSidebar, hasSidebar }) => {
  const isLoggedIn = true; // TODO: Replace with actual authentication state

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
      {isLoggedIn ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* User Icon */}
          <div style={{ marginRight: '10px' }}>User Icon</div>
          {/* User Name */}
          <div style={{ marginRight: '10px' }}>User Name</div>
          {/* Logout Button */}
          <button>Logout</button>
        </div>
      ) : (
        null
      )}
    </header>
  );
};

export default Topbar;
