import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

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
      <style>{`
        .auth-shell {
          min-height: 100vh;
          height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          background: #f6fbf6;
          color: #0f172a;
        }

        .hero {
          position: relative;
          overflow: hidden;
          height: 100%;
          min-height: 100vh;
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(20, 83, 45, 0.7), rgba(22, 163, 74, 0.55));
          z-index: 1;
          mix-blend-mode: multiply;
        }

        .hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.02);
          filter: saturate(1.05);
        }

        .hero-copy {
          position: absolute;
          bottom: 12%;
          left: 8%;
          z-index: 2;
          color: #f8fafc;
          max-width: 420px;
          animation: fadeUp 0.8s ease forwards;
        }

        .hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .hero-title {
          margin: 14px 0 6px;
          font-size: 32px;
          font-weight: 800;
          line-height: 1.2;
        }

        .hero-sub {
          font-size: 15px;
          color: #e2f4e8;
        }

        .form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.08), transparent 25%),
                      radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.08), transparent 22%),
                      #fdfefe;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border: 1px solid #e5efe5;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          animation: fadeUp 0.6s ease forwards;
          box-sizing: border-box;
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
          background: #ecfdf3;
          color: #4A5D23;
          font-weight: 700;
          font-size: 12px;
          border: 1px solid #bbf7d0;
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
          border: 1px solid #d9e7d9;
          background: #f9fdf9;
          color: #0f172a;
          font-size: 15px;
          transition: all 0.2s ease;
        }

        .input-field::placeholder {
          color: #6b7280;
        }

        .input-field:focus {
          outline: none;
          border-color: #4A5D23;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.16);
          background: #ffffff;
        }

        .submit-btn {
          width: 100%;
          padding: 12px 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #4A5D23, #4A5D23);
          color: #ffffff;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          box-shadow: 0 12px 30px rgba(74, 93, 35, 0.25);
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
          color: #4b5563;
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
          color: #b91c1c;
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
          .hero {
            height: 40vh;
          }
          .hero-copy {
            bottom: 10%;
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
        <div className="hero">
          <img
            src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80"
            alt="Lush green farmland"
            loading="lazy"
          />
          <div className="hero-copy">
            <div className="hero-chip">
              <span role="img" aria-label="seedling">🌱</span>
              Join the growers
            </div>
            <div className="hero-title">Start your greener operations.</div>
            <div className="hero-sub">Create your account and keep fields, tasks, and growth aligned.</div>
          </div>
        </div>

        <div className="form-panel">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-title">Create account</div>
              <div className="badge">Get started</div>
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

