import React from 'react';
import JobCard from '../../components/JobCard/JobCard';
import './Landing.scss';

const Landing = () => {
  return (
    <div className="landing">
      <div className="landing__hero">
        <div className="container">
          <div className="hero__content">
            <h1 className="hero__title">
              Ever felt applying to jobs was boring,{' '}
              <span className="highlight">manual and time consuming?</span>
            </h1>
            
            <p className="hero__subtitle">
              Here's the solution: <span className="brand">Handle</span>
            </p>
            
            <div className="hero__card">
              <JobCard />
            </div>
          </div>
        </div>
      </div>
      
      <div className="landing__features">
        <div className="container">
          <div className="features__grid">
            <div className="feature__item">
              <div className="feature__icon">🚀</div>
              <h3>Lightning Fast</h3>
              <p>Apply to hundreds of jobs in minutes, not hours</p>
            </div>
            
            <div className="feature__item">
              <div className="feature__icon">🎯</div>
              <h3>Smart Matching</h3>
              <p>AI-powered job matching based on your skills and preferences</p>
            </div>
            
            <div className="feature__item">
              <div className="feature__icon">📈</div>
              <h3>Track Progress</h3>
              <p>Monitor your applications and success rates in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;