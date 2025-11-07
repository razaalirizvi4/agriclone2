import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('owner');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      await authService.register(name, email, password, contact, role);
      navigate('/login');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 60px)', // Adjust for topbar height
      backgroundColor: '#f4f4f4'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        width: '300px'
      }}>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ textAlign: 'left', marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#495057' }}>Choose Your Role *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '10px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                backgroundColor: role === 'owner' ? '#e7f3ff' : 'transparent',
                border: role === 'owner' ? '2px solid #007bff' : '2px solid #dee2e6',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="owner" 
                  checked={role === 'owner'} 
                  onChange={() => setRole('owner')}
                  style={{ marginRight: '10px', cursor: 'pointer' }}
                /> 
                <div>
                  <div style={{ fontWeight: '600', color: '#212529' }}>Owner</div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>Manage your own farms and fields</div>
                </div>
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '10px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                backgroundColor: role === 'admin' ? '#e7f3ff' : 'transparent',
                border: role === 'admin' ? '2px solid #007bff' : '2px solid #dee2e6',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="admin" 
                  checked={role === 'admin'} 
                  onChange={() => setRole('admin')}
                  style={{ marginRight: '10px', cursor: 'pointer' }}
                /> 
                <div>
                  <div style={{ fontWeight: '600', color: '#212529' }}>Admin</div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>View and manage all farms and fields</div>
                </div>
              </label>
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Contact (Optional)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <button type="submit"
            style={{
              width: '100%', padding: '10px', backgroundColor: '#28a745',
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
            }}>
            Register
          </button>
        </form>
        {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
        <p style={{ marginTop: '20px' }}>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

