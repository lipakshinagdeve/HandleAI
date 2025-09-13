import React from 'react';
import './JobCard.scss';

const JobCard = () => {
  return (
    <div className="job-card">
      <div className="job-card__header">
        <h3>Job Application Automation</h3>
        <p>Streamline your job search with AI-powered tools</p>
      </div>
      
      <div className="job-card__content">
        <div className="input-group">
          <label htmlFor="jobPortalLink">Paste the link of your job portal</label>
          <input
            type="url"
            id="jobPortalLink"
            placeholder="https://linkedin.com/jobs/search/..."
            className="job-portal-input"
          />
        </div>
        
        <button className="btn btn-primary get-started-btn">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default JobCard;