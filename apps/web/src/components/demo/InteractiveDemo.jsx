import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  Clock, 
  TrendingUp,
  Eye,
  Heart,
  Share,
  MessageCircle,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [selectedClip, setSelectedClip] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const demoSteps = [
    'upload',
    'processing',
    'results',
    'preview'
  ]

  const mockClips = [
    {
      id: 1,
      title: 'The Secret to Viral Content',
      duration: '0:45',
      score: 95,
      thumbnail: '/demo/clip1-thumb.jpg',
      views: '2.3M',
      likes: '145K',
      shares: '23K',
      comments: '8.2K',
      platform: 'TikTok',
      description: 'Hook: "Nobody talks about this..." - Perfect viral opener with strong emotional trigger'
    },
    {
      id: 2,
      title: 'Mind-Blowing Statistics',
      duration: '0:38',
      score: 89,
      thumbnail: '/demo/clip2-thumb.jpg',
      views: '1.8M',
      likes: '112K',
      shares: '18K',
      comments: '5.9K',
      platform: 'Instagram',
      description: 'Data-driven content with surprising numbers that make people stop scrolling'
    },
    {
      id: 3,
      title: 'Common Mistake Everyone Makes',
      duration: '0:52',
      score: 87,
      thumbnail: '/demo/clip3-thumb.jpg',
      views: '1.5M',
      likes: '98K',
      shares: '15K',
      comments: '4.7K',
      platform: 'YouTube',
      description: 'Educational content addressing a widespread misconception'
    },
    {
      id: 4,
      title: 'Behind the Scenes Moment',
      duration: '0:33',
      score: 82,
      thumbnail: '/demo/clip4-thumb.jpg',
      views: '987K',
      likes: '76K',
      shares: '12K',
      comments: '3.1K',
      platform: 'TikTok',
      description: 'Authentic, relatable moment that builds personal connection'
    }
  ]

  const handleStartDemo = () => {
    setCurrentStep(1)
    setIsProcessing(true)
    setProcessingProgress(0)

    // Simulate processing
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          setCurrentStep(2)
          return 100
        }
        return prev + 2
      })
    }, 100)
  }

  const handleClipSelect = (clip) => {
    setSelectedClip(clip)
    setCurrentStep(3)
  }

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

  return (
    <div className="mx-auto max-w-6xl">
      <Tabs value={demoSteps[currentStep]} className="w-full">
        {/* Step Indicator */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center space-x-4">
            {demoSteps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                {index < demoSteps.length - 1 && (
                  <div
                    className={`h-0.5 w-16 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upload Step */}
        <TabsContent value="upload" className="mt-0">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold">Upload Your Video</h3>
              <p className="mb-6 text-muted-foreground">
                Drop your long-form content here or paste a YouTube URL to get started
              </p>
              
              <div className="mb-6 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Sample: "How I Built a $1M Business"</p>
                    <p className="text-sm text-muted-foreground">45 min podcast episode</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleStartDemo} size="lg" className="w-full">
                <Sparkles className="mr-2 h-5 w-5" />
                Analyze This Video
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Step */}
        <TabsContent value="processing" className="mt-0">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <h3 className="mb-4 text-2xl font-bold">AI is Working Its Magic</h3>
              <p className="mb-6 text-muted-foreground">
                Our AI is analyzing your content to find the most engaging moments
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="h-2" />
                
                <div className="grid grid-cols-1 gap-3 text-left">
                  <div className={`flex items-center space-x-3 ${processingProgress > 20 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-2 w-2 rounded-full ${processingProgress > 20 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Extracting audio and generating transcript</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${processingProgress > 50 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-2 w-2 rounded-full ${processingProgress > 50 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Identifying potential clip segments</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${processingProgress > 80 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-2 w-2 rounded-full ${processingProgress > 80 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Scoring viral potential with AI</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${processingProgress > 95 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-2 w-2 rounded-full ${processingProgress > 95 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Generating clips and captions</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Step */}
        <TabsContent value="results" className="mt-0">
          <div>
            <div className="mb-8 text-center">
              <h3 className="mb-4 text-2xl font-bold">Your Viral Clips Are Ready!</h3>
              <p className="text-muted-foreground">
                AI found {mockClips.length} high-potential clips from your content
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {mockClips.map((clip, index) => (
                <motion.div
                  key={clip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                    onClick={() => handleClipSelect(clip)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="relative flex-shrink-0">
                          <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white" fill="currentColor" />
                          </div>
                          <Badge 
                            variant={getScoreBadgeVariant(clip.score)}
                            className="absolute -top-2 -right-2"
                          >
                            {clip.score}
                          </Badge>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium truncate">{clip.title}</h4>
                            <span className="text-sm text-muted-foreground">{clip.duration}</span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {clip.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>{clip.views}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="h-3 w-3" />
                                <span>{clip.likes}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {clip.platform}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button 
                onClick={() => handleClipSelect(mockClips[0])}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Preview Best Clip
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Preview Step */}
        <TabsContent value="preview" className="mt-0">
          {selectedClip && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Video Preview */}
              <div>
                <Card>
                  <CardContent className="p-0">
                    <div className="relative aspect-[9/16] bg-gradient-to-br from-purple-400 to-blue-400 rounded-t-lg">
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
                          <p className="text-white font-bold text-lg">
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
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <Button 
                          className="flex-1 mr-2"
                          onClick={() => {
                            // Simulate download
                            console.log('Downloading clip:', selectedClip.id);
                            // In production, this would trigger actual download
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 ml-2"
                          onClick={() => {
                            // Simulate share
                            console.log('Sharing clip:', selectedClip.id);
                            if (navigator.share) {
                              navigator.share({
                                title: selectedClip.title,
                                text: selectedClip.description,
                                url: window.location.href
                              });
                            } else {
                              // Fallback to clipboard
                              navigator.clipboard.writeText(window.location.href);
                            }
                          }}
                        >
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Clip Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">{selectedClip.title}</h3>
                  <p className="text-muted-foreground">{selectedClip.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(selectedClip.score)}`}>
                        {selectedClip.score}
                      </div>
                      <div className="text-sm text-muted-foreground">Viral Score</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedClip.duration}</div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Predicted Performance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Views</span>
                        </div>
                        <span className="font-medium">{selectedClip.views}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Likes</span>
                        </div>
                        <span className="font-medium">{selectedClip.likes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Share className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Shares</span>
                        </div>
                        <span className="font-medium">{selectedClip.shares}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Comments</span>
                        </div>
                        <span className="font-medium">{selectedClip.comments}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Button onClick={() => setCurrentStep(0)} variant="outline">
                    Try Another Video
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
