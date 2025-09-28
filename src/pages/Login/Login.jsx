import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { authAPI } from '../../utils/api';
import './Login.scss';

const Login = () => {
  const navigate = useNavigate();
  const { login: setUserLogin } = useUser();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        setMessage('Login successful! Redirecting...');
        
        // Set user in global context
        setUserLogin(response.user);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        // Check if it's an email confirmation issue
        if (response.emailNotConfirmed) {
          setMessage(response.message || 'Your email address has not been confirmed yet. Please check your email and click the confirmation link to activate your account.');
        } else {
          setMessage(response.message || 'Login failed');
        }
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }

    setLoading(false);
  };


  return (
    <div className="login">
      <div className="login__container">
        <div className="login__card">
          <div className="login__header">
            <h1>Welcome Back</h1>
            <p>Sign in to your Handle account</p>
          </div>

          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form className="login__form" onSubmit={handleLogin}>
            <div className="form__group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form__group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary save-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login__switch">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="switch-link">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;