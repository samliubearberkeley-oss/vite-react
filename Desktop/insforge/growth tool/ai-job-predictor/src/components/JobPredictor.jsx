import { useState } from 'react';
import './JobPredictor.css';
import { calculateJobRisk, getMonthsRemaining, getSarcasticAdvice, saveCompleteAnalysis } from '../utils/jobRiskCalculator';
import { getMemeWithText } from '../utils/memeGenerator';
import ResultCard from './ResultCard';
import LoadingAnimation from './LoadingAnimation';

function JobPredictor() {
  const [jobTitle, setJobTitle] = useState('');
  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingStage, setLoadingStage] = useState('analyzing');
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!jobTitle.trim()) return;
    
    // ✅ 防止重复提交：如果已经在计算中，直接返回
    if (isCalculating) {
      console.warn('⚠️ Already calculating, ignoring duplicate submission');
      return;
    }

    setIsCalculating(true);
    setLoadingStage('analyzing');
    setLoadingProgress(0);
    
    try {
      // Step 1: 使用 GPT-4o AI 分析（不保存到数据库）
      console.log('🤖 Step 1: Starting GPT-4o AI analysis...');
      setLoadingProgress(20);
      const riskData = await calculateJobRisk(jobTitle, null); // 不传predictionId
      
      if (riskData) {
        const months = getMonthsRemaining(riskData.riskScore);
        const advice = getSarcasticAdvice(riskData.category, riskData.riskScore);
        
        // Step 2: 使用 Gemini 生成 meme 并上传到 Storage
        console.log('🎨 Step 2: Generating meme with Gemini AI...');
        setLoadingStage('generating');
        setLoadingProgress(50);
        const memeData = await getMemeWithText(riskData);
        
        // Step 3: 一次性保存完整结果到数据库（只有Gemini成功生成时才保存）
        console.log('💾 Step 3: Saving complete analysis to database...');
        setLoadingProgress(80);
        let predictionId = null;
        
        // ✅ 只有当Gemini成功生成并上传到Storage时才保存
        // 如果是fallback本地路径（/meme/*.jpg），不保存到数据库
        if (memeData.generatedMemeUrl && !memeData.generatedMemeUrl.startsWith('/meme/')) {
          console.log('✅ Gemini meme generated successfully, saving to database...');
          const saved = await saveCompleteAnalysis(
            jobTitle,
            riskData.riskScore, 
            riskData.category,
            riskData.reasoning,
            riskData.timeframe,
            memeData.generatedMemeUrl,  // ✅ 只使用Storage URL
            memeData.baseMemeTemplate  // 使用的模板名称
          );
          predictionId = saved?.id;
          console.log('✅ Complete analysis saved to database with ID:', predictionId);
        } else {
          console.warn('⚠️ Meme generation failed (fallback used), NOT saving to database');
        }
        
        setLoadingProgress(100);
        // Debug meme data
        console.log('🎭 Meme data received:', memeData);
        console.log('🎭 Meme URL being set:', memeData.imageUrl);
        console.log('🎭 Generated meme URL:', memeData.generatedMemeUrl);
        
        setResult({
          ...riskData,
          monthsRemaining: months,
          advice,
          memeUrl: memeData.imageUrl,
          memeText: memeData.text,
          memeConfig: memeData.config,
          isError: memeData.isError || false  // 传递错误状态
        });
        console.log('✅ All steps completed!');
      }
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      // 显示错误信息，不自动重试
      alert('AI分析失败，请重试。错误: ' + error.message);
    } finally {
      setIsCalculating(false);
      setLoadingProgress(0);
    }
  };

  const handleReset = () => {
    setResult(null);
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
                    disabled={isCalculating}
                    autoComplete="off"
                    maxLength={30}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={`pixel-button ${isCalculating ? 'calculating' : ''}`}
                  disabled={isCalculating || !jobTitle.trim()}
                >
                  {isCalculating ? '◆ PROCESSING ◆' : '► START'}
                </button>
                
                {isCalculating && (
                  <LoadingAnimation stage={loadingStage} progress={loadingProgress} />
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
          <ResultCard result={result} onReset={handleReset} />
        )}

        {/* Bottom Pixel Border */}
        <div className="pixel-border-bottom"></div>
      </div>
    </div>
  );
}

export default JobPredictor;
