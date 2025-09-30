import { Router } from 'express'
import { query, param, validationResult } from 'express-validator'
import AnalyticsService from '../services/analytics'
import MonitoringService from '../services/monitoring'
import { authenticateUser, requireAdmin } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = Router()

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

/**
 * POST /analytics/track
 * Track an analytics event
 */
router.post('/track', authenticateUser, async (req, res) => {
  try {
    const { event, properties } = req.body
    const userId = req.user.id

    await AnalyticsService.trackUserAction(userId, event, properties)

    res.json({ success: true })
  } catch (error) {
    logger.error('Error tracking analytics event', { error, userId: req.user?.id })
    res.status(500).json({ error: 'Failed to track event' })
  }
})

/**
 * GET /analytics/dashboard
 * Get dashboard analytics for authenticated user
 */
router.get(
  '/dashboard',
  authenticateUser,
  [query('timeRange').optional().isIn(['day', 'week', 'month', 'year'])],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id
      const timeRange = req.query.timeRange as 'day' | 'week' | 'month' | 'year' || 'month'

      // Get user-specific analytics
      const [activity, userProjects, userClips] = await Promise.all([
        AnalyticsService.getUserActivity(userId, 20),
        // Get user's projects count and performance
        prisma.project.count({
          where: { 
            userId,
            createdAt: { gte: AnalyticsService.getStartDate(new Date(), timeRange) }
          }
        }),
        // Get user's clips performance
        prisma.clip.aggregate({
          where: {
            project: { userId },
            createdAt: { gte: AnalyticsService.getStartDate(new Date(), timeRange) }
          },
          _count: { id: true },
          _sum: { views: true, likes: true, shares: true },
          _avg: { viralScore: true, engagementRate: true }
        })
      ])

      const dashboardData = {
        activity,
        projects: {
          total: userProjects,
        },
        clips: {
          total: userClips._count.id || 0,
          totalViews: userClips._sum.views || 0,
          totalLikes: userClips._sum.likes || 0,
          totalShares: userClips._sum.shares || 0,
          avgViralScore: userClips._avg.viralScore || 0,
          avgEngagement: userClips._avg.engagementRate || 0,
        }
      }

      res.json(dashboardData)
    } catch (error) {
      logger.error('Error fetching dashboard analytics', { error, userId: req.user?.id })
      res.status(500).json({ error: 'Failed to fetch dashboard analytics' })
    }
  }
)

/**
 * GET /analytics/admin/overview
 * Get admin analytics overview (admin only)
 */
router.get(
  '/admin/overview',
  authenticateUser,
  requireAdmin,
  [query('timeRange').optional().isIn(['day', 'week', 'month', 'year'])],
  validateRequest,
  async (req, res) => {
    try {
      const timeRange = req.query.timeRange as 'day' | 'week' | 'month' | 'year' || 'month'

      const report = await AnalyticsService.generateReport(timeRange)

      res.json(report)
    } catch (error) {
      logger.error('Error fetching admin analytics', { error })
      res.status(500).json({ error: 'Failed to fetch admin analytics' })
    }
  }
)

/**
 * GET /analytics/admin/users
 * Get user metrics (admin only)
 */
router.get(
  '/admin/users',
  authenticateUser,
  requireAdmin,
  [query('timeRange').optional().isIn(['day', 'week', 'month', 'year'])],
  validateRequest,
  async (req, res) => {
    try {
      const timeRange = req.query.timeRange as 'day' | 'week' | 'month' | 'year' || 'month'

      const userMetrics = await AnalyticsService.getUserMetrics(timeRange)

      res.json(userMetrics)
    } catch (error) {
      logger.error('Error fetching user metrics', { error })
      res.status(500).json({ error: 'Failed to fetch user metrics' })
    }
  }
)

/**
 * GET /analytics/admin/content
 * Get content metrics (admin only)
 */
router.get(
  '/admin/content',
  authenticateUser,
  requireAdmin,
  [query('timeRange').optional().isIn(['day', 'week', 'month', 'year'])],
  validateRequest,
  async (req, res) => {
    try {
      const timeRange = req.query.timeRange as 'day' | 'week' | 'month' | 'year' || 'month'

      const contentMetrics = await AnalyticsService.getContentMetrics(timeRange)

      res.json(contentMetrics)
    } catch (error) {
      logger.error('Error fetching content metrics', { error })
      res.status(500).json({ error: 'Failed to fetch content metrics' })
    }
  }
)

/**
 * GET /analytics/admin/platforms
 * Get platform performance metrics (admin only)
 */
router.get(
  '/admin/platforms',
  authenticateUser,
  requireAdmin,
  [query('timeRange').optional().isIn(['day', 'week', 'month', 'year'])],
  validateRequest,
  async (req, res) => {
    try {
      const timeRange = req.query.timeRange as 'day' | 'week' | 'month' | 'year' || 'month'

      const platformMetrics = await AnalyticsService.getPlatformMetrics(timeRange)

      res.json(platformMetrics)
    } catch (error) {
      logger.error('Error fetching platform metrics', { error })
      res.status(500).json({ error: 'Failed to fetch platform metrics' })
    }
  }
)

/**
 * GET /analytics/admin/revenue
 * Get revenue metrics (admin only)
 */
router.get('/admin/revenue', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const revenueMetrics = await AnalyticsService.getRevenueMetrics()

    res.json(revenueMetrics)
  } catch (error) {
    logger.error('Error fetching revenue metrics', { error })
    res.status(500).json({ error: 'Failed to fetch revenue metrics' })
  }
})

/**
 * GET /analytics/clips/top
 * Get top performing clips
 */
router.get(
  '/clips/top',
  authenticateUser,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('timeRange').optional().isIn(['day', 'week', 'month', 'year']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const timeRange = req.query.timeRange as 'day' | 'week' | 'month' | 'year' || 'month'

      const topClips = await AnalyticsService.getTopPerformingClips(limit, timeRange)

      res.json({ clips: topClips })
    } catch (error) {
      logger.error('Error fetching top clips', { error })
      res.status(500).json({ error: 'Failed to fetch top clips' })
    }
  }
)

/**
 * POST /analytics/clip-performance
 * Update clip performance metrics
 */
router.post('/clip-performance', authenticateUser, async (req, res) => {
  try {
    const { clipId, platform, views, likes, shares, comments } = req.body
    const userId = req.user.id

    await AnalyticsService.trackClipPerformance(userId, clipId, platform, {
      views,
      likes,
      shares,
      comments,
    })

    res.json({ success: true })
  } catch (error) {
    logger.error('Error updating clip performance', { error, userId: req.user?.id })
    res.status(500).json({ error: 'Failed to update clip performance' })
  }
})

/**
 * GET /monitoring/health
 * Get system health status
 */
router.get('/monitoring/health', async (req, res) => {
  try {
    const health = await MonitoringService.checkSystemHealth()

    res.json(health)
  } catch (error) {
    logger.error('Error checking system health', { error })
    res.status(500).json({ error: 'Failed to check system health' })
  }
})

/**
 * GET /monitoring/performance
 * Get performance metrics (admin only)
 */
router.get('/monitoring/performance', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const metrics = await MonitoringService.getPerformanceMetrics()

    res.json(metrics)
  } catch (error) {
    logger.error('Error fetching performance metrics', { error })
    res.status(500).json({ error: 'Failed to fetch performance metrics' })
  }
})

/**
 * GET /monitoring/status
 * Get system status for public status page
 */
router.get('/monitoring/status', async (req, res) => {
  try {
    const status = await MonitoringService.getSystemStatus()

    res.json(status)
  } catch (error) {
    logger.error('Error fetching system status', { error })
    res.status(500).json({ error: 'Failed to fetch system status' })
  }
})

/**
 * GET /analytics/user/:userId/activity
 * Get user activity timeline (admin only)
 */
router.get(
  '/user/:userId/activity',
  authenticateUser,
  requireAdmin,
  [
    param('userId').isUUID().withMessage('Valid user ID required'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params
      const limit = parseInt(req.query.limit as string) || 50

      const activity = await AnalyticsService.getUserActivity(userId, limit)

      res.json({ activity })
    } catch (error) {
      logger.error('Error fetching user activity', { error })
      res.status(500).json({ error: 'Failed to fetch user activity' })
    }
  }
)

/**
 * GET /analytics/export
 * Export analytics data (admin only)
 */
router.get(
  '/export',
  authenticateUser,
  requireAdmin,
  [
    query('type').isIn(['users', 'content', 'revenue', 'all']).withMessage('Valid export type required'),
    query('timeRange').optional().isIn(['day', 'week', 'month', 'year']),
    query('format').optional().isIn(['json', 'csv']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { type, timeRange = 'month', format = 'json' } = req.query

      let data: any

      switch (type) {
        case 'users':
          data = await AnalyticsService.getUserMetrics(timeRange as any)
          break
        case 'content':
          data = await AnalyticsService.getContentMetrics(timeRange as any)
          break
        case 'revenue':
          data = await AnalyticsService.getRevenueMetrics()
          break
        case 'all':
          data = await AnalyticsService.generateReport(timeRange as any)
          break
        default:
          return res.status(400).json({ error: 'Invalid export type' })
      }

      if (format === 'csv') {
        // Convert to CSV format
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.csv`)
        // TODO: Implement CSV conversion
        res.send('CSV export not implemented yet')
      } else {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.json`)
        res.json(data)
      }
    } catch (error) {
      logger.error('Error exporting analytics data', { error })
      res.status(500).json({ error: 'Failed to export analytics data' })
    }
  }
)

export default router
