import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { authAPI } from '../../utils/api';
import './Signup.scss';

const Signup = () => {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.register(formData);
      
      if (response.success) {
        if (response.requiresEmailConfirmation) {
          // Show email confirmation message
          setMessage(response.message || 'Registration successful! Please check your email and click the confirmation link to activate your account.');
          
          // Don't redirect or set user in context - wait for email confirmation
        } else if (response.autoConfirmed) {
          // Auto-confirmed for development - show message but allow login
          setMessage(response.message || 'Registration successful! You can now log in with your credentials.');
          
          // Redirect to login page after delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        } else {
          // Legacy flow - direct login (shouldn't happen with new flow)
          setMessage('Registration successful! Redirecting...');
          setUserLogin(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        }
      } else {
        setMessage(response.message || 'Registration failed');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="signup">
      <div className="signup__container">
        <div className="signup__card">
          <div className="signup__header">
            <h1>Create Your Profile</h1>
            <p>Join Handle and automate your job search</p>
          </div>

          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form className="signup__form" onSubmit={handleSubmit}>
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="signup__switch">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="switch-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
