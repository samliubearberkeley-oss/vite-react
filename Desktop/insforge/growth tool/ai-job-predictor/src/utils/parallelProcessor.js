// 🚀 Parallel Processing Utilities
// Optimized batch processing with concurrency control and error handling

/**
 * Process items in parallel with concurrency limit
 * @param {Array} items - Items to process
 * @param {Function} processor - Processing function
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} - Processed results
 */
export async function processInParallel(items, processor, options = {}) {
  const {
    concurrency = 3,
    retries = 2,
    timeout = 30000,
    onProgress = () => {},
    onError = () => {}
  } = options;

  const results = [];
  const errors = [];
  
  // Process in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map(async (item, index) => {
      const globalIndex = i + index;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), timeout);
          });
          
          const result = await Promise.race([
            processor(item, globalIndex),
            timeoutPromise
          ]);
          
          return { success: true, data: result, index: globalIndex };
        } catch (error) {
          if (attempt === retries) {
            onError(error, item, globalIndex);
            return { success: false, error, index: globalIndex };
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process batch results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results[result.value.index] = result.value;
      } else {
        errors.push({ error: result.reason, index: i + index });
      }
    });

    onProgress(i + batch.length, items.length);
  }

  return { results, errors };
}

/**
 * Optimized job analysis with parallel processing
 * @param {string[]} jobTitles - Array of job titles
 * @param {Function} analyzer - Analysis function
 * @returns {Promise<Object>} - Analysis results
 */
export async function batchAnalyzeJobs(jobTitles, analyzer) {
  const startTime = performance.now();
  
  const { results, errors } = await processInParallel(
    jobTitles,
    analyzer,
    {
      concurrency: 3,
      retries: 2,
      timeout: 30000,
      onProgress: (completed, total) => {
        console.log(`📊 Progress: ${completed}/${total} jobs analyzed`);
      },
      onError: (error, jobTitle, index) => {
        console.error(`❌ Failed to analyze job ${index}: ${jobTitle}`, error);
      }
    }
  );

  const successfulResults = results.filter(r => r?.success);
  const failedResults = results.filter(r => !r?.success);

  console.log(`✅ Batch analysis completed in ${performance.now() - startTime}ms`);
  console.log(`📈 Success: ${successfulResults.length}, Failed: ${failedResults.length}`);

  return {
    successful: successfulResults.map(r => r.data),
    failed: failedResults.map(r => ({ error: r.error, index: r.index })),
    metrics: {
      totalTime: performance.now() - startTime,
      successRate: successfulResults.length / jobTitles.length,
      avgTimePerJob: (performance.now() - startTime) / jobTitles.length
    }
  };
}

/**
 * Memory-efficient streaming processor
 * @param {Array} items - Items to process
 * @param {Function} processor - Processing function
 * @param {Function} onResult - Result callback
 * @param {Object} options - Configuration
 */
export async function streamProcess(items, processor, onResult, options = {}) {
  const { concurrency = 2, batchSize = 10 } = options;
  
  let processedCount = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (item, index) => {
      try {
        const result = await processor(item);
        onResult(result, i + index);
        processedCount++;
        return result;
      } catch (error) {
        console.error(`❌ Stream processing error:`, error);
        return null;
      }
    });

    await Promise.allSettled(batchPromises);
    
    // Memory cleanup
    if (processedCount % 50 === 0) {
      if (global.gc) {
        global.gc();
      }
    }
  }
}

/**
 * Debounced batch processor
 * @param {Function} processor - Processing function
 * @param {number} delay - Delay in milliseconds
 * @param {number} maxBatchSize - Maximum batch size
 */
export function createDebouncedBatchProcessor(processor, delay = 1000, maxBatchSize = 10) {
  let timeoutId = null;
  let batch = [];
  
  return (item) => {
    batch.push(item);
    
    if (batch.length >= maxBatchSize) {
      // Process immediately if batch is full
      const currentBatch = [...batch];
      batch = [];
      return processor(currentBatch);
    }
    
    // Debounce processing
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (batch.length > 0) {
        const currentBatch = [...batch];
        batch = [];
        processor(currentBatch);
      }
    }, delay);
  };
}
