#!/usr/bin/env node

/**
 * Configuration Validation Script for ReelRemix
 * Validates all environment variables, service connections, and configuration settings
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { execSync } = require('child_process')

class ConfigValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.checks = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type]
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  addError(message) {
    this.errors.push(message)
    this.log(message, 'error')
  }

  addWarning(message) {
    this.warnings.push(message)
    this.log(message, 'warning')
  }

  addCheck(name, status, details = '') {
    this.checks.push({ name, status, details })
    this.log(`${name}: ${status}${details ? ` - ${details}` : ''}`, status === 'PASS' ? 'success' : 'error')
  }

  // Environment variable validation
  validateEnvironmentVariables() {
    this.log('Validating environment variables...')
    
    const requiredVars = {
      // Database
      DATABASE_URL: 'PostgreSQL connection string',
      REDIS_URL: 'Redis connection string',
      
      // Authentication
      JWT_SECRET: 'JWT signing secret (min 32 chars)',
      JWT_EXPIRES_IN: 'JWT expiration time',
      
      // Payment
      STRIPE_SECRET_KEY: 'Stripe secret key',
      STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key',
      STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
      
      // AI Services
      OPENAI_API_KEY: 'OpenAI API key',
      
      // Storage
      AWS_ACCESS_KEY_ID: 'AWS access key',
      AWS_SECRET_ACCESS_KEY: 'AWS secret key',
      AWS_REGION: 'AWS region',
      S3_BUCKET: 'S3 bucket name',
      
      // Application
      NODE_ENV: 'Environment (development/staging/production)',
      FRONTEND_URL: 'Frontend application URL',
      API_URL: 'Backend API URL',
    }

    const optionalVars = {
      // Monitoring
      DATADOG_API_KEY: 'DataDog API key',
      SENTRY_DSN: 'Sentry error tracking DSN',
      
      // Email
      SENDGRID_API_KEY: 'SendGrid email API key',
      
      // Analytics
      GOOGLE_ANALYTICS_ID: 'Google Analytics tracking ID',
    }

    // Check required variables
    for (const [varName, description] of Object.entries(requiredVars)) {
      const value = process.env[varName]
      if (!value) {
        this.addError(`Missing required environment variable: ${varName} (${description})`)
      } else {
        // Validate specific formats
        if (varName === 'JWT_SECRET' && value.length < 32) {
          this.addError(`JWT_SECRET must be at least 32 characters long`)
        } else if (varName === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
          this.addError(`DATABASE_URL must be a valid PostgreSQL connection string`)
        } else if (varName === 'REDIS_URL' && !value.startsWith('redis://')) {
          this.addError(`REDIS_URL must be a valid Redis connection string`)
        } else {
          this.addCheck(`Environment variable ${varName}`, 'PASS')
        }
      }
    }

    // Check optional variables
    for (const [varName, description] of Object.entries(optionalVars)) {
      const value = process.env[varName]
      if (!value) {
        this.addWarning(`Optional environment variable not set: ${varName} (${description})`)
      } else {
        this.addCheck(`Optional environment variable ${varName}`, 'PASS')
      }
    }
  }

  // Database connectivity validation
  async validateDatabaseConnection() {
    this.log('Validating database connection...')
    
    try {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1`
      await prisma.$disconnect()
      
      this.addCheck('Database connection', 'PASS')
    } catch (error) {
      this.addError(`Database connection failed: ${error.message}`)
    }
  }

  // Redis connectivity validation
  async validateRedisConnection() {
    this.log('Validating Redis connection...')
    
    try {
      const redis = require('redis')
      const client = redis.createClient({ url: process.env.REDIS_URL })
      
      await client.connect()
      await client.ping()
      await client.disconnect()
      
      this.addCheck('Redis connection', 'PASS')
    } catch (error) {
      this.addError(`Redis connection failed: ${error.message}`)
    }
  }

  // External service validation
  async validateExternalServices() {
    this.log('Validating external services...')
    
    // Stripe validation
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        await stripe.accounts.retrieve()
        this.addCheck('Stripe API connection', 'PASS')
      } catch (error) {
        this.addError(`Stripe API validation failed: ${error.message}`)
      }
    }

    // OpenAI validation
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
        })
        this.addCheck('OpenAI API connection', 'PASS')
      } catch (error) {
        this.addError(`OpenAI API validation failed: ${error.message}`)
      }
    }

    // AWS S3 validation
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const AWS = require('aws-sdk')
        const s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION
        })
        
        await s3.headBucket({ Bucket: process.env.S3_BUCKET }).promise()
        this.addCheck('AWS S3 connection', 'PASS')
      } catch (error) {
        this.addError(`AWS S3 validation failed: ${error.message}`)
      }
    }
  }

  // File system validation
  validateFileSystem() {
    this.log('Validating file system...')
    
    const requiredDirs = [
      'apps/web/dist',
      'apps/worker/dist',
      'uploads',
      'temp',
      'logs'
    ]

    for (const dir of requiredDirs) {
      const fullPath = path.join(process.cwd(), dir)
      if (!fs.existsSync(fullPath)) {
        try {
          fs.mkdirSync(fullPath, { recursive: true })
          this.addCheck(`Directory ${dir}`, 'PASS', 'created')
        } catch (error) {
          this.addError(`Failed to create directory ${dir}: ${error.message}`)
        }
      } else {
        this.addCheck(`Directory ${dir}`, 'PASS', 'exists')
      }
    }

    // Check write permissions
    const testFile = path.join(process.cwd(), 'temp', 'write-test.txt')
    try {
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      this.addCheck('File system write permissions', 'PASS')
    } catch (error) {
      this.addError(`File system write test failed: ${error.message}`)
    }
  }

  // Package dependencies validation
  validateDependencies() {
    this.log('Validating package dependencies...')
    
    const packagePaths = [
      'package.json',
      'apps/web/package.json',
      'apps/worker/package.json',
      'apps/python/requirements.txt'
    ]

    for (const packagePath of packagePaths) {
      const fullPath = path.join(process.cwd(), packagePath)
      if (fs.existsSync(fullPath)) {
        this.addCheck(`Package file ${packagePath}`, 'PASS')
        
        // Check if node_modules exists for JS packages
        if (packagePath.endsWith('package.json')) {
          const nodeModulesPath = path.join(path.dirname(fullPath), 'node_modules')
          if (fs.existsSync(nodeModulesPath)) {
            this.addCheck(`Dependencies installed for ${packagePath}`, 'PASS')
          } else {
            this.addWarning(`Dependencies not installed for ${packagePath}`)
          }
        }
      } else {
        this.addError(`Missing package file: ${packagePath}`)
      }
    }
  }

  // Security configuration validation
  validateSecurity() {
    this.log('Validating security configuration...')
    
    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET
    if (jwtSecret) {
      if (jwtSecret.length < 32) {
        this.addError('JWT_SECRET is too short (minimum 32 characters)')
      } else if (jwtSecret === 'your-secret-key' || jwtSecret === 'secret') {
        this.addError('JWT_SECRET is using a default/weak value')
      } else {
        this.addCheck('JWT secret strength', 'PASS')
      }
    }

    // Check for production environment settings
    if (process.env.NODE_ENV === 'production') {
      const productionChecks = [
        { var: 'DATABASE_URL', check: (val) => !val.includes('localhost') },
        { var: 'REDIS_URL', check: (val) => !val.includes('localhost') },
        { var: 'FRONTEND_URL', check: (val) => val.startsWith('https://') },
        { var: 'API_URL', check: (val) => val.startsWith('https://') }
      ]

      for (const { var: varName, check } of productionChecks) {
        const value = process.env[varName]
        if (value && check(value)) {
          this.addCheck(`Production setting ${varName}`, 'PASS')
        } else {
          this.addWarning(`${varName} may not be configured for production`)
        }
      }
    }
  }

  // Performance configuration validation
  validatePerformance() {
    this.log('Validating performance configuration...')
    
    // Check if build files exist
    const buildFiles = [
      'apps/web/dist/index.html',
      'apps/worker/dist/index.js'
    ]

    for (const buildFile of buildFiles) {
      const fullPath = path.join(process.cwd(), buildFile)
      if (fs.existsSync(fullPath)) {
        this.addCheck(`Build file ${buildFile}`, 'PASS')
      } else {
        this.addWarning(`Build file missing: ${buildFile}`)
      }
    }

    // Check for optimization settings
    if (process.env.NODE_ENV === 'production') {
      // Check if gzip compression is available
      try {
        require('compression')
        this.addCheck('Compression middleware available', 'PASS')
      } catch (error) {
        this.addWarning('Compression middleware not available')
      }
    }
  }

  // Generate configuration report
  generateReport() {
    this.log('Generating configuration report...')
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      summary: {
        totalChecks: this.checks.length,
        passed: this.checks.filter(c => c.status === 'PASS').length,
        failed: this.checks.filter(c => c.status === 'FAIL').length,
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      checks: this.checks,
      errors: this.errors,
      warnings: this.warnings
    }

    // Write report to file
    const reportPath = path.join(process.cwd(), 'config-validation-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    this.log(`Configuration report saved to: ${reportPath}`)
    return report
  }

  // Print summary
  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('CONFIGURATION VALIDATION SUMMARY')
    console.log('='.repeat(60))
    
    const passed = this.checks.filter(c => c.status === 'PASS').length
    const failed = this.checks.filter(c => c.status === 'FAIL').length
    
    console.log(`Total Checks: ${this.checks.length}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  Warnings: ${this.warnings.length}`)
    console.log(`🚨 Errors: ${this.errors.length}`)
    
    if (this.errors.length === 0 && failed === 0) {
      console.log('\n🎉 All critical validations passed! Ready for deployment.')
    } else {
      console.log('\n🚨 Critical issues found. Please resolve before deployment.')
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings (recommended to address):')
      this.warnings.forEach(warning => console.log(`   - ${warning}`))
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors (must be resolved):')
      this.errors.forEach(error => console.log(`   - ${error}`))
    }
    
    console.log('\n' + '='.repeat(60))
  }

  // Run all validations
  async runAllValidations() {
    this.log('Starting ReelRemix configuration validation...\n')
    
    try {
      this.validateEnvironmentVariables()
      await this.validateDatabaseConnection()
      await this.validateRedisConnection()
      await this.validateExternalServices()
      this.validateFileSystem()
      this.validateDependencies()
      this.validateSecurity()
      this.validatePerformance()
      
      const report = this.generateReport()
      this.printSummary()
      
      return {
        success: this.errors.length === 0,
        report
      }
    } catch (error) {
      this.addError(`Validation process failed: ${error.message}`)
      this.printSummary()
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new ConfigValidator()
  validator.runAllValidations()
    .then(result => {
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Validation failed:', error)
      process.exit(1)
    })
}

module.exports = ConfigValidator
