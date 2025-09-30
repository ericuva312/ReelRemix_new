import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Link as LinkIcon, 
  X, 
  Play, 
  Clock, 
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function VideoUploadModal({ isOpen, onClose, onUploadComplete }) {
  const [step, setStep] = useState(1) // 1: Input, 2: Processing, 3: Complete
  const [uploadMethod, setUploadMethod] = useState('url') // 'url' or 'file'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    file: null
  })
  const [processing, setProcessing] = useState({
    uploadId: null,
    progress: 0,
    status: 'starting',
    estimatedTime: null,
    currentStep: 'Initializing...'
  })
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.title.trim()) {
      setError('Please enter a title for your video')
      return
    }

    if (uploadMethod === 'url' && !formData.videoUrl.trim()) {
      setError('Please enter a video URL')
      return
    }

    if (uploadMethod === 'file' && !formData.file) {
      setError('Please select a video file')
      return
    }

    try {
      setStep(2)
      setProcessing(prev => ({ ...prev, status: 'starting', currentStep: 'Starting upload...' }))

      // Import API service
      const { default: apiService } = await import('../../services/api.js')

      // Create project first
      const projectResponse = await apiService.createProject({
        title: formData.title,
        description: formData.description
      })

      if (!projectResponse.success) {
        throw new Error(projectResponse.error || 'Failed to create project')
      }

      // Start video processing
      const videoUrl = uploadMethod === 'url' ? formData.videoUrl : 'file://uploaded'
      const processingResponse = await apiService.startVideoProcessing(
        projectResponse.project.id,
        videoUrl,
        formData.title
      )

      if (!processingResponse.success) {
        throw new Error(processingResponse.error || 'Failed to start processing')
      }

      setProcessing(prev => ({
        ...prev,
        uploadId: processingResponse.uploadId,
        status: 'processing',
        estimatedTime: processingResponse.estimatedTime,
        currentStep: 'Analyzing video content...'
      }))

      // Poll for status updates
      pollProcessingStatus(processingResponse.uploadId)

    } catch (error) {
      console.error('Upload error:', error)
      setError(error.message || 'Failed to upload video. Please try again.')
      setStep(1)
    }
  }

  const pollProcessingStatus = async (uploadId) => {
    const { default: apiService } = await import('../../services/api.js')
    
    const poll = async () => {
      try {
        const statusResponse = await apiService.getProcessingStatus(uploadId)
        
        if (statusResponse.success) {
          const { upload, jobStatus } = statusResponse
          
          // Update progress based on status
          let progress = 0
          let currentStep = 'Processing...'
          
          if (jobStatus) {
            progress = jobStatus.progress || 0
            
            if (progress < 30) {
              currentStep = 'Downloading and analyzing video...'
            } else if (progress < 60) {
              currentStep = 'Generating transcript...'
            } else if (progress < 80) {
              currentStep = 'Identifying viral moments...'
            } else if (progress < 95) {
              currentStep = 'Scoring segments with AI...'
            } else {
              currentStep = 'Finalizing clips...'
            }
          }

          setProcessing(prev => ({
            ...prev,
            progress,
            currentStep,
            status: upload.status.toLowerCase()
          }))

          if (upload.status === 'COMPLETED') {
            setProcessing(prev => ({
              ...prev,
              progress: 100,
              currentStep: 'Processing complete!',
              status: 'completed'
            }))
            
            setTimeout(() => {
              setStep(3)
              if (onUploadComplete) {
                onUploadComplete(statusResponse)
              }
            }, 1000)
            
            return // Stop polling
          } else if (upload.status === 'FAILED') {
            throw new Error('Video processing failed')
          }
        }
        
        // Continue polling if still processing
        if (upload?.status === 'PROCESSING' || upload?.status === 'PENDING') {
          setTimeout(poll, 2000) // Poll every 2 seconds
        }
        
      } catch (error) {
        console.error('Status polling error:', error)
        setError('Processing failed. Please try again.')
        setStep(1)
      }
    }

    // Start polling
    setTimeout(poll, 1000)
  }

  const handleClose = () => {
    if (step === 2 && processing.status === 'processing') {
      // Ask for confirmation if processing
      if (confirm('Video is still processing. Are you sure you want to close?')) {
        onClose()
        resetForm()
      }
    } else {
      onClose()
      resetForm()
    }
  }

  const resetForm = () => {
    setStep(1)
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      file: null
    })
    setProcessing({
      uploadId: null,
      progress: 0,
      status: 'starting',
      estimatedTime: null,
      currentStep: 'Initializing...'
    })
    setError(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid video file (MP4, AVI, MOV, WMV)')
        return
      }
      
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB')
        return
      }

      setFormData(prev => ({ ...prev, file }))
      setError(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl mx-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {step === 1 && 'Upload Video'}
                  {step === 2 && 'Processing Video'}
                  {step === 3 && 'Upload Complete'}
                </CardTitle>
                <CardDescription>
                  {step === 1 && 'Upload your video to create viral clips with AI'}
                  {step === 2 && 'Our AI is analyzing your video to find the best moments'}
                  {step === 3 && 'Your video has been processed successfully!'}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent>
              {/* Step 1: Upload Form */}
              {step === 1 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Upload Method Selection */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={uploadMethod === 'url' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('url')}
                      className="flex-1"
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMethod === 'file' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('file')}
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      File Upload
                    </Button>
                  </div>

                  {/* Video Input */}
                  {uploadMethod === 'url' ? (
                    <div>
                      <Label htmlFor="videoUrl">Video URL *</Label>
                      <Input
                        id="videoUrl"
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=... or direct video URL"
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Supports YouTube, Vimeo, and direct video links
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="videoFile">Video File *</Label>
                      <Input
                        id="videoFile"
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Max 500MB. Supports MP4, AVI, MOV, WMV
                      </p>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Give your video a descriptive title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your video content"
                      rows={3}
                    />
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Processing Info */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      What happens next?
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• AI analyzes your video content</li>
                      <li>• Identifies the most engaging moments</li>
                      <li>• Creates optimized clips for social media</li>
                      <li>• Generates captions and thumbnails</li>
                    </ul>
                    <div className="flex items-center gap-2 mt-3">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Estimated processing time: 5-10 minutes</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full" size="lg">
                    <Upload className="mr-2 h-4 w-4" />
                    Start Processing
                  </Button>
                </form>
              )}

              {/* Step 2: Processing */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Processing Your Video</h3>
                    <p className="text-muted-foreground">
                      {processing.currentStep}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(processing.progress)}%</span>
                    </div>
                    <Progress value={processing.progress} className="w-full" />
                  </div>

                  {processing.estimatedTime && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Estimated time: {processing.estimatedTime}</span>
                    </div>
                  )}

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      You can close this window and check the progress from your dashboard. 
                      We'll notify you when processing is complete.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Complete */}
              {step === 3 && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Video Processed Successfully!</h3>
                    <p className="text-muted-foreground">
                      Your video has been analyzed and viral clips have been generated.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={() => {
                        onClose()
                        window.location.href = '/dashboard'
                      }}
                      className="flex-1"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      View Clips
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Upload Another
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
