import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Play, 
  FileVideo, 
  Link as LinkIcon, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Sparkles,
  Clock,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const VideoUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
  const [step, setStep] = useState('input'); // 'input', 'processing', 'complete'
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadId, setUploadId] = useState(null);
  
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // Reset modal state
  const resetModal = useCallback(() => {
    setStep('input');
    setFile(null);
    setUrl('');
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    setProcessingProgress(0);
    setError('');
    setIsUploading(false);
    setUploadId(null);
    setDragActive(false);
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!isUploading) {
      resetModal();
      onClose();
    }
  }, [isUploading, resetModal, onClose]);

  // Validate file
  const validateFile = (file) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'];
    
    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid video file (MP4, MOV, AVI, MKV, WebM)';
    }
    
    return null;
  };

  // Validate URL
  const validateUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    
    if (!youtubeRegex.test(url) && !vimeoRegex.test(url)) {
      return 'Please enter a valid YouTube or Vimeo URL';
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setFile(selectedFile);
    setError('');
    
    // Auto-generate title from filename
    if (!title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle URL change
  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    if (newUrl) {
      const validationError = validateUrl(newUrl);
      setError(validationError || '');
      
      // Auto-generate title from URL
      if (!title && !validationError) {
        try {
          const urlObj = new URL(newUrl);
          const pathParts = urlObj.pathname.split('/');
          const lastPart = pathParts[pathParts.length - 1] || 'Video';
          setTitle(lastPart);
        } catch {
          // Invalid URL, ignore
        }
      }
    } else {
      setError('');
    }
  };

  // Simulate upload process
  const simulateUpload = async () => {
    setIsUploading(true);
    setStep('processing');
    setUploadProgress(0);
    setProcessingProgress(0);
    
    // Generate upload ID
    const newUploadId = `upload_${Date.now()}`;
    setUploadId(newUploadId);
    
    // Simulate file upload progress
    for (let i = 0; i <= 100; i += 5) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Simulate processing progress
    for (let i = 0; i <= 100; i += 2) {
      setProcessingProgress(i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    setStep('complete');
    setIsUploading(false);
    
    // Call completion callback
    if (onUploadComplete) {
      onUploadComplete({
        uploadId: newUploadId,
        title,
        description,
        file: uploadMethod === 'file' ? file : null,
        url: uploadMethod === 'url' ? url : null
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title for your video');
      return;
    }
    
    if (uploadMethod === 'file' && !file) {
      setError('Please select a video file');
      return;
    }
    
    if (uploadMethod === 'url' && !url.trim()) {
      setError('Please enter a video URL');
      return;
    }
    
    if (uploadMethod === 'url') {
      const urlError = validateUrl(url);
      if (urlError) {
        setError(urlError);
        return;
      }
    }
    
    await simulateUpload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg bg-background shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-semibold">Upload Video</h2>
            <p className="text-sm text-muted-foreground">
              Transform your content into viral clips
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Upload Method Tabs */}
                <Tabs value={uploadMethod} onValueChange={setUploadMethod}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file" className="flex items-center space-x-2">
                      <FileVideo className="h-4 w-4" />
                      <span>Upload File</span>
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4" />
                      <span>From URL</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="file" className="space-y-4">
                    {/* File Drop Zone */}
                    <div
                      ref={dropRef}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                        dragActive
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      
                      {file ? (
                        <div className="space-y-2">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <FileVideo className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Drop your video here</p>
                            <p className="text-sm text-muted-foreground">
                              or click to browse files
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Supports MP4, MOV, AVI, MKV, WebM (max 500MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="video-url">Video URL</Label>
                      <Input
                        id="video-url"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={url}
                        onChange={handleUrlChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Supports YouTube and Vimeo URLs
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Video Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-title">Title *</Label>
                    <Input
                      id="video-title"
                      placeholder="Enter a descriptive title for your video"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-description">Description</Label>
                    <Textarea
                      id="video-description"
                      placeholder="Optional: Add a description to help our AI understand your content better"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={!title.trim()}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Processing
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary animate-pulse" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Processing Your Video</h3>
                  <p className="text-muted-foreground">
                    Our AI is analyzing your content to create viral clips
                  </p>
                </div>

                {/* Upload Progress */}
                {uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {/* Processing Progress */}
                {uploadProgress === 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>AI Processing...</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} />
                  </div>
                )}

                {/* Processing Steps */}
                <div className="space-y-3 text-left">
                  <div className={`flex items-center space-x-3 ${uploadProgress > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-2 w-2 rounded-full ${uploadProgress > 0 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Uploading video content</span>
                  </div>
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
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Processing Complete!</h3>
                  <p className="text-muted-foreground">
                    Your video has been successfully processed and clips are ready
                  </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">12</div>
                      <div className="text-xs text-muted-foreground">Clips Generated</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">89</div>
                      <div className="text-xs text-muted-foreground">Avg Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">3m</div>
                      <div className="text-xs text-muted-foreground">Processing Time</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-3">
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    handleClose();
                    // Navigate to project page
                    window.location.href = `/project/${uploadId}`;
                  }}>
                    View Clips
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoUploadModal;
