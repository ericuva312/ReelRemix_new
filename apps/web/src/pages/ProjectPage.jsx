import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Play,
  Pause,
  Download,
  Share,
  Edit,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Clock,
  Zap,
  Filter,
  Grid,
  List,
  MoreHorizontal
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

export default function ProjectPage() {
  const { id } = useParams()
  const [viewMode, setViewMode] = useState('grid')
  const [selectedClip, setSelectedClip] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Mock project data
  const project = {
    id: 1,
    title: 'Podcast Episode #47: Building a $1M Business',
    description: 'In-depth conversation about scaling a business from zero to seven figures, covering marketing strategies, team building, and overcoming challenges.',
    thumbnail: '/projects/project1.jpg',
    duration: '45:32',
    uploadDate: '2024-01-15',
    status: 'completed',
    sourceUrl: 'https://youtube.com/watch?v=example',
    platform: 'YouTube',
    totalViews: '2.3M',
    totalLikes: '145K',
    totalShares: '23K',
    clipsGenerated: 12,
    processingTime: '8 minutes'
  }

  const clips = [
    {
      id: 1,
      title: 'The Secret to Viral Content',
      description: 'Hook: "Nobody talks about this..." - Perfect viral opener with strong emotional trigger',
      thumbnail: '/clips/clip1.jpg',
      duration: '0:45',
      startTime: '12:34',
      endTime: '13:19',
      score: 95,
      views: '234K',
      likes: '12.3K',
      shares: '2.1K',
      comments: '890',
      platform: 'TikTok',
      status: 'published',
      engagement: 5.2
    },
    {
      id: 2,
      title: 'Mind-Blowing Business Statistics',
      description: 'Data-driven content with surprising numbers that make people stop scrolling',
      thumbnail: '/clips/clip2.jpg',
      duration: '0:38',
      startTime: '23:45',
      endTime: '24:23',
      score: 89,
      views: '189K',
      likes: '9.8K',
      shares: '1.7K',
      comments: '654',
      platform: 'Instagram',
      status: 'published',
      engagement: 4.8
    },
    {
      id: 3,
      title: 'Common Mistake Everyone Makes',
      description: 'Educational content addressing a widespread misconception',
      thumbnail: '/clips/clip3.jpg',
      duration: '0:52',
      startTime: '31:12',
      endTime: '32:04',
      score: 87,
      views: '167K',
      likes: '8.9K',
      shares: '1.4K',
      comments: '432',
      platform: 'YouTube',
      status: 'published',
      engagement: 4.5
    },
    {
      id: 4,
      title: 'Behind the Scenes Moment',
      description: 'Authentic, relatable moment that builds personal connection',
      thumbnail: '/clips/clip4.jpg',
      duration: '0:33',
      startTime: '38:20',
      endTime: '38:53',
      score: 82,
      views: '134K',
      likes: '7.2K',
      shares: '1.1K',
      comments: '298',
      platform: 'TikTok',
      status: 'draft',
      engagement: 4.1
    }
  ]

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const getScoreBadgeVariant = (score) => {
    if (score >= 90) return 'default'
    if (score >= 80) return 'secondary'
    return 'outline'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-500'
      case 'draft': return 'bg-yellow-500'
      case 'processing': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const handleClipSelect = (clip) => {
    setSelectedClip(clip)
  }

  const handleDownloadClip = (clipId) => {
    console.log('Downloading clip:', clipId)
  }

  const handleShareClip = (clipId) => {
    console.log('Sharing clip:', clipId)
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Project Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" fill="currentColor" />
                </div>
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2"
                >
                  {project.platform}
                </Badge>
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {project.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    {project.clipsGenerated} clips
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {project.totalViews} total views
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                // Navigate to project edit page or open edit modal
                console.log('Edit project:', project.id);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Download all clips as zip file
                console.log('Download all clips for project:', project.id);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  // Share project functionality
                  console.log('Share project:', project.id);
                  navigator.clipboard.writeText(window.location.href);
                }}>
                  <Share className="mr-2 h-4 w-4" />
                  Share Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Rename project functionality
                  console.log('Rename project:', project.id);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => {
                    // Delete project functionality
                    if (confirm('Are you sure you want to delete this project?')) {
                      console.log('Delete project:', project.id);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Views', value: project.totalViews, icon: Eye, color: 'text-blue-500' },
          { label: 'Total Likes', value: project.totalLikes, icon: Heart, color: 'text-red-500' },
          { label: 'Total Shares', value: project.totalShares, icon: Share, color: 'text-green-500' },
          { label: 'Clips Generated', value: project.clipsGenerated, icon: Zap, color: 'text-purple-500' }
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

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Clips List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Clips</CardTitle>
                  <CardDescription>
                    {clips.length} clips generated from your video
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Open filter modal or dropdown
                      console.log('Open filter options');
                    }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : 'space-y-4'}>
                {clips.map((clip, index) => (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedClip?.id === clip.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleClipSelect(clip)}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center space-x-4'}>
                          {/* Thumbnail */}
                          <div className={`relative ${viewMode === 'grid' ? '' : 'flex-shrink-0'}`}>
                            <div className={`bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg ${
                              viewMode === 'grid' ? 'aspect-[9/16] w-full' : 'h-16 w-16'
                            }`} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className={`text-white ${viewMode === 'grid' ? 'h-6 w-6' : 'h-4 w-4'}`} fill="currentColor" />
                            </div>
                            <Badge 
                              variant={getScoreBadgeVariant(clip.score)}
                              className="absolute -top-2 -right-2"
                            >
                              {clip.score}
                            </Badge>
                            <div className="absolute bottom-2 right-2">
                              <Badge variant="outline" className="bg-black/50 text-white border-white/20 text-xs">
                                {clip.duration}
                              </Badge>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className={`font-semibold ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}>
                                {clip.title}
                              </h3>
                              <div className="flex items-center space-x-1 ml-2">
                                <div className={`h-2 w-2 rounded-full ${getStatusColor(clip.status)}`} />
                                <span className="text-xs text-muted-foreground capitalize">
                                  {clip.status}
                                </span>
                              </div>
                            </div>

                            <p className={`text-sm text-muted-foreground mb-3 ${
                              viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'
                            }`}>
                              {clip.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{clip.views}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Heart className="h-3 w-3" />
                                  <span>{clip.likes}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Share className="h-3 w-3" />
                                  <span>{clip.shares}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadClip(clip.id)
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShareClip(clip.id)
                                  }}
                                >
                                  <Share className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clip Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>
                {selectedClip ? 'Clip Preview' : 'Select a Clip'}
              </CardTitle>
              {selectedClip && (
                <CardDescription>
                  {selectedClip.startTime} - {selectedClip.endTime}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedClip ? (
                <div className="space-y-4">
                  {/* Video Player */}
                  <div className="relative">
                    <div className="aspect-[9/16] bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="rounded-full"
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6" fill="currentColor" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Mock captions */}
                    <div className="absolute bottom-20 left-4 right-4">
                      <div className="rounded-lg bg-black/80 p-3 text-center">
                        <p className="text-white font-bold text-sm">
                          "The secret that nobody talks about..."
                        </p>
                      </div>
                    </div>
                    
                    {/* Mock progress bar */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="h-1 bg-white/30 rounded-full">
                        <div className="h-1 bg-white rounded-full w-1/3" />
                      </div>
                    </div>
                  </div>

                  {/* Clip Details */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-1">{selectedClip.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedClip.description}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Viral Score</div>
                        <div className={`font-semibold ${getScoreColor(selectedClip.score)}`}>
                          {selectedClip.score}/100
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Platform</div>
                        <div className="font-semibold">{selectedClip.platform}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-semibold">{selectedClip.duration}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Engagement</div>
                        <div className="font-semibold">{selectedClip.engagement}%</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => {
                          // Download selected clip
                          console.log('Download clip:', selectedClip.id);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Clip
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          // Share selected clip
                          console.log('Share clip:', selectedClip.id);
                        }}
                      >
                        <Share className="mr-2 h-4 w-4" />
                        Share Clip
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          // Edit selected clip
                          console.log('Edit clip:', selectedClip.id);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Clip
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-32 w-32 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Select a clip from the list to preview it here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
