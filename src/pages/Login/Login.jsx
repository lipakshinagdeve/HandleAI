import React, { useState } from 'react';
import './Login.scss';

const Login = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    skills: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  return (
    <div className="login">
      <div className="login__container">
        <div className="login__card">
          <div className="login__header">
            <h1>Create Your Profile</h1>
            <p>Join Handle and automate your job search</p>
          </div>

          <form className="login__form" onSubmit={handleSubmit}>
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

            <button type="submit" className="btn btn-primary save-btn">
              Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;