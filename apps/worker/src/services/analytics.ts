import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export interface AnalyticsEvent {
  userId?: string
  sessionId?: string
  event: string
  properties?: Record<string, any>
  timestamp?: Date
}

export interface UserMetrics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  churnRate: number
}

export interface ContentMetrics {
  totalVideosProcessed: number
  totalClipsGenerated: number
  avgClipsPerVideo: number
  totalViews: number
  avgEngagementRate: number
}

export interface RevenueMetrics {
  mrr: number
  arr: number
  totalRevenue: number
  avgRevenuePerUser: number
  churnRate: number
}

export interface PlatformMetrics {
  [platform: string]: {
    clips: number
    views: number
    engagement: number
  }
}

export class AnalyticsService {
  /**
   * Track an analytics event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: event.userId,
          sessionId: event.sessionId,
          event: event.event,
          properties: event.properties || {},
          timestamp: event.timestamp || new Date(),
        },
      })

      logger.info('Analytics event tracked', { 
        event: event.event, 
        userId: event.userId,
        sessionId: event.sessionId 
      })
    } catch (error) {
      logger.error('Failed to track analytics event', { error, event })
    }
  }

  /**
   * Track user action
   */
  static async trackUserAction(
    userId: string,
    action: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: action,
      properties,
    })
  }

  /**
   * Track video processing
   */
  static async trackVideoProcessing(
    userId: string,
    projectId: string,
    properties: {
      duration: number
      platform: string
      clipsGenerated: number
      processingTime: number
    }
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'video_processed',
      properties: {
        projectId,
        ...properties,
      },
    })
  }

  /**
   * Track clip performance
   */
  static async trackClipPerformance(
    userId: string,
    clipId: string,
    platform: string,
    metrics: {
      views: number
      likes: number
      shares: number
      comments: number
    }
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'clip_performance_update',
      properties: {
        clipId,
        platform,
        ...metrics,
      },
    })

    // Also update the clip record
    try {
      await prisma.clip.update({
        where: { id: clipId },
        data: {
          views: metrics.views,
          likes: metrics.likes,
          shares: metrics.shares,
          comments: metrics.comments,
          lastUpdated: new Date(),
        },
      })
    } catch (error) {
      logger.error('Failed to update clip metrics', { error, clipId })
    }
  }

  /**
   * Get user metrics for dashboard
   */
  static async getUserMetrics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<UserMetrics> {
    try {
      const now = new Date()
      const startDate = this.getStartDate(now, timeRange)
      const previousStartDate = this.getPreviousStartDate(startDate, timeRange)

      const [totalUsers, currentPeriodUsers, previousPeriodUsers, newUsers] = await Promise.all([
        // Total users
        prisma.user.count(),

        // Active users in current period
        prisma.user.count({
          where: {
            lastActiveAt: { gte: startDate },
          },
        }),

        // Active users in previous period
        prisma.user.count({
          where: {
            lastActiveAt: {
              gte: previousStartDate,
              lt: startDate,
            },
          },
        }),

        // New users in current period
        prisma.user.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
      ])

      const churnRate = previousPeriodUsers > 0 
        ? ((previousPeriodUsers - currentPeriodUsers) / previousPeriodUsers) * 100 
        : 0

      return {
        totalUsers,
        activeUsers: currentPeriodUsers,
        newUsers,
        churnRate: Math.max(0, churnRate),
      }
    } catch (error) {
      logger.error('Failed to get user metrics', { error })
      throw error
    }
  }

  /**
   * Get content metrics
   */
  static async getContentMetrics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ContentMetrics> {
    try {
      const startDate = this.getStartDate(new Date(), timeRange)

      const [videosProcessed, clipsGenerated, totalViews, avgEngagement] = await Promise.all([
        // Videos processed
        prisma.project.count({
          where: {
            createdAt: { gte: startDate },
            status: 'completed',
          },
        }),

        // Clips generated
        prisma.clip.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),

        // Total views
        prisma.clip.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: { views: true },
        }),

        // Average engagement rate
        prisma.clip.aggregate({
          where: {
            createdAt: { gte: startDate },
            views: { gt: 0 },
          },
          _avg: {
            engagementRate: true,
          },
        }),
      ])

      const avgClipsPerVideo = videosProcessed > 0 ? clipsGenerated / videosProcessed : 0

      return {
        totalVideosProcessed: videosProcessed,
        totalClipsGenerated: clipsGenerated,
        avgClipsPerVideo: Math.round(avgClipsPerVideo * 10) / 10,
        totalViews: totalViews._sum.views || 0,
        avgEngagementRate: avgEngagement._avg.engagementRate || 0,
      }
    } catch (error) {
      logger.error('Failed to get content metrics', { error })
      throw error
    }
  }

  /**
   * Get platform performance metrics
   */
  static async getPlatformMetrics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<PlatformMetrics> {
    try {
      const startDate = this.getStartDate(new Date(), timeRange)

      const platformData = await prisma.clip.groupBy({
        by: ['platform'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: { id: true },
        _sum: {
          views: true,
          likes: true,
          shares: true,
        },
        _avg: {
          engagementRate: true,
        },
      })

      const metrics: PlatformMetrics = {}

      platformData.forEach((data) => {
        metrics[data.platform] = {
          clips: data._count.id,
          views: data._sum.views || 0,
          engagement: data._avg.engagementRate || 0,
        }
      })

      return metrics
    } catch (error) {
      logger.error('Failed to get platform metrics', { error })
      throw error
    }
  }

  /**
   * Get revenue metrics (requires subscription data)
   */
  static async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      // Get active subscriptions
      const activeSubscriptions = await prisma.user.findMany({
        where: {
          subscriptionStatus: 'active',
          planType: { not: null },
        },
        select: {
          planType: true,
          subscriptionCreatedAt: true,
        },
      })

      // Calculate MRR based on plan types
      const planPrices = {
        starter: 59,
        pro: 99,
        business: 199,
      }

      let mrr = 0
      activeSubscriptions.forEach((sub) => {
        if (sub.planType && planPrices[sub.planType as keyof typeof planPrices]) {
          mrr += planPrices[sub.planType as keyof typeof planPrices]
        }
      })

      const arr = mrr * 12

      // Calculate churn rate
      const subscriptionsLastMonth = await prisma.user.count({
        where: {
          subscriptionCreatedAt: { lt: currentMonth },
          subscriptionStatus: 'active',
        },
      })

      const cancelledThisMonth = await prisma.user.count({
        where: {
          subscriptionStatus: 'canceled',
          updatedAt: { gte: currentMonth },
        },
      })

      const churnRate = subscriptionsLastMonth > 0 
        ? (cancelledThisMonth / subscriptionsLastMonth) * 100 
        : 0

      const avgRevenuePerUser = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0

      return {
        mrr,
        arr,
        totalRevenue: mrr, // Simplified - would need payment history for actual total
        avgRevenuePerUser,
        churnRate,
      }
    } catch (error) {
      logger.error('Failed to get revenue metrics', { error })
      throw error
    }
  }

  /**
   * Get user activity timeline
   */
  static async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<Array<{ event: string; timestamp: Date; properties: any }>> {
    try {
      const events = await prisma.analyticsEvent.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          event: true,
          timestamp: true,
          properties: true,
        },
      })

      return events
    } catch (error) {
      logger.error('Failed to get user activity', { error, userId })
      throw error
    }
  }

  /**
   * Get top performing clips
   */
  static async getTopPerformingClips(
    limit: number = 10,
    timeRange: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<Array<{
    id: string
    title: string
    platform: string
    views: number
    engagementRate: number
    viralScore: number
  }>> {
    try {
      const startDate = this.getStartDate(new Date(), timeRange)

      const clips = await prisma.clip.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        orderBy: [
          { views: 'desc' },
          { engagementRate: 'desc' },
        ],
        take: limit,
        select: {
          id: true,
          title: true,
          platform: true,
          views: true,
          engagementRate: true,
          viralScore: true,
        },
      })

      return clips
    } catch (error) {
      logger.error('Failed to get top performing clips', { error })
      throw error
    }
  }

  /**
   * Generate analytics report
   */
  static async generateReport(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    userMetrics: UserMetrics
    contentMetrics: ContentMetrics
    platformMetrics: PlatformMetrics
    revenueMetrics: RevenueMetrics
    topClips: Array<any>
  }> {
    try {
      const [userMetrics, contentMetrics, platformMetrics, revenueMetrics, topClips] = await Promise.all([
        this.getUserMetrics(timeRange),
        this.getContentMetrics(timeRange),
        this.getPlatformMetrics(timeRange),
        this.getRevenueMetrics(),
        this.getTopPerformingClips(5, timeRange),
      ])

      return {
        userMetrics,
        contentMetrics,
        platformMetrics,
        revenueMetrics,
        topClips,
      }
    } catch (error) {
      logger.error('Failed to generate analytics report', { error })
      throw error
    }
  }

  /**
   * Helper: Get start date for time range
   */
  private static getStartDate(now: Date, timeRange: string): Date {
    switch (timeRange) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        return weekStart
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1)
    }
  }

  /**
   * Helper: Get previous period start date
   */
  private static getPreviousStartDate(startDate: Date, timeRange: string): Date {
    switch (timeRange) {
      case 'day':
        const prevDay = new Date(startDate)
        prevDay.setDate(startDate.getDate() - 1)
        return prevDay
      case 'week':
        const prevWeek = new Date(startDate)
        prevWeek.setDate(startDate.getDate() - 7)
        return prevWeek
      case 'month':
        const prevMonth = new Date(startDate)
        prevMonth.setMonth(startDate.getMonth() - 1)
        return prevMonth
      case 'year':
        const prevYear = new Date(startDate)
        prevYear.setFullYear(startDate.getFullYear() - 1)
        return prevYear
      default:
        const prevDefault = new Date(startDate)
        prevDefault.setMonth(startDate.getMonth() - 1)
        return prevDefault
    }
  }
}

export default AnalyticsService
