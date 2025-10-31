// 🚀 Optimized React Hook for Job Analysis
// Handles async state, error recovery, and performance monitoring

import { useState, useCallback, useRef } from 'react';
import { calculateJobRisk, getMonthsRemaining, getSarcasticAdvice, saveCompleteAnalysis } from '../utils/jobRiskCalculator';
import { getMemeWithText } from '../utils/memeGenerator';

export function useJobAnalysis() {
  const [state, setState] = useState({
    isAnalyzing: false,
    isGeneratingMeme: false,
    result: null,
    error: null,
    progress: 0,
    stage: 'idle'
  });

  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Optimized analysis with timeout and abort handling
  const analyzeJob = useCallback(async (jobTitle) => {
    // Prevent duplicate submissions
    if (state.isAnalyzing) {
      console.warn('⚠️ Analysis already in progress');
      return;
    }

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      progress: 0,
      stage: 'analyzing'
    }));

    try {
      // Set timeout for analysis
      timeoutRef.current = setTimeout(() => {
        abortControllerRef.current?.abort();
        throw new Error('Analysis timeout after 30 seconds');
      }, 30000);

      // Step 1: AI Analysis
      setState(prev => ({ ...prev, progress: 20 }));
      const analysisResult = await calculateJobRisk(jobTitle, null);

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Analysis cancelled');
      }

      if (!analysisResult) {
        throw new Error('AI analysis failed');
      }

      // Step 2: Meme Generation
      setState(prev => ({ 
        ...prev, 
        isGeneratingMeme: true,
        progress: 50,
        stage: 'generating'
      }));

      const memeResult = await getMemeWithText(analysisResult);

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Meme generation cancelled');
      }

      // Step 3: Save to database (only if meme generation successful)
      setState(prev => ({ ...prev, progress: 80 }));
      let predictionId = null;
      
      if (memeResult.generatedMemeUrl && !memeResult.generatedMemeUrl.startsWith('/meme/')) {
        console.log('✅ Meme generated successfully, saving to database...');
        const saved = await saveCompleteAnalysis(
          jobTitle,
          analysisResult.riskScore, 
          analysisResult.category,
          analysisResult.reasoning,
          analysisResult.timeframe,
          memeResult.generatedMemeUrl,
          memeResult.baseMemeTemplate
        );
        predictionId = saved?.id;
        console.log('✅ Complete analysis saved to database with ID:', predictionId);
      } else {
        console.warn('⚠️ Meme generation failed (fallback used), NOT saving to database');
      }

      // Step 4: Complete
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        isGeneratingMeme: false,
        progress: 100,
        stage: 'completed',
        result: {
          ...analysisResult,
          meme: memeResult,
          predictionId,
          timestamp: Date.now()
        }
      }));

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🛑 Analysis cancelled by user');
        return;
      }

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        isGeneratingMeme: false,
        error: error.message,
        stage: 'error'
      }));

      console.error('❌ Analysis failed:', error);
    }
  }, [state.isAnalyzing]);

  // Cancel analysis
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      isGeneratingMeme: false,
      stage: 'cancelled'
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    cancelAnalysis();
    setState({
      isAnalyzing: false,
      isGeneratingMeme: false,
      result: null,
      error: null,
      progress: 0,
      stage: 'idle'
    });
  }, [cancelAnalysis]);

  return {
    ...state,
    analyzeJob,
    cancelAnalysis,
    reset
  };
}