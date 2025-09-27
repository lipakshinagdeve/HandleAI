import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { userAPI, authAPI } from '../../utils/api';
import './Settings.scss';

const Settings = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    skills: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        skills: user.skills || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await userAPI.updateProfile(profile);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        alert('Profile updated successfully!');
      } else {
        alert(response.message || 'Update failed');
      }
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type "DELETE" to confirm account deletion');
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await userAPI.deleteAccount('DELETE');
      
      if (response.success) {
        // Clear user data
        localStorage.removeItem('user');
        setUser(null);
        
        // Show success message
        alert('Account deleted successfully. You will be redirected to the home page.');
        
        // Redirect to home page
        navigate('/');
      } else {
        alert(response.message || 'Failed to delete account');
      }
    } catch (error) {
      alert('Error deleting account: ' + error.message);
    }

    setDeleteLoading(false);
    setShowDeleteModal(false);
  };

  const handleFeedback = () => {
    alert('Feedback form would open here');
  };

  if (!user) {
    return (
      <div className="settings">
        <div className="container">
          <div className="settings__header">
            <h1>Please login to access settings</h1>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="container">
        <div className="settings__header">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>

        <div className="settings__content">
          <div className="settings__section">
            <button onClick={handleFeedback} className="feedback__button">
              Give Feedback
            </button>
          </div>

          <div className="settings__section">
            <h2>Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="profile__form">
              <div className="form__row">
                <div className="form__group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form__group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  required
                  disabled
                />
              </div>

              <div className="form__group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form__group">
                <label htmlFor="skills">Skills</label>
                <textarea
                  id="skills"
                  name="skills"
                  value={profile.skills}
                  onChange={handleChange}
                  rows="4"
                  placeholder="List your key skills"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary update-btn" 
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>

          <div className="settings__section">
            <h2>Account Actions</h2>
            <div className="action__buttons">
              <button onClick={handleLogout} className="btn btn-secondary logout-btn">
                Logout
              </button>
              
              <button 
                onClick={() => setShowDeleteModal(true)} 
                className="btn btn-danger delete-btn"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {showDeleteModal && (
          <div className="modal__overlay">
            <div className="modal__content">
              <h3>Delete Account Permanently</h3>
              <p>
                <strong>Warning:</strong> This action cannot be undone. All your data, 
                including job applications and profile information, will be permanently deleted.
              </p>
              <div className="form__group">
                <label htmlFor="deleteConfirmation">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  id="deleteConfirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE here"
                  className="delete-confirmation-input"
                />
              </div>
              <div className="modal__buttons">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="btn btn-secondary"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="btn btn-danger"
                  disabled={deleteLoading || deleteConfirmation !== 'DELETE'}
                >
                  {deleteLoading ? 'Deleting Account...' : 'Delete Account Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;