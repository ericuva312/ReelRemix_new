import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import { redisClient } from '../utils/redis'

const prisma = new PrismaClient()

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    database: ServiceStatus
    redis: ServiceStatus
    storage: ServiceStatus
    ai: ServiceStatus
  }
  metrics: {
    uptime: number
    memoryUsage: number
    cpuUsage: number
    activeConnections: number
  }
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  lastCheck: Date
  error?: string
}

export interface PerformanceMetrics {
  processingQueue: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
  averageProcessingTime: number
  errorRate: number
  throughput: number
}

export interface AlertConfig {
  type: 'error_rate' | 'response_time' | 'queue_size' | 'system_health'
  threshold: number
  enabled: boolean
  recipients: string[]
}

export class MonitoringService {
  private static alerts: AlertConfig[] = [
    {
      type: 'error_rate',
      threshold: 5, // 5% error rate
      enabled: true,
      recipients: ['admin@reelremix.com'],
    },
    {
      type: 'response_time',
      threshold: 5000, // 5 seconds
      enabled: true,
      recipients: ['admin@reelremix.com'],
    },
    {
      type: 'queue_size',
      threshold: 100, // 100 pending jobs
      enabled: true,
      recipients: ['admin@reelremix.com'],
    },
  ]

  /**
   * Check overall system health
   */
  static async checkSystemHealth(): Promise<SystemHealth> {
    try {
      const [database, redis, storage, ai] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkStorageHealth(),
        this.checkAIServiceHealth(),
      ])

      const services = { database, redis, storage, ai }
      
      // Determine overall status
      const statuses = Object.values(services).map(s => s.status)
      let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
      
      if (statuses.includes('down')) {
        overallStatus = 'down'
      } else if (statuses.includes('degraded')) {
        overallStatus = 'degraded'
      }

      const metrics = await this.getSystemMetrics()

      const health: SystemHealth = {
        status: overallStatus,
        services,
        metrics,
      }

      // Store health check result
      await this.storeHealthCheck(health)

      return health
    } catch (error) {
      logger.error('Failed to check system health', { error })
      throw error
    }
  }

  /**
   * Check database health
   */
  private static async checkDatabaseHealth(): Promise<ServiceStatus> {
    const startTime = Date.now()
    
    try {
      await prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - startTime

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(),
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check Redis health
   */
  private static async checkRedisHealth(): Promise<ServiceStatus> {
    const startTime = Date.now()
    
    try {
      await redisClient.ping()
      const responseTime = Date.now() - startTime

      return {
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(),
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check storage health
   */
  private static async checkStorageHealth(): Promise<ServiceStatus> {
    const startTime = Date.now()
    
    try {
      // Simple storage check - could be expanded based on storage provider
      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date(),
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check AI service health
   */
  private static async checkAIServiceHealth(): Promise<ServiceStatus> {
    const startTime = Date.now()
    
    try {
      // Health check for Python AI service
      const response = await fetch(`${process.env.AI_SERVICE_URL}/health`)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        return {
          status: responseTime < 2000 ? 'healthy' : 'degraded',
          responseTime,
          lastCheck: new Date(),
        }
      } else {
        return {
          status: 'degraded',
          responseTime,
          lastCheck: new Date(),
          error: `HTTP ${response.status}`,
        }
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get system metrics
   */
  private static async getSystemMetrics(): Promise<SystemHealth['metrics']> {
    const memoryUsage = process.memoryUsage()
    
    return {
      uptime: process.uptime(),
      memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
      cpuUsage: 0, // Would need additional monitoring for accurate CPU usage
      activeConnections: 0, // Would track active database/Redis connections
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      // Get queue statistics
      const queueStats = await this.getQueueStatistics()
      
      // Calculate average processing time
      const avgProcessingTime = await this.getAverageProcessingTime()
      
      // Calculate error rate
      const errorRate = await this.getErrorRate()
      
      // Calculate throughput
      const throughput = await this.getThroughput()

      return {
        processingQueue: queueStats,
        averageProcessingTime: avgProcessingTime,
        errorRate,
        throughput,
      }
    } catch (error) {
      logger.error('Failed to get performance metrics', { error })
      throw error
    }
  }

  /**
   * Get queue statistics
   */
  private static async getQueueStatistics(): Promise<PerformanceMetrics['processingQueue']> {
    try {
      // This would integrate with BullMQ to get actual queue stats
      // For now, returning mock data
      return {
        pending: 5,
        processing: 2,
        completed: 150,
        failed: 3,
      }
    } catch (error) {
      logger.error('Failed to get queue statistics', { error })
      return { pending: 0, processing: 0, completed: 0, failed: 0 }
    }
  }

  /**
   * Get average processing time
   */
  private static async getAverageProcessingTime(): Promise<number> {
    try {
      const result = await prisma.project.aggregate({
        where: {
          status: 'completed',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
        _avg: { processingTimeSeconds: true },
      })

      return result._avg.processingTimeSeconds || 0
    } catch (error) {
      logger.error('Failed to get average processing time', { error })
      return 0
    }
  }

  /**
   * Get error rate
   */
  private static async getErrorRate(): Promise<number> {
    try {
      const [total, failed] = await Promise.all([
        prisma.project.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.project.count({
          where: {
            status: 'failed',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ])

      return total > 0 ? (failed / total) * 100 : 0
    } catch (error) {
      logger.error('Failed to get error rate', { error })
      return 0
    }
  }

  /**
   * Get throughput (projects per hour)
   */
  private static async getThroughput(): Promise<number> {
    try {
      const completed = await prisma.project.count({
        where: {
          status: 'completed',
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        },
      })

      return completed
    } catch (error) {
      logger.error('Failed to get throughput', { error })
      return 0
    }
  }

  /**
   * Store health check result
   */
  private static async storeHealthCheck(health: SystemHealth): Promise<void> {
    try {
      await prisma.healthCheck.create({
        data: {
          status: health.status,
          services: health.services,
          metrics: health.metrics,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      logger.error('Failed to store health check', { error })
    }
  }

  /**
   * Check alerts and send notifications
   */
  static async checkAlerts(): Promise<void> {
    try {
      const metrics = await this.getPerformanceMetrics()
      const health = await this.checkSystemHealth()

      for (const alert of this.alerts) {
        if (!alert.enabled) continue

        let shouldAlert = false
        let message = ''

        switch (alert.type) {
          case 'error_rate':
            if (metrics.errorRate > alert.threshold) {
              shouldAlert = true
              message = `Error rate is ${metrics.errorRate.toFixed(2)}%, exceeding threshold of ${alert.threshold}%`
            }
            break

          case 'response_time':
            const avgResponseTime = Object.values(health.services)
              .reduce((sum, service) => sum + service.responseTime, 0) / Object.keys(health.services).length
            
            if (avgResponseTime > alert.threshold) {
              shouldAlert = true
              message = `Average response time is ${avgResponseTime}ms, exceeding threshold of ${alert.threshold}ms`
            }
            break

          case 'queue_size':
            if (metrics.processingQueue.pending > alert.threshold) {
              shouldAlert = true
              message = `Queue has ${metrics.processingQueue.pending} pending jobs, exceeding threshold of ${alert.threshold}`
            }
            break

          case 'system_health':
            if (health.status !== 'healthy') {
              shouldAlert = true
              message = `System health is ${health.status}`
            }
            break
        }

        if (shouldAlert) {
          await this.sendAlert(alert, message)
        }
      }
    } catch (error) {
      logger.error('Failed to check alerts', { error })
    }
  }

  /**
   * Send alert notification
   */
  private static async sendAlert(alert: AlertConfig, message: string): Promise<void> {
    try {
      logger.warn('Alert triggered', { type: alert.type, message })

      // Store alert in database
      await prisma.alert.create({
        data: {
          type: alert.type,
          message,
          threshold: alert.threshold,
          timestamp: new Date(),
        },
      })

      // TODO: Send email/Slack notification to recipients
      // This would integrate with your notification service
    } catch (error) {
      logger.error('Failed to send alert', { error, alert, message })
    }
  }

  /**
   * Get system status for status page
   */
  static async getSystemStatus(): Promise<{
    status: string
    uptime: number
    services: Array<{ name: string; status: string; responseTime: number }>
    incidents: Array<{ title: string; status: string; timestamp: Date }>
  }> {
    try {
      const health = await this.checkSystemHealth()
      
      const services = Object.entries(health.services).map(([name, service]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        status: service.status,
        responseTime: service.responseTime,
      }))

      // Get recent incidents
      const incidents = await prisma.alert.findMany({
        where: {
          timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          type: true,
          message: true,
          timestamp: true,
        },
      })

      return {
        status: health.status,
        uptime: health.metrics.uptime,
        services,
        incidents: incidents.map(incident => ({
          title: incident.type.replace('_', ' ').toUpperCase(),
          status: 'resolved', // Simplified
          timestamp: incident.timestamp,
        })),
      }
    } catch (error) {
      logger.error('Failed to get system status', { error })
      throw error
    }
  }

  /**
   * Start monitoring (run periodically)
   */
  static startMonitoring(): void {
    // Health check every 5 minutes
    setInterval(async () => {
      try {
        await this.checkSystemHealth()
      } catch (error) {
        logger.error('Health check failed', { error })
      }
    }, 5 * 60 * 1000)

    // Alert check every minute
    setInterval(async () => {
      try {
        await this.checkAlerts()
      } catch (error) {
        logger.error('Alert check failed', { error })
      }
    }, 60 * 1000)

    logger.info('Monitoring started')
  }
}

export default MonitoringService
