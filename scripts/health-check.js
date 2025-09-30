#!/usr/bin/env node

/**
 * System Health Check Script for ReelRemix
 * Comprehensive health monitoring for all system components
 */

const axios = require('axios')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class HealthChecker {
  constructor() {
    this.results = []
    this.config = {
      timeout: 10000, // 10 seconds
      retries: 3,
      services: {
        frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
        api: process.env.API_URL || 'http://localhost:3001',
        aiService: process.env.AI_SERVICE_URL || 'http://localhost:8000',
        database: process.env.DATABASE_URL,
        redis: process.env.REDIS_URL
      }
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const emoji = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level]
    
    console.log(`${emoji} [${timestamp}] ${message}`)
  }

  async checkWithRetry(checkFn, name, retries = this.config.retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await checkFn()
        this.results.push({
          service: name,
          status: 'healthy',
          responseTime: result.responseTime || 0,
          details: result.details || '',
          timestamp: new Date().toISOString()
        })
        this.log(`${name}: Healthy (${result.responseTime || 0}ms)`, 'success')
        return true
      } catch (error) {
        if (attempt === retries) {
          this.results.push({
            service: name,
            status: 'unhealthy',
            error: error.message,
            attempts: attempt,
            timestamp: new Date().toISOString()
          })
          this.log(`${name}: Unhealthy - ${error.message}`, 'error')
          return false
        } else {
          this.log(`${name}: Attempt ${attempt} failed, retrying...`, 'warning')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
  }

  // Frontend health check
  async checkFrontend() {
    return this.checkWithRetry(async () => {
      const startTime = Date.now()
      const response = await axios.get(this.config.services.frontend, {
        timeout: this.config.timeout,
        validateStatus: (status) => status === 200
      })
      const responseTime = Date.now() - startTime
      
      // Check if it's actually the React app
      if (!response.data.includes('root') && !response.data.includes('React')) {
        throw new Error('Frontend response does not appear to be React app')
      }
      
      return { responseTime, details: 'React app loaded successfully' }
    }, 'Frontend')
  }

  // API health check
  async checkAPI() {
    return this.checkWithRetry(async () => {
      const startTime = Date.now()
      const response = await axios.get(`${this.config.services.api}/health`, {
        timeout: this.config.timeout
      })
      const responseTime = Date.now() - startTime
      
      if (response.data.status !== 'healthy') {
        throw new Error(`API health endpoint returned: ${response.data.status}`)
      }
      
      return { 
        responseTime, 
        details: `API version: ${response.data.version || 'unknown'}` 
      }
    }, 'API')
  }

  // AI Service health check
  async checkAIService() {
    return this.checkWithRetry(async () => {
      const startTime = Date.now()
      const response = await axios.get(`${this.config.services.aiService}/health`, {
        timeout: this.config.timeout
      })
      const responseTime = Date.now() - startTime
      
      return { 
        responseTime, 
        details: 'AI service responding' 
      }
    }, 'AI Service')
  }

  // Database health check
  async checkDatabase() {
    return this.checkWithRetry(async () => {
      const startTime = Date.now()
      
      try {
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()
        
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1 as health_check`
        await prisma.$disconnect()
        
        const responseTime = Date.now() - startTime
        return { responseTime, details: 'Database connection successful' }
      } catch (error) {
        throw new Error(`Database connection failed: ${error.message}`)
      }
    }, 'Database')
  }

  // Redis health check
  async checkRedis() {
    return this.checkWithRetry(async () => {
      const startTime = Date.now()
      
      try {
        const redis = require('redis')
        const client = redis.createClient({ url: this.config.services.redis })
        
        await client.connect()
        const pong = await client.ping()
        await client.disconnect()
        
        if (pong !== 'PONG') {
          throw new Error('Redis ping failed')
        }
        
        const responseTime = Date.now() - startTime
        return { responseTime, details: 'Redis connection successful' }
      } catch (error) {
        throw new Error(`Redis connection failed: ${error.message}`)
      }
    }, 'Redis')
  }

  // System resources check
  async checkSystemResources() {
    return this.checkWithRetry(async () => {
      const startTime = Date.now()
      
      try {
        // Check disk space
        const diskUsage = execSync('df -h /', { encoding: 'utf8' })
        const diskLines = diskUsage.split('\n')[1].split(/\s+/)
        const diskUsedPercent = parseInt(diskLines[4].replace('%', ''))
        
        // Check memory usage
        const memInfo = execSync('free -m', { encoding: 'utf8' })
        const memLines = memInfo.split('\n')[1].split(/\s+/)
        const totalMem = parseInt(memLines[1])
        const usedMem = parseInt(memLines[2])
        const memUsedPercent = Math.round((usedMem / totalMem) * 100)
        
        // Check CPU load
        const loadAvg = execSync('uptime', { encoding: 'utf8' })
        const loadMatch = loadAvg.match(/load average: ([\d.]+)/)
        const cpuLoad = loadMatch ? parseFloat(loadMatch[1]) : 0
        
        const responseTime = Date.now() - startTime
        const details = `Disk: ${diskUsedPercent}%, Memory: ${memUsedPercent}%, CPU Load: ${cpuLoad}`
        
        // Warning thresholds
        if (diskUsedPercent > 85) {
          throw new Error(`High disk usage: ${diskUsedPercent}%`)
        }
        if (memUsedPercent > 90) {
          throw new Error(`High memory usage: ${memUsedPercent}%`)
        }
        if (cpuLoad > 4) {
          throw new Error(`High CPU load: ${cpuLoad}`)
        }
        
        return { responseTime, details }
      } catch (error) {
        throw new Error(`System resources check failed: ${error.message}`)
      }
    }, 'System Resources')
  }

  // External services check
  async checkExternalServices() {
    const checks = []
    
    // Stripe API check
    if (process.env.STRIPE_SECRET_KEY) {
      checks.push(this.checkWithRetry(async () => {
        const startTime = Date.now()
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        await stripe.accounts.retrieve()
        const responseTime = Date.now() - startTime
        return { responseTime, details: 'Stripe API accessible' }
      }, 'Stripe API'))
    }
    
    // OpenAI API check
    if (process.env.OPENAI_API_KEY) {
      checks.push(this.checkWithRetry(async () => {
        const startTime = Date.now()
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          timeout: this.config.timeout
        })
        const responseTime = Date.now() - startTime
        return { responseTime, details: 'OpenAI API accessible' }
      }, 'OpenAI API'))
    }
    
    // AWS S3 check
    if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET) {
      checks.push(this.checkWithRetry(async () => {
        const startTime = Date.now()
        const AWS = require('aws-sdk')
        const s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION
        })
        await s3.headBucket({ Bucket: process.env.S3_BUCKET }).promise()
        const responseTime = Date.now() - startTime
        return { responseTime, details: 'S3 bucket accessible' }
      }, 'AWS S3'))
    }
    
    await Promise.all(checks)
  }

  // Queue health check
  async checkQueues() {
    return this.checkWithRetry(async () => {
      const startTime = Date.now()
      
      try {
        // Check if queues are accessible and get stats
        const response = await axios.get(`${this.config.services.api}/api/monitoring/queues`, {
          timeout: this.config.timeout
        })
        
        const queueStats = response.data
        let details = 'Queues accessible'
        
        // Check for queue backlogs
        if (queueStats.videoProcessing && queueStats.videoProcessing.waiting > 100) {
          throw new Error(`Video processing queue backlog: ${queueStats.videoProcessing.waiting} jobs`)
        }
        
        if (queueStats.rendering && queueStats.rendering.waiting > 50) {
          throw new Error(`Rendering queue backlog: ${queueStats.rendering.waiting} jobs`)
        }
        
        const responseTime = Date.now() - startTime
        return { responseTime, details }
      } catch (error) {
        if (error.response?.status === 404) {
          // Queue monitoring endpoint might not be implemented yet
          return { responseTime: 0, details: 'Queue monitoring not available' }
        }
        throw error
      }
    }, 'Queues')
  }

  // SSL certificate check
  async checkSSLCertificate() {
    if (!this.config.services.frontend.startsWith('https://')) {
      this.log('SSL check skipped (not HTTPS)', 'debug')
      return true
    }
    
    return this.checkWithRetry(async () => {
      const startTime = Date.now()
      const https = require('https')
      const url = require('url')
      
      const parsedUrl = url.parse(this.config.services.frontend)
      
      return new Promise((resolve, reject) => {
        const options = {
          hostname: parsedUrl.hostname,
          port: 443,
          method: 'GET',
          timeout: this.config.timeout
        }
        
        const req = https.request(options, (res) => {
          const cert = res.connection.getPeerCertificate()
          const now = new Date()
          const expiry = new Date(cert.valid_to)
          const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24))
          
          if (daysUntilExpiry < 30) {
            reject(new Error(`SSL certificate expires in ${daysUntilExpiry} days`))
          } else {
            const responseTime = Date.now() - startTime
            resolve({ 
              responseTime, 
              details: `SSL certificate valid until ${expiry.toDateString()}` 
            })
          }
        })
        
        req.on('error', reject)
        req.on('timeout', () => reject(new Error('SSL check timeout')))
        req.end()
      })
    }, 'SSL Certificate')
  }

  // Generate health report
  generateReport() {
    const healthyServices = this.results.filter(r => r.status === 'healthy').length
    const totalServices = this.results.length
    const overallHealth = healthyServices === totalServices ? 'healthy' : 'degraded'
    
    const report = {
      timestamp: new Date().toISOString(),
      overallHealth,
      summary: {
        total: totalServices,
        healthy: healthyServices,
        unhealthy: totalServices - healthyServices,
        healthPercentage: Math.round((healthyServices / totalServices) * 100)
      },
      services: this.results,
      environment: process.env.NODE_ENV || 'development'
    }
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'health-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    return report
  }

  // Print summary
  printSummary() {
    const healthyServices = this.results.filter(r => r.status === 'healthy').length
    const totalServices = this.results.length
    const healthPercentage = Math.round((healthyServices / totalServices) * 100)
    
    console.log('\n' + '='.repeat(60))
    console.log('SYSTEM HEALTH CHECK SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`Overall Health: ${healthPercentage}% (${healthyServices}/${totalServices} services healthy)`)
    
    if (healthPercentage === 100) {
      console.log('🎉 All systems operational!')
    } else if (healthPercentage >= 80) {
      console.log('⚠️  Some services degraded')
    } else {
      console.log('🚨 System experiencing issues')
    }
    
    console.log('\nService Status:')
    this.results.forEach(result => {
      const status = result.status === 'healthy' ? '✅' : '❌'
      const time = result.responseTime ? `(${result.responseTime}ms)` : ''
      console.log(`  ${status} ${result.service} ${time}`)
      if (result.error) {
        console.log(`      Error: ${result.error}`)
      }
      if (result.details) {
        console.log(`      Details: ${result.details}`)
      }
    })
    
    console.log('\n' + '='.repeat(60))
  }

  // Run all health checks
  async runAllChecks() {
    this.log('Starting ReelRemix health check...\n')
    
    const checks = [
      () => this.checkFrontend(),
      () => this.checkAPI(),
      () => this.checkAIService(),
      () => this.checkDatabase(),
      () => this.checkRedis(),
      () => this.checkSystemResources(),
      () => this.checkExternalServices(),
      () => this.checkQueues(),
      () => this.checkSSLCertificate()
    ]
    
    // Run checks in parallel for faster execution
    await Promise.allSettled(checks.map(check => check()))
    
    const report = this.generateReport()
    this.printSummary()
    
    return report
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  const checker = new HealthChecker()
  checker.runAllChecks()
    .then(report => {
      const exitCode = report.summary.healthPercentage === 100 ? 0 : 1
      process.exit(exitCode)
    })
    .catch(error => {
      console.error('Health check failed:', error)
      process.exit(1)
    })
}

module.exports = HealthChecker
