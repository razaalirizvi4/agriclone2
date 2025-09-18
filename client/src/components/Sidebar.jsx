const Sidebar = ({ isOpen }) => {
  return (
    <aside style={{
      width: '250px',
      position: 'fixed',
      top: '60px', // Adjust based on topbar height
      zIndex: 999,
      left: isOpen ? '0' : '-250px',
      height: 'calc(100vh - 60px)',
      backgroundColor: '#e0e0e0',
      padding: '0',
      transition: 'left 0.3s'
    }}>
      <nav style={{ padding: '20px' }}>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          {/* Add other navigation links here */}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
