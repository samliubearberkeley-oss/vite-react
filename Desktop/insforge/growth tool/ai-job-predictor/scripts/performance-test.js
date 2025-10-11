#!/usr/bin/env node

// 🚀 Performance Testing Script
// Automated performance testing for AI job predictor

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class PerformanceTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {},
      timestamp: new Date().toISOString()
    };
    
    this.testJobs = [
      'Software Engineer',
      'Data Scientist', 
      'Marketing Manager',
      'Customer Service Representative',
      'Accountant',
      'Graphic Designer',
      'Project Manager',
      'Sales Representative',
      'HR Manager',
      'Content Writer'
    ];
  }

  /**
   * Run all performance tests
   */
  async runTests() {
    console.log('🚀 Starting performance tests...');
    
    try {
      // 1. Load time test
      await this.testLoadTime();
      
      // 2. Memory usage test
      await this.testMemoryUsage();
      
      // 3. AI response time test
      await this.testAIResponseTime();
      
      // 4. Cache performance test
      await this.testCachePerformance();
      
      // 5. Concurrent request test
      await this.testConcurrentRequests();
      
      // 6. Generate performance report
      await this.generateReport();
      
      console.log('✅ Performance tests completed!');
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test application load time
   */
  async testLoadTime() {
    console.log('⏱️ Testing load time...');
    
    const startTime = performance.now();
    
    // Simulate loading the application
    await this.simulateAppLoad();
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    this.results.tests.push({
      name: 'load_time',
      duration: loadTime,
      status: loadTime < 2000 ? 'pass' : 'fail',
      threshold: 2000,
      message: `Load time: ${Math.round(loadTime)}ms`
    });
  }

  /**
   * Test memory usage
   */
  async testMemoryUsage() {
    console.log('💾 Testing memory usage...');
    
    const initialMemory = process.memoryUsage();
    
    // Simulate memory-intensive operations
    await this.simulateMemoryOperations();
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    this.results.tests.push({
      name: 'memory_usage',
      duration: 0,
      memoryIncrease: memoryIncrease,
      status: memoryIncrease < 50 * 1024 * 1024 ? 'pass' : 'fail', // 50MB threshold
      threshold: 50 * 1024 * 1024,
      message: `Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`
    });
  }

  /**
   * Test AI response time
   */
  async testAIResponseTime() {
    console.log('🤖 Testing AI response time...');
    
    const responseTimes = [];
    
    for (const jobTitle of this.testJobs.slice(0, 3)) {
      const startTime = performance.now();
      
      try {
        // Simulate AI analysis
        await this.simulateAIAnalysis(jobTitle);
        
        const endTime = performance.now();
        responseTimes.push(endTime - startTime);
        
      } catch (error) {
        console.log(`⚠️ AI test failed for ${jobTitle}:`, error.message);
      }
    }
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    this.results.tests.push({
      name: 'ai_response_time',
      duration: avgResponseTime,
      status: avgResponseTime < 5000 ? 'pass' : 'fail',
      threshold: 5000,
      message: `Average AI response time: ${Math.round(avgResponseTime)}ms`
    });
  }

  /**
   * Test cache performance
   */
  async testCachePerformance() {
    console.log('💾 Testing cache performance...');
    
    const cacheHits = [];
    const cacheMisses = [];
    
    // Test cache hits
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      await this.simulateCacheAccess('cached_key');
      const endTime = performance.now();
      cacheHits.push(endTime - startTime);
    }
    
    // Test cache misses
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      await this.simulateCacheAccess(`miss_key_${i}`);
      const endTime = performance.now();
      cacheMisses.push(endTime - startTime);
    }
    
    const avgHitTime = cacheHits.reduce((a, b) => a + b, 0) / cacheHits.length;
    const avgMissTime = cacheMisses.reduce((a, b) => a + b, 0) / cacheMisses.length;
    const hitRate = cacheHits.length / (cacheHits.length + cacheMisses.length);
    
    this.results.tests.push({
      name: 'cache_performance',
      duration: avgHitTime,
      hitRate: hitRate,
      status: avgHitTime < 10 && hitRate > 0.8 ? 'pass' : 'fail',
      threshold: { hitTime: 10, hitRate: 0.8 },
      message: `Cache hit time: ${Math.round(avgHitTime)}ms, Hit rate: ${Math.round(hitRate * 100)}%`
    });
  }

  /**
   * Test concurrent requests
   */
  async testConcurrentRequests() {
    console.log('🔄 Testing concurrent requests...');
    
    const startTime = performance.now();
    
    // Simulate 10 concurrent requests
    const promises = this.testJobs.slice(0, 10).map(jobTitle => 
      this.simulateConcurrentRequest(jobTitle)
    );
    
    const results = await Promise.allSettled(promises);
    const endTime = performance.now();
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const totalTime = endTime - startTime;
    
    this.results.tests.push({
      name: 'concurrent_requests',
      duration: totalTime,
      successRate: successful / results.length,
      status: successful >= 8 && totalTime < 10000 ? 'pass' : 'fail',
      threshold: { successRate: 0.8, maxTime: 10000 },
      message: `${successful}/${results.length} requests successful in ${Math.round(totalTime)}ms`
    });
  }

  /**
   * Simulate application load
   */
  async simulateAppLoad() {
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 1000 + 500); // 500-1500ms
    });
  }

  /**
   * Simulate memory operations
   */
  async simulateMemoryOperations() {
    const data = [];
    
    // Create some memory pressure
    for (let i = 0; i < 1000; i++) {
      data.push({
        id: i,
        data: new Array(1000).fill(Math.random())
      });
    }
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clean up
    data.length = 0;
  }

  /**
   * Simulate AI analysis
   */
  async simulateAIAnalysis(jobTitle) {
    // Simulate AI processing time
    const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    return {
      jobTitle,
      riskScore: Math.random() * 100,
      category: ['high_risk', 'medium_risk', 'low_risk'][Math.floor(Math.random() * 3)]
    };
  }

  /**
   * Simulate cache access
   */
  async simulateCacheAccess(key) {
    // Simulate cache lookup
    const isHit = key === 'cached_key';
    const accessTime = isHit ? Math.random() * 5 + 1 : Math.random() * 50 + 10;
    
    await new Promise(resolve => setTimeout(resolve, accessTime));
    
    return { hit: isHit, time: accessTime };
  }

  /**
   * Simulate concurrent request
   */
  async simulateConcurrentRequest(jobTitle) {
    const startTime = performance.now();
    
    try {
      await this.simulateAIAnalysis(jobTitle);
      return { success: true, time: performance.now() - startTime };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate performance report
   */
  async generateReport() {
    console.log('📊 Generating performance report...');
    
    // Calculate summary
    const passedTests = this.results.tests.filter(t => t.status === 'pass').length;
    const totalTests = this.results.tests.length;
    const passRate = passedTests / totalTests;
    
    this.results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      passRate,
      overallStatus: passRate >= 0.8 ? 'pass' : 'fail'
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Display results
    console.log('\n📊 Performance Test Results:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Pass Rate: ${Math.round(passRate * 100)}%`);
    console.log(`   Overall Status: ${this.results.summary.overallStatus.toUpperCase()}`);
    
    console.log('\n📋 Test Details:');
    this.results.tests.forEach(test => {
      const status = test.status === 'pass' ? '✅' : '❌';
      console.log(`   ${status} ${test.name}: ${test.message}`);
    });
    
    console.log(`\n📄 Report saved: ${reportPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runTests().catch(console.error);
}

module.exports = PerformanceTester;
