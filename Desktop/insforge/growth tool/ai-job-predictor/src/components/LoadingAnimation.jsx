import './LoadingAnimation.css';

function LoadingAnimation({ stage, progress }) {
  const getStageText = () => {
    switch (stage) {
      case 'analyzing':
        return 'AI PROCESSING...';
      case 'generating':
        return 'CREATING CONTENT...';
      default:
        return 'INITIALIZING...';
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'analyzing':
        return '●';
      case 'generating':
        return '■';
      default:
        return '◆';
    }
  };

  return (
    <div className="loading-animation">
      <div className="loading-container">
        <div className="loading-icon">
          {getStageIcon()}
        </div>
        
        <div className="loading-text">
          {getStageText()}
        </div>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {Math.round(progress)}%
          </div>
        </div>
        
        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
}

export default LoadingAnimation;
