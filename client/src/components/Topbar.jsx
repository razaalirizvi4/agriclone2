import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../services/auth.service";
import "./Topbar.css";

const Topbar = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
    window.location.reload();
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Event Stream", path: "/event-stream" },
    { name: "Locations", path: "/locations" },
    { name: "Recipe Wizard", path: "/recipe-wizard" },
  ];

  return (
    <header className="topbar">
      {/* 🌿 Logo */}
      <div className="topbar-logo" onClick={() => navigate("/")}>
        <img
          src="https://thumbs.dreamstime.com/b/plant-leaves-hands-symbol-health-agriculture-farm-logo-plant-leaves-hands-symbol-health-agriculture-farm-logo-icon-172208439.jpg"
          alt="Logo"
          className="logo-img"
        />
        <span className="logo-text">AgriPro</span>
      </div>

      {/* 🍔 Hamburger Menu */}
      <div
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* 🌾 Navbar */}
      <nav className={`navbar ${menuOpen ? "active" : ""}`}>
        <ul>
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                className={`nav-btn ${
                  location.pathname === item.path ? "active" : ""
                }`}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 👤 User Section */}
      {isLoggedIn && currentUser ? (
        <div className="user-info">
          <img
            src="https://c8.alamy.com/comp/2RJ013K/agriculture-logo-design-concept-with-wheat-icon-farming-logotype-symbol-template-2RJ013K.jpg"
            alt="User"
            className="user-img"
          />
          <span className="user-name">{currentUser.name}</span>
          {currentUser.role ? (
            <span className="user-role" style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px', borderRadius: 4, background: '#eef', color: '#335' }}>
              {currentUser.role}
            </span>
          ) : null}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : null}
    </header>
  );
};

export default Topbar;
