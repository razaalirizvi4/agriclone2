# Frontend Layout Guide

This guide outlines the steps to create a responsive frontend layout with a top bar, a collapsible sticky sidebar, and a main content area for routing.

## Core Components

The layout is managed by the `CorePage.jsx` component, which is rendered directly in `main.jsx`. This component conditionally renders the `Topbar`, `Sidebar`, and the routed page content based on the current route's requirements.

### `main.jsx`

The `main.jsx` file sets up the `BrowserRouter` and defines the main routes, using `CorePage` as the layout component.

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CorePage from './components/CorePage';
import Home from './pages/Home';
import About from './pages/About';
import LoginPage from './pages/LoginPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CorePage />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
```

### `CorePage.jsx`

This component is the heart of the layout. It manages the open/closed state of the sidebar and arranges the `Topbar`, `Sidebar`, and content. It uses `useLocation` to determine if the current route is the login page, and thus, if the sidebar should be present.

```jsx
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
```

### `Topbar.jsx`

The top bar will have a button to toggle the sidebar and its appearance will change based on whether a sidebar is present on the page.

```jsx
const Topbar = ({ isSidebarOpen, toggleSidebar, hasSidebar }) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      height: '60px',
      zIndex: 1000,
      backgroundColor: '#f0f0f0',
      padding: '0 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #ccc'
    }}>
      <div style={{ padding: '10px 0' }}>
        {hasSidebar && (
          <button onClick={toggleSidebar}>
            {isSidebarOpen ? 'Close' : 'Open'}
          </button>
        )}
        <h1>My App</h1>
      </div>
      {/* Other topbar content like user profile, notifications, etc. */}
    </header>
  );
};

export default Topbar;
```

### `Sidebar.jsx`

The sidebar will be a sticky container for navigation links.

```jsx
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
```

## Styling

- Use CSS to style the components.
- The `marginLeft` on the `main` content area in `CorePage.jsx` is crucial for pushing the content to the right when the sidebar is open.
- The `position: fixed` and `transition` properties on the `Sidebar` are key for the sticky and sliding effect.
- The `position: sticky` on the `Topbar` keeps it at the top of the viewport.

## Login & Register page layout (frontend-layout.md)
Should adhere to sidebar and topbar layout guide during these pages.
Both to not show sidebar and only show simpler topbar when opened.
(Should be handled through main page by having a list of unauthorized routes, where it behave like that)