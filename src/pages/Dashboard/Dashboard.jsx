import React, { useState, useEffect } from 'react';
import './Dashboard.scss';

const Dashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [jobsFound, setJobsFound] = useState(0);
  const [jobsApplied, setJobsApplied] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('Ready to start');

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setJobsFound(prev => prev + Math.floor(Math.random() * 3) + 1);
        setJobsApplied(prev => prev + Math.floor(Math.random() * 2) + 1);
        
        const statuses = [
          'Scanning job portals...',
          'Analyzing job requirements...',
          'Submitting applications...',
          'Optimizing cover letters...',
          'Processing applications...'
        ];
        setCurrentStatus(statuses[Math.floor(Math.random() * statuses.length)]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleToggle = () => {
    if (isRunning) {
      setIsRunning(false);
      setCurrentStatus('Stopped');
    } else {
      setIsRunning(true);
      setCurrentStatus('Starting automation...');
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setJobsFound(0);
    setJobsApplied(0);
    setCurrentStatus('Ready to start');
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard__header">
          <h1>Application Dashboard</h1>
          <p>Monitor your job applications in real-time</p>
        </div>

        <div className="dashboard__content">
          <div className="stats__grid">
            <div className="stat__card">
              <div className="stat__icon">🔍</div>
              <div className="stat__info">
                <h3>{jobsFound}</h3>
                <p>Available Jobs</p>
              </div>
            </div>

            <div className="stat__card">
              <div className="stat__icon">📝</div>
              <div className="stat__info">
                <h3>{jobsApplied}</h3>
                <p>Applications Sent</p>
              </div>
            </div>

            <div className="stat__card">
              <div className="stat__icon">⚡</div>
              <div className="stat__info">
                <h3>{jobsFound > 0 ? Math.round((jobsApplied / jobsFound) * 100) : 0}%</h3>
                <p>Success Rate</p>
              </div>
            </div>
          </div>

          <div className="control__panel">
            <div className="status__display">
              <div className={`status__indicator ${isRunning ? 'active' : ''}`}>
                {isRunning && <div className="pulse"></div>}
              </div>
              <div className="status__text">
                <h3>Status: <span className={isRunning ? 'running' : 'stopped'}>{currentStatus}</span></h3>
              </div>
            </div>

            <div className="control__buttons">
              <button 
                onClick={handleToggle}
                className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'} control-btn`}
              >
                {isRunning ? 'Stop Automation' : 'Start Automation'}
              </button>
              
              <button 
                onClick={handleReset}
                className="btn btn-secondary reset-btn"
                disabled={isRunning}
              >
                Reset Stats
              </button>
            </div>
          </div>

          <div className="recent__activity">
            <h3>Recent Activity</h3>
            <div className="activity__list">
              {isRunning && (
                <div className="activity__item active">
                  <div className="activity__icon">🔄</div>
                  <div className="activity__details">
                    <p><strong>Currently processing:</strong> {currentStatus}</p>
                    <span className="activity__time">Now</span>
                  </div>
                </div>
              )}
              
              <div className="activity__item">
                <div className="activity__icon">✅</div>
                <div className="activity__details">
                  <p>Applied to Software Engineer position at Tech Corp</p>
                  <span className="activity__time">2 minutes ago</span>
                </div>
              </div>
              
              <div className="activity__item">
                <div className="activity__icon">👀</div>
                <div className="activity__details">
                  <p>Found 5 new job opportunities matching your criteria</p>
                  <span className="activity__time">5 minutes ago</span>
                </div>
              </div>
              
              <div className="activity__item">
                <div className="activity__icon">📊</div>
                <div className="activity__details">
                  <p>Generated personalized cover letter for Frontend Developer role</p>
                  <span className="activity__time">8 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;