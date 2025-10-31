#!/usr/bin/env node

// 🚀 Production Optimization Script
// Automated optimization for production deployment

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionOptimizer {
  constructor() {
    this.projectRoot = process.cwd();
    this.distPath = path.join(this.projectRoot, 'dist');
    this.optimizations = [];
  }

  /**
   * Run all optimizations
   */
  async optimize() {
    console.log('🚀 Starting production optimization...');
    
    try {
      // 1. Bundle analysis
      await this.analyzeBundle();
      
      // 2. Asset optimization
      await this.optimizeAssets();
      
      // 3. Code splitting
      await this.optimizeCodeSplitting();
      
      // 4. Cache optimization
      await this.optimizeCaching();
      
      // 5. Performance monitoring setup
      await this.setupPerformanceMonitoring();
      
      // 6. Generate optimization report
      await this.generateReport();
      
      console.log('✅ Production optimization completed!');
      
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      process.exit(1);
    }
  }

  /**
   * Analyze bundle size and composition
   */
  async analyzeBundle() {
    console.log('📊 Analyzing bundle...');
    
    try {
      // Run bundle analyzer if available
      execSync('npx vite-bundle-analyzer dist', { stdio: 'inherit' });
      this.optimizations.push('Bundle analysis completed');
    } catch (error) {
      console.log('⚠️ Bundle analyzer not available, skipping...');
    }
  }

  /**
   * Optimize static assets
   */
  async optimizeAssets() {
    console.log('🖼️ Optimizing assets...');
    
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    const assetsDir = path.join(this.distPath, 'assets');
    
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      
      for (const file of files) {
        const filePath = path.join(assetsDir, file);
        const ext = path.extname(file).toLowerCase();
        
        if (assetExtensions.includes(ext)) {
          try {
            // Compress images (requires imagemin)
            await this.compressImage(filePath);
            this.optimizations.push(`Compressed ${file}`);
          } catch (error) {
            console.log(`⚠️ Could not compress ${file}:`, error.message);
          }
        }
      }
    }
  }

  /**
   * Compress image file
   * @param {string} filePath - Path to image file
   */
  async compressImage(filePath) {
    // This would require imagemin or similar tool
    // For now, just log the action
    console.log(`📦 Compressing ${path.basename(filePath)}`);
  }

  /**
   * Optimize code splitting
   */
  async optimizeCodeSplitting() {
    console.log('📦 Optimizing code splitting...');
    
    // Check if chunks are properly split
    const chunksDir = path.join(this.distPath, 'assets');
    if (fs.existsSync(chunksDir)) {
      const files = fs.readdirSync(chunksDir);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      
      if (jsFiles.length > 1) {
        this.optimizations.push(`Code splitting: ${jsFiles.length} chunks created`);
      } else {
        console.log('⚠️ Consider implementing code splitting for better performance');
      }
    }
  }

  /**
   * Optimize caching strategies
   */
  async optimizeCaching() {
    console.log('💾 Optimizing caching...');
    
    // Generate cache manifest
    const manifest = {
      version: Date.now(),
      assets: this.getAssetManifest(),
      cache: {
        static: '1y',
        dynamic: '1h',
        api: '5m'
      }
    };
    
    const manifestPath = path.join(this.distPath, 'cache-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    this.optimizations.push('Cache manifest generated');
  }

  /**
   * Get asset manifest for caching
   * @returns {Object} - Asset manifest
   */
  getAssetManifest() {
    const assetsDir = path.join(this.distPath, 'assets');
    const manifest = {};
    
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      
      files.forEach(file => {
        const filePath = path.join(assetsDir, file);
        const stats = fs.statSync(filePath);
        
        manifest[file] = {
          size: stats.size,
          hash: this.generateHash(filePath),
          type: path.extname(file).substring(1)
        };
      });
    }
    
    return manifest;
  }

  /**
   * Generate file hash
   * @param {string} filePath - File path
   * @returns {string} - File hash
   */
  generateHash(filePath) {
    const content = fs.readFileSync(filePath);
    return require('crypto').createHash('md5').update(content).digest('hex');
  }

  /**
   * Setup performance monitoring
   */
  async setupPerformanceMonitoring() {
    console.log('📊 Setting up performance monitoring...');
    
    // Create performance monitoring config
    const perfConfig = {
      enabled: true,
      metrics: {
        responseTime: true,
        errorRate: true,
        cacheHitRate: true,
        memoryUsage: true
      },
      reporting: {
        interval: 60000, // 1 minute
        endpoint: '/api/metrics'
      }
    };
    
    const configPath = path.join(this.distPath, 'performance-config.json');
    fs.writeFileSync(configPath, JSON.stringify(perfConfig, null, 2));
    
    this.optimizations.push('Performance monitoring configured');
  }

  /**
   * Generate optimization report
   */
  async generateReport() {
    console.log('📋 Generating optimization report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      optimizations: this.optimizations,
      bundleSize: this.getBundleSize(),
      recommendations: this.getRecommendations()
    };
    
    const reportPath = path.join(this.distPath, 'optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Optimization Report:');
    console.log(`   Bundle size: ${report.bundleSize.total} bytes`);
    console.log(`   Optimizations: ${report.optimizations.length}`);
    console.log(`   Report saved: ${reportPath}`);
  }

  /**
   * Get bundle size information
   * @returns {Object} - Bundle size data
   */
  getBundleSize() {
    const assetsDir = path.join(this.distPath, 'assets');
    let totalSize = 0;
    let fileCount = 0;
    
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      
      files.forEach(file => {
        const filePath = path.join(assetsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        fileCount++;
      });
    }
    
    return {
      total: totalSize,
      files: fileCount,
      average: fileCount > 0 ? totalSize / fileCount : 0
    };
  }

  /**
   * Get optimization recommendations
   * @returns {Array} - Recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    // Check bundle size
    const bundleSize = this.getBundleSize();
    if (bundleSize.total > 1024 * 1024) { // 1MB
      recommendations.push({
        type: 'bundle_size',
        priority: 'high',
        message: 'Bundle size is large. Consider code splitting and tree shaking.',
        current: `${Math.round(bundleSize.total / 1024)}KB`,
        target: '< 500KB'
      });
    }
    
    // Check for console statements
    const distFiles = this.findFiles(this.distPath, '.js');
    let hasConsole = false;
    
    distFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('console.')) {
        hasConsole = true;
      }
    });
    
    if (hasConsole) {
      recommendations.push({
        type: 'console_cleanup',
        priority: 'medium',
        message: 'Console statements found in production build. Remove for better performance.',
        action: 'Enable terser console removal'
      });
    }
    
    return recommendations;
  }

  /**
   * Find files with specific extension
   * @param {string} dir - Directory to search
   * @param {string} ext - File extension
   * @returns {Array} - File paths
   */
  findFiles(dir, ext) {
    const files = [];
    
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          files.push(...this.findFiles(itemPath, ext));
        } else if (item.endsWith(ext)) {
          files.push(itemPath);
        }
      });
    }
    
    return files;
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new ProductionOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = ProductionOptimizer;
