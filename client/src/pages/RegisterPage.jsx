import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import Topbar from '../components/Topbar';
const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      await authService.register(name, email, password, contact);
      navigate('/login');
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <>
      <Topbar isLoggedIn={false} showNav={false} />
      <style>{`
        .auth-shell {
          min-height: 100vh;
          height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          background: #F6FBF6;
          color: #0F172A;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        .form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          // background: radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.08), transparent 25%),
          //             radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.08), transparent 22%),
          //             #FDFEFE;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #FFFFFF;
          border: 1px solid #E5EFE5;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          animation: fadeUp 0.6s ease forwards;
          box-sizing: border-box;
          /* FORCE CENTER — works no matter the parent */
          position: fixed;
          inset: 0;
          margin: auto;
          height: fit-content;
        }
        .auth-card *,
        .auth-card *::before,
        .auth-card *::after {
          box-sizing: border-box;
        }
        .auth-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .auth-title {
          font-size: 26px;
          font-weight: 800;
          color: #4A5D23;
          letter-spacing: -0.02em;
        }
        .badge {
          padding: 6px 10px;
          border-radius: 999px;
          background: #ECFDF3;
          color: #4A5D23;
          font-weight: 700;
          font-size: 12px;
          border: 1px solid #BBF7D0;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 6px;
        }
        .input-field {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #D9E7D9;
          background: #F9FDF9;
          color: #0F172A;
          font-size: 15px;
          transition: all 0.2s ease;
        }
        .input-field::placeholder {
          color: #6B7280;
        }
        .input-field:focus {
          outline: none;
          border-color: #000000;
          box-shadow: none;
          background: #FFFFFF;
        }
        .submit-btn {
          width: 100%;
          padding: 12px 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #4A5D23, #4A5D23);
          color: #FFFFFF;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          // box-shadow: 0 12px 30px rgba(74, 93, 35, 0.25);
        }
        .submit-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }
        .submit-btn:active {
          transform: translateY(0);
        }
        .alt-link {
          margin-top: 16px;
          text-align: center;
          color: #4B5563;
          font-size: 14px;
        }
        .alt-link a {
          color: #4A5D23;
          font-weight: 700;
          text-decoration: none;
          position: relative;
        }
        .alt-link a::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 2px;
          background: #4A5D23;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .alt-link a:hover::after {
          transform: scaleX(1);
        }
        .message {
          margin-top: 10px;
          color: #B91C1C;
          font-weight: 700;
          text-align: center;
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 960px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .form-panel {
            padding: 32px 20px;
          }
          .auth-card {
            padding: 24px 20px;
          }
        }
      `}</style>
      <div className="auth-shell">
        <div className="form-panel">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-title">Create account</div>
            </div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                className="input-field"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="input-field"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="input-field"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                className="input-field"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <input
                className="input-field"
                type="text"
                placeholder="Contact (optional)"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
              <button className="submit-btn" type="submit">
                Create account
              </button>
            </form>
            {message && <p className="message">{message}</p>}
            <p className="alt-link">
              Already have an account? <a href="/login">Log in</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
export default RegisterPage;