import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './ConfirmEmail.scss';

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const { login: setUserLogin } = useUser();
  const [searchParams] = useSearchParams();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Confirming your email address...');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        // Add a small delay to prevent flash
        setTimeout(() => {
          setStatus('error');
          setMessage('Invalid confirmation link. Please check your email for the correct link.');
        }, 500);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5001/api/auth/confirm-email?token=${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email confirmed successfully! You can now log in to your account.');
          
          // Redirect to login page after a delay
          setTimeout(() => {
            navigate('/login?confirmed=true', { replace: true });
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to confirm email. Please try again or contact support.');
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('Network error. Please check your connection and try again.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="confirm-email">
      <div className="confirm-email__container">
        <div className="confirm-email__card">
          <div className="confirm-email__header">
            <h1>Email Confirmation</h1>
            {status === 'loading' && (
              <div className="spinner">
                <div className="spinner__circle"></div>
              </div>
            )}
          </div>

          <div className="confirm-email__content">
            {status === 'loading' && (
              <div className="status-message loading">
                <p>Confirming your email address...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="status-message success">
                <div className="success-icon">✅</div>
                <h2>Email Confirmed!</h2>
                <p>{message}</p>
                <p className="redirect-message">You'll be redirected to the login page in a few seconds...</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/login?confirmed=true', { replace: true })}
                >
                  Go to Login
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="status-message error">
                <div className="error-icon">❌</div>
                <h2>Confirmation Failed</h2>
                <p>{message}</p>
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/signup', { replace: true })}
                  >
                    Create New Account
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate('/login', { replace: true })}
                  >
                    Try Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
