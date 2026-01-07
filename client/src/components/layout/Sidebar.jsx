import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import "./sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const sidebarRoutes = [
    { name: "User Management", path: "/admin/users" },
    { name: "Permissions Management", path: "/admin/permissions" },
  ];

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      // Add event listener when sidebar is open
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <aside ref={sidebarRef} className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h3>Admin Setup</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <ul>
        {sidebarRoutes.map((item) => (
          <li key={item.name}>
            <button
              className={location.pathname === item.path ? "active" : ""}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
