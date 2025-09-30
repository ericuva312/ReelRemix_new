// Performance Optimization Configuration for ReelRemix

export const performanceConfig = {
  // Frontend Optimization
  frontend: {
    // Bundle optimization
    bundleOptimization: {
      codesplitting: true,
      lazyLoading: true,
      treeShaking: true,
      minification: true,
      compression: 'gzip',
      chunkSizeLimit: 250000, // 250KB
    },

    // Image optimization
    imageOptimization: {
      formats: ['webp', 'avif', 'jpg'],
      quality: 85,
      responsive: true,
      lazyLoading: true,
      placeholder: 'blur',
    },

    // Caching strategy
    caching: {
      staticAssets: '1y',
      apiResponses: '5m',
      userContent: '1h',
      analytics: '1d',
    },

    // Performance budgets
    budgets: {
      maxBundleSize: '500KB',
      maxImageSize: '200KB',
      maxFontSize: '100KB',
      firstContentfulPaint: '1.5s',
      largestContentfulPaint: '2.5s',
      cumulativeLayoutShift: 0.1,
    },
  },

  // Backend Optimization
  backend: {
    // Database optimization
    database: {
      connectionPooling: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
      },
      queryOptimization: {
        indexing: true,
        queryPlan: true,
        batchOperations: true,
        pagination: true,
      },
      caching: {
        redis: true,
        ttl: 300, // 5 minutes
        maxMemory: '256mb',
      },
    },

    // API optimization
    api: {
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per window
        standardHeaders: true,
        legacyHeaders: false,
      },
      compression: {
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          if (req.headers['x-no-compression']) return false
          return true
        },
      },
      responseOptimization: {
        etag: true,
        lastModified: true,
        conditionalRequests: true,
        streaming: true,
      },
    },

    // Queue optimization
    queues: {
      concurrency: {
        videoProcessing: 3,
        rendering: 5,
        analytics: 10,
      },
      retryStrategy: {
        attempts: 3,
        delay: 2000,
        backoff: 'exponential',
      },
      monitoring: {
        metrics: true,
        alerts: true,
        dashboard: true,
      },
    },
  },

  // AI Service Optimization
  aiService: {
    // Processing optimization
    processing: {
      batchSize: 5,
      parallelProcessing: true,
      resourceManagement: {
        maxMemory: '4GB',
        maxCpu: '2 cores',
        timeout: 300000, // 5 minutes
      },
      modelOptimization: {
        quantization: true,
        pruning: false,
        caching: true,
      },
    },

    // Video processing
    videoProcessing: {
      formats: ['mp4', 'webm'],
      quality: 'high',
      compression: 'h264',
      resolution: {
        max: '1920x1080',
        adaptive: true,
      },
      chunking: {
        enabled: true,
        size: '10MB',
        parallel: true,
      },
    },
  },

  // CDN and Storage Optimization
  storage: {
    // CDN configuration
    cdn: {
      provider: 'cloudflare',
      caching: {
        static: '1y',
        dynamic: '1h',
        api: '5m',
      },
      compression: true,
      minification: true,
      imageOptimization: true,
    },

    // File storage
    fileStorage: {
      provider: 's3',
      regions: ['us-east-1', 'eu-west-1'],
      storageClass: 'standard',
      lifecycle: {
        transitionToIA: 30, // days
        transitionToGlacier: 90, // days
        expiration: 365, // days
      },
    },
  },

  // Monitoring and Analytics
  monitoring: {
    // Performance monitoring
    performance: {
      realUserMonitoring: true,
      syntheticMonitoring: true,
      coreWebVitals: true,
      customMetrics: true,
    },

    // Error tracking
    errorTracking: {
      provider: 'sentry',
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
    },

    // Analytics
    analytics: {
      provider: 'google-analytics',
      customEvents: true,
      ecommerce: true,
      userTiming: true,
    },
  },

  // Security Optimization
  security: {
    // Headers
    headers: {
      contentSecurityPolicy: true,
      strictTransportSecurity: true,
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },

    // Authentication
    authentication: {
      jwtExpiration: '1h',
      refreshTokenExpiration: '7d',
      passwordHashing: 'bcrypt',
      rounds: 12,
    },

    // Rate limiting
    rateLimiting: {
      global: {
        windowMs: 15 * 60 * 1000,
        max: 1000,
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5,
      },
      api: {
        windowMs: 15 * 60 * 1000,
        max: 100,
      },
    },
  },
}

// Performance monitoring thresholds
export const performanceThresholds = {
  // Frontend thresholds
  frontend: {
    firstContentfulPaint: 1500, // ms
    largestContentfulPaint: 2500, // ms
    firstInputDelay: 100, // ms
    cumulativeLayoutShift: 0.1,
    timeToInteractive: 3000, // ms
  },

  // Backend thresholds
  backend: {
    apiResponseTime: 500, // ms
    databaseQueryTime: 100, // ms
    queueProcessingTime: 30000, // ms
    memoryUsage: 80, // percentage
    cpuUsage: 70, // percentage
  },

  // AI service thresholds
  aiService: {
    transcriptionTime: 60000, // ms per minute of video
    segmentationTime: 30000, // ms per minute of video
    renderingTime: 120000, // ms per minute of video
    memoryUsage: 85, // percentage
    gpuUsage: 90, // percentage
  },
}

// Optimization strategies
export const optimizationStrategies = {
  // Immediate optimizations (quick wins)
  immediate: [
    'Enable gzip compression',
    'Optimize images with WebP format',
    'Implement lazy loading for images',
    'Add browser caching headers',
    'Minify CSS and JavaScript',
    'Enable database query caching',
    'Implement API response caching',
    'Add CDN for static assets',
  ],

  // Short-term optimizations (1-2 weeks)
  shortTerm: [
    'Implement code splitting',
    'Add service worker for caching',
    'Optimize database queries',
    'Implement connection pooling',
    'Add Redis for session storage',
    'Optimize video processing pipeline',
    'Implement queue monitoring',
    'Add performance monitoring',
  ],

  // Long-term optimizations (1-3 months)
  longTerm: [
    'Implement micro-frontends',
    'Add edge computing for AI processing',
    'Implement database sharding',
    'Add multi-region deployment',
    'Implement advanced caching strategies',
    'Add machine learning for optimization',
    'Implement auto-scaling',
    'Add predictive performance monitoring',
  ],
}

// Performance testing configuration
export const performanceTesting = {
  // Load testing scenarios
  loadTesting: {
    scenarios: [
      {
        name: 'Normal Load',
        users: 100,
        duration: '10m',
        rampUp: '2m',
      },
      {
        name: 'Peak Load',
        users: 500,
        duration: '15m',
        rampUp: '5m',
      },
      {
        name: 'Stress Test',
        users: 1000,
        duration: '20m',
        rampUp: '10m',
      },
    ],
  },

  // Performance metrics to track
  metrics: [
    'response_time',
    'throughput',
    'error_rate',
    'cpu_usage',
    'memory_usage',
    'database_connections',
    'queue_size',
    'cache_hit_ratio',
  ],

  // Alerts and thresholds
  alerts: {
    responseTime: {
      warning: 1000, // ms
      critical: 2000, // ms
    },
    errorRate: {
      warning: 1, // percentage
      critical: 5, // percentage
    },
    cpuUsage: {
      warning: 70, // percentage
      critical: 85, // percentage
    },
    memoryUsage: {
      warning: 80, // percentage
      critical: 90, // percentage
    },
  },
}

export default performanceConfig
