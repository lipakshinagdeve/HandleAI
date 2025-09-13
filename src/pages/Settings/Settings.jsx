import React, { useState } from 'react';
import './Settings.scss';

const Settings = () => {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    skills: 'React, Node.js, Python, JavaScript, MongoDB'
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    console.log('Profile updated:', profile);
    alert('Profile updated successfully!');
  };

  const handleLogout = () => {
    console.log('User logged out');
    alert('Logged out successfully!');
  };

  const handleDeleteAccount = () => {
    console.log('Account deleted');
    alert('Account deleted successfully!');
    setShowDeleteModal(false);
  };

  const handleFeedback = () => {
    console.log('Opening feedback form');
    alert('Feedback form would open here');
  };

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
              💬 Give Feedback
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

              <button type="submit" className="btn btn-primary update-btn">
                Update Profile
              </button>
            </form>
          </div>

          <div className="settings__section">
            <h2>Account Actions</h2>
            <div className="action__buttons">
              <button onClick={handleLogout} className="btn btn-secondary logout-btn">
                🚪 Logout
              </button>
              
              <button 
                onClick={() => setShowDeleteModal(true)} 
                className="btn btn-danger delete-btn"
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>
        </div>

        {showDeleteModal && (
          <div className="modal__overlay">
            <div className="modal__content">
              <h3>Delete Account</h3>
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <div className="modal__buttons">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="btn btn-danger"
                >
                  Delete Account
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