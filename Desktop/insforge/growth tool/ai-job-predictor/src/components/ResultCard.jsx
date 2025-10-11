import { useState, useEffect } from 'react';
import './ResultCard.css';

function ResultCard({ result, onReset }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const formatMonths = (months) => {
    if (months < 12) {
      return `${months} MONTH${months === 1 ? '' : 'S'}`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} YEAR${years === 1 ? '' : 'S'}`;
    }
    return `${years}Y ${remainingMonths}M`;
  };

  const getRiskLevel = (score) => {
    if (score >= 90) return 'CRITICAL';
    if (score >= 75) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    if (score >= 30) return 'LOW';
    return 'SAFE';
  };

  const getRiskColor = (score) => {
    if (score >= 75) return 'var(--color-yellow)';
    if (score >= 50) return 'var(--color-blue)';
    return 'var(--color-white)';
  };

  return (
    <div className={`result-container ${isVisible ? 'visible' : ''}`}>
      {/* Result Screen Box */}
      <div className="result-screen">
        <div className="screen-header">
          <span className="screen-dots">●●●</span>
          <span className="screen-title">ANALYSIS COMPLETE</span>
          <span className="screen-dots">●●●</span>
        </div>

        <div className="screen-content">
          {/* Job Info Block */}
          <div className="info-block yellow-block">
            <div className="block-label">JOB</div>
            <div className="block-value">{result.title}</div>
          </div>

          {/* AI Reasoning Block */}
          {result.reasoning && (
            <div className="info-block blue-block">
              <div className="block-label">AI ANALYSIS</div>
              <div className="block-value">{result.reasoning}</div>
            </div>
          )}

          {/* Timeframe Block */}
          {result.timeframe && (
            <div className="info-block white-block">
              <div className="block-label">ESTIMATED TIMEFRAME</div>
              <div className="block-value">{result.timeframe}</div>
            </div>
          )}

          {/* Risk Score Block */}
          <div className="info-block blue-block">
            <div className="block-label">RISK LEVEL</div>
            <div className="block-value score" style={{ color: getRiskColor(result.riskScore) }}>
              {result.riskScore}%
            </div>
            <div className="risk-label">{getRiskLevel(result.riskScore)}</div>
          </div>

          {/* Pixel Progress Bar */}
          <div className="pixel-progress-container">
            <div className="progress-label">THREAT METER</div>
            <div className="pixel-progress-bar">
              <div 
                className="pixel-progress-fill"
                style={{ width: `${result.riskScore}%` }}
              >
                {Array.from({ length: Math.floor(result.riskScore / 10) }).map((_, i) => (
                  <div key={i} className="pixel-block"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Block */}
          <div className="info-block white-block">
            <div className="block-label">TIME LEFT</div>
            <div className="block-value">{formatMonths(result.monthsRemaining)}</div>
          </div>

          {/* Advice Box */}
          <div className="advice-box">
            <div className="advice-header">
              <span>► SYSTEM MESSAGE</span>
            </div>
            <div className="advice-content">
              {result.advice}
            </div>
          </div>

          {/* Meme Display with AI Text Overlay */}
          {result.isError ? (
            <div className="meme-box">
              <div className="meme-container error-state">
                <div className="error-meme">
                  <div className="error-text">
                    <div className="error-line">AI TRIED</div>
                    <div className="error-line">GAVE UP</div>
                  </div>
                </div>
              </div>
            </div>
          ) : result.memeUrl ? (
            <div className="meme-box">
              <div className="meme-container">
                <img 
                  src={result.memeUrl} 
                  alt="Result meme" 
                  className="pixel-meme"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('❌ Meme load failed:', result.memeUrl);
                    console.error('❌ Error details:', e);
                    console.error('❌ Network error:', e.target.error);
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('✅ Meme loaded successfully:', result.memeUrl);
                  }}
                />
                {result.memeText && (() => {
                  // Parse text with " / " separator for multi-position text
                  const textParts = result.memeText.split(' / ');
                  const hasMultipleParts = textParts.length > 1;
                  
                  // Detect specific meme types by checking config name or meme URL
                  const isDrakeStyle = result.memeConfig?.name === 'Drake Style' || 
                                      result.memeUrl?.includes('6.jpg');
                  const isTwoButtons = result.memeConfig?.name === 'Two Buttons' || 
                                      result.memeUrl?.includes('2.jpg');
                  const isStickFigure = result.memeConfig?.name === 'Stick Figure Talk' || 
                                       result.memeUrl?.includes('4.jpg');
                  
                  if (hasMultipleParts) {
                    // Use specific layout based on meme type
                    let layoutClass = 'split'; // default for top/bottom (3.jpg, 5.jpeg)
                    if (isDrakeStyle) layoutClass = 'drake-style';
                    else if (isTwoButtons) layoutClass = 'two-buttons';
                    else if (isStickFigure) layoutClass = 'stick-figure';
                    
                    return (
                      <div className={`meme-text-overlay ${layoutClass}`}>
                        <div className="meme-text top-text">{textParts[0]}</div>
                        <div className="meme-text bottom-text">{textParts[1]}</div>
                      </div>
                    );
                  } else {
                    // Single centered text
                    return (
                      <div className="meme-text-overlay">
                        <div className="meme-text">{result.memeText}</div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="pixel-actions">
            <button className="pixel-btn retry-btn" onClick={onReset}>
              ◄ RETRY
            </button>
            
            <button 
              className="pixel-btn share-btn"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'AI Job Predictor',
                    text: `My job (${result.title}) has ${result.riskScore}% AI risk!`,
                    url: window.location.href
                  });
                } else {
                  alert('Screenshot and share! 📸');
                }
              }}
            >
              SHARE ►
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="result-status">
        <a 
          href="https://insforge.dev/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="blink-text"
        >
          🧠 POWERED BY 
          <span className="clickable-text">
            INSFORGE
            <svg className="pixel-cursor-below" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0L0 13L4 9L6 14L8 13L6 8L11 8L0 0Z" fill="white" stroke="black" strokeWidth="0.5"/>
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
}

export default ResultCard;
