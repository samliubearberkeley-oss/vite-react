import { useState } from 'react';
import './JobPredictor.css';
import { useJobAnalysis } from '../hooks/useJobAnalysis';
import { getMonthsRemaining, getSarcasticAdvice } from '../utils/jobRiskCalculator';
import ResultCard from './ResultCard';
import LoadingAnimation from './LoadingAnimation';

function JobPredictor() {
  const [jobTitle, setJobTitle] = useState('');
  const { 
    isAnalyzing, 
    isGeneratingMeme, 
    result, 
    error, 
    progress, 
    stage,
    analyzeJob,
    cancelAnalysis,
    reset
  } = useJobAnalysis();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!jobTitle.trim()) return;
    
    // Use optimized hook
    await analyzeJob(jobTitle);
  };

  const handleReset = () => {
    reset();
    setJobTitle('');
  };

  return (
    <div className="job-predictor">
      <div className="container">
        
        {/* 8-bit Header with Icons */}
        <header className="pixel-header">
          <div className="header-icons">
            {/* Joystick Icon */}
            <div className="pixel-icon">
              <svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="12" y="4" width="8" height="4" fill="var(--color-yellow)"/>
                <rect x="8" y="8" width="16" height="16" fill="var(--color-blue)"/>
                <rect x="12" y="24" width="8" height="4" fill="var(--color-yellow)"/>
                <rect x="14" y="10" width="4" height="4" fill="var(--color-white)"/>
                <rect x="22" y="14" width="2" height="2" fill="var(--color-white)"/>
              </svg>
            </div>
            
            {/* Heart Icon */}
            <div className="pixel-icon">
              <svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="8" y="8" width="4" height="4" fill="var(--color-yellow)"/>
                <rect x="20" y="8" width="4" height="4" fill="var(--color-yellow)"/>
                <rect x="4" y="12" width="24" height="4" fill="var(--color-yellow)"/>
                <rect x="6" y="16" width="20" height="4" fill="var(--color-yellow)"/>
                <rect x="10" y="20" width="12" height="4" fill="var(--color-yellow)"/>
                <rect x="14" y="24" width="4" height="4" fill="var(--color-yellow)"/>
              </svg>
            </div>
          </div>

          <div className="title-container">
            <h1 className="pixel-title">UNEMPLOYMENT-AS-A-SERVICE</h1>
            <p className="pixel-subtitle">
              Find out when<br/>
              AI replaces you.<span className="cursor-blink">_</span>
            </p>
          </div>
          
          <div className="header-icons">
            {/* Music Note Icon */}
            <div className="pixel-icon">
              <svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="20" y="4" width="4" height="16" fill="var(--color-blue)"/>
                <rect x="16" y="20" width="8" height="8" fill="var(--color-blue)"/>
                <rect x="18" y="22" width="4" height="4" fill="var(--color-yellow)"/>
              </svg>
            </div>
            
            {/* Monitor Icon */}
            <div className="pixel-icon">
              <svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="4" y="6" width="24" height="16" fill="var(--color-blue)"/>
                <rect x="6" y="8" width="20" height="12" fill="var(--color-yellow)"/>
                <rect x="12" y="22" width="8" height="4" fill="var(--color-blue)"/>
              </svg>
            </div>
          </div>
        </header>

        {/* Pixel Border Decoration */}
        <div className="pixel-border-top"></div>

        {/* Main Content */}
        {!result ? (
          <div className="game-menu">
            <div className="menu-box">
              <div className="menu-header">
                <span className="menu-dots">●●●</span>
                <span className="menu-title">ENTER JOB</span>
                <span className="menu-dots">●●●</span>
              </div>
              
              <form onSubmit={handleSubmit} className="pixel-form">
                <div className="pixel-input-wrapper">
                  <input
                    type="text"
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="TYPE HERE..."
                    className="pixel-input"
                    disabled={isAnalyzing}
                    autoComplete="off"
                    maxLength={30}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={`pixel-button ${isAnalyzing ? 'calculating' : ''}`}
                  disabled={isAnalyzing || !jobTitle.trim()}
                >
                  {isAnalyzing ? '◆ PROCESSING ◆' : '► START'}
                </button>
                
                {isAnalyzing && (
                  <LoadingAnimation stage={stage} progress={progress} />
                )}
                
                {error && (
                  <div className="error-message">
                    ❌ {error}
                    <button onClick={cancelAnalysis} className="cancel-button">
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Game UI Status Bar */}
            <div className="status-bar">
            <div className="status-item">
              <span className="status-label">POWERED BY</span>
              <a 
                href="https://insforge.dev/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="status-value blink"
              >
                <span className="clickable-text">
                  INSFORGE
                  <svg className="pixel-cursor-below" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0L0 13L4 9L6 14L8 13L6 8L11 8L0 0Z" fill="white" stroke="black" strokeWidth="0.5"/>
                  </svg>
                </span>
              </a>
            </div>
            <div className="status-item">
              <span className="status-label">MADE BY</span>
              <a 
                href="https://www.linkedin.com/in/sam-liu-025b871a2/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="status-value spotlight-link"
              >
                <span className="clickable-text">
                  SAM LIU
                </span>
              </a>
            </div>
            </div>
          </div>
        ) : (
          <ResultCard 
            result={{
              ...result,
              monthsRemaining: result ? getMonthsRemaining(result.riskScore) : 0,
              advice: result ? getSarcasticAdvice(result.category, result.riskScore) : ''
            }} 
            onReset={handleReset} 
          />
        )}

        {/* Bottom Pixel Border */}
        <div className="pixel-border-bottom"></div>
      </div>
    </div>
  );
}

export default JobPredictor;
