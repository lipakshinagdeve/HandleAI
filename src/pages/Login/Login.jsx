import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { authAPI } from '../../utils/api';
import './Login.scss';

const Login = () => {
  const navigate = useNavigate();
  const { login: setUserLogin } = useUser();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    skills: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.register(formData);
      
      if (response.success) {
        setMessage('Registration successful! Redirecting...');
        
        // Set user in global context
        setUserLogin(response.user);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect to landing page after short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setMessage(response.message || 'Registration failed');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }

    setLoading(false);
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
          navigate('/dashboard');
        }, 1000);
      } else {
        setMessage(response.message || 'Login failed');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setMessage('');
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      skills: '',
      password: ''
    });
  };

  return (
    <div className="login">
      <div className="login__container">
        <div className="login__card">
          <div className="login__header">
            <h1>{isLoginMode ? 'Welcome Back' : 'Create Your Profile'}</h1>
            <p>
              {isLoginMode 
                ? 'Sign in to your Handle account' 
                : 'Join Handle and automate your job search'
              }
            </p>
          </div>

          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form className="login__form" onSubmit={isLoginMode ? handleLogin : handleRegister}>
            {!isLoginMode && (
              <>
                <div className="form__row">
                  <div className="form__group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>

                  <div className="form__group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <div className="form__group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="skills">Skills</label>
                  <textarea
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="List your key skills (e.g., React, Node.js, Python, etc.)"
                    rows="4"
                    required
                  />
                </div>
              </>
            )}

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
              {loading 
                ? (isLoginMode ? 'Signing In...' : 'Creating Account...') 
                : (isLoginMode ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>

          <div className="login__switch">
            <p>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className="switch-btn" 
                onClick={toggleMode}
                disabled={loading}
              >
                {isLoginMode ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;