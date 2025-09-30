import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Upload, 
  Play, 
  Download, 
  MoreHorizontal,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  Share,
  Filter,
  Search,
  Calendar,
  BarChart3,
  Users,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [projects, setProjects] = useState([])
  const [analytics, setAnalytics] = useState(null)

  // Load data on component mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Import API service dynamically to avoid SSR issues
      const { default: apiService } = await import('../services/api.js')
      
      const [projectsData, analyticsData] = await Promise.all([
        apiService.getProjects(),
        apiService.getDashboardAnalytics()
      ])
      
      setProjects(projectsData.projects || [])
      setAnalytics(analyticsData.analytics || {})
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const handleUploadVideo = async () => {
    if (!uploadUrl.trim()) {
      alert('Please enter a video URL')
      return
    }

    setIsUploading(true)
    try {
      const { default: apiService } = await import('../services/api.js')
      
      const response = await apiService.uploadVideo({
        url: uploadUrl,
        title: uploadTitle || 'Untitled Project'
      })

      if (response.success) {
        alert('Video upload started successfully!')
        setShowUploadModal(false)
        setUploadUrl('')
        setUploadTitle('')
        loadDashboardData() // Refresh data
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading video. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleNewProject = () => {
    setShowUploadModal(true)
  }

  // Mock data
  const user = {
    name: 'Eric Chen',
    email: 'eric@chimehq.co',
    plan: 'Pro',
    avatar: '/avatars/user.jpg'
  }

  const stats = {
    videosProcessed: 23,
    clipsGenerated: 187,
    totalViews: '2.3M',
    avgEngagement: '+340%'
  }

  const usage = {
    renders: { used: 156, total: 240 },
    minutes: { used: 890, total: 1200 },
    storage: { used: 2.4, total: 10 }
  }

  // Mock projects data as fallback
  const mockProjects = projects.length === 0 ? [
    {
      id: 1,
      title: 'Podcast Episode #47: Building a $1M Business',
      thumbnail: '/projects/project1.jpg',
      duration: '45:32',
      status: 'completed',
      clipsGenerated: 12,
      topClipViews: '234K',
      createdAt: '2024-01-15',
      platform: 'YouTube'
    },
    {
      id: 2,
      title: 'Marketing Masterclass: Social Media Strategy',
      thumbnail: '/projects/project2.jpg',
      duration: '38:15',
      status: 'processing',
      clipsGenerated: 0,
      topClipViews: '0',
      createdAt: '2024-01-16',
      platform: 'YouTube'
    },
    {
      id: 3,
      title: 'Q&A Session: Entrepreneurship Tips',
      thumbnail: '/projects/project3.jpg',
      duration: '52:08',
      status: 'completed',
      clipsGenerated: 8,
      topClipViews: '156K',
      createdAt: '2024-01-14',
      platform: 'Zoom'
    }
  ] : projects

  const recentClips = [
    {
      id: 1,
      title: 'The Secret to Viral Content',
      thumbnail: '/clips/clip1.jpg',
      duration: '0:45',
      views: '234K',
      likes: '12.3K',
      shares: '2.1K',
      platform: 'TikTok',
      score: 95
    },
    {
      id: 2,
      title: 'Mind-Blowing Business Statistics',
      thumbnail: '/clips/clip2.jpg',
      duration: '0:38',
      views: '189K',
      likes: '9.8K',
      shares: '1.7K',
      platform: 'Instagram',
      score: 89
    },
    {
      id: 3,
      title: 'Common Mistake Everyone Makes',
      thumbnail: '/clips/clip3.jpg',
      duration: '0:52',
      views: '167K',
      likes: '8.9K',
      shares: '1.4K',
      platform: 'YouTube',
      score: 87
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-yellow-500'
    return 'text-orange-500'
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your content today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={handleNewProject}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Videos Processed', value: stats.videosProcessed, icon: Play, color: 'text-blue-500' },
          { label: 'Clips Generated', value: stats.clipsGenerated, icon: Zap, color: 'text-purple-500' },
          { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-green-500' },
          { label: 'Avg. Engagement', value: stats.avgEngagement, icon: TrendingUp, color: 'text-orange-500' }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Usage Overview */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>
              Your current plan usage for this billing period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Renders</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.renders.used} / {usage.renders.total}
                  </span>
                </div>
                <Progress value={(usage.renders.used / usage.renders.total) * 100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Source Minutes</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.minutes.used} / {usage.minutes.total}
                  </span>
                </div>
                <Progress value={(usage.minutes.used / usage.minutes.total) * 100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Storage (GB)</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.storage.used} / {usage.storage.total}
                  </span>
                </div>
                <Progress value={(usage.storage.used / usage.storage.total) * 100} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="clips">Recent Clips</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mockProjects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-video bg-gradient-to-br from-purple-400 to-blue-400 rounded-t-lg" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white" fill="currentColor" />
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary">{project.platform}</Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              View Project
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download All
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                          {project.duration}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{project.title}</h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(project.status)}`} />
                          <span className="text-sm text-muted-foreground capitalize">
                            {project.status}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {project.status === 'processing' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Processing</span>
                            <span className="text-sm">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} />
                        </div>
                      )}

                      {project.status === 'completed' && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{project.clipsGenerated} clips generated</span>
                          <span>Top: {project.topClipViews} views</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Recent Clips Tab */}
        <TabsContent value="clips" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentClips.map((clip, index) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-[9/16] bg-gradient-to-br from-purple-400 to-blue-400 rounded-t-lg" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white" fill="currentColor" />
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary">{clip.platform}</Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge 
                          variant="outline" 
                          className={`bg-black/50 border-white/20 ${getScoreColor(clip.score)}`}
                        >
                          {clip.score}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                          {clip.duration}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold mb-3 line-clamp-2">{clip.title}</h3>
                      
                      <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <Eye className="h-3 w-3 mr-1" />
                          </div>
                          <div className="font-medium">{clip.views}</div>
                          <div className="text-muted-foreground text-xs">Views</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <Heart className="h-3 w-3 mr-1" />
                          </div>
                          <div className="font-medium">{clip.likes}</div>
                          <div className="text-muted-foreground text-xs">Likes</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <Share className="h-3 w-3 mr-1" />
                          </div>
                          <div className="font-medium">{clip.shares}</div>
                          <div className="text-muted-foreground text-xs">Shares</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Your content performance over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Analytics chart would go here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Platforms</CardTitle>
                <CardDescription>
                  Where your content performs best
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { platform: 'TikTok', views: '1.2M', percentage: 45 },
                    { platform: 'Instagram', views: '890K', percentage: 33 },
                    { platform: 'YouTube', views: '567K', percentage: 22 }
                  ].map((item) => (
                    <div key={item.platform} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.platform}</div>
                        <div className="text-sm text-muted-foreground">{item.views} views</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.percentage}%</div>
                        <Progress value={item.percentage} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload Video</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Video URL</label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Project Title (Optional)</label>
                <Input
                  placeholder="My Awesome Video"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadVideo}
                disabled={isUploading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isUploading ? 'Uploading...' : 'Start Processing'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
