import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  Play, 
  Sparkles, 
  Zap, 
  Target, 
  TrendingUp, 
  Clock,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Upload,
  Scissors,
  Download,
  BarChart3,
  Shield,
  Rocket,
  Award,
  Globe,
  Smartphone,
  Video,
  Brain,
  DollarSign,
  Timer
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function LandingPage() {
  const [stats, setStats] = useState({
    videosProcessed: 0,
    clipsGenerated: 0,
    timesSaved: 0,
    avgEngagement: 0
  })

  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const featuresRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })
  const isStatsInView = useInView(statsRef, { once: true })
  const isFeaturesInView = useInView(featuresRef, { once: true })

  const finalStats = {
    videosProcessed: 12847,
    clipsGenerated: 156234,
    timesSaved: 8932,
    avgEngagement: 340
  }

  useEffect(() => {
    if (!isStatsInView) return

    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps

      setStats({
        videosProcessed: Math.floor(finalStats.videosProcessed * progress),
        clipsGenerated: Math.floor(finalStats.clipsGenerated * progress),
        timesSaved: Math.floor(finalStats.timesSaved * progress),
        avgEngagement: Math.floor(finalStats.avgEngagement * progress)
      })

      if (step >= steps) {
        clearInterval(timer)
        setStats(finalStats)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isStatsInView])

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Content Analysis',
      description: 'Advanced machine learning identifies the most engaging moments in your content automatically.',
      benefits: ['99.2% accuracy rate', 'Trained on 10M+ viral videos', 'Continuous learning']
    },
    {
      icon: Target,
      title: 'Viral Potential Scoring',
      description: 'Each clip receives a viral score based on proven engagement patterns and trending topics.',
      benefits: ['Predictive analytics', 'Real-time trend analysis', 'Platform-specific optimization']
    },
    {
      icon: Zap,
      title: 'Instant Clip Generation',
      description: 'Transform hours of content into dozens of ready-to-post clips in minutes, not days.',
      benefits: ['10x faster than manual editing', 'Batch processing', 'Queue management']
    },
    {
      icon: Smartphone,
      title: 'Multi-Platform Optimization',
      description: 'Automatically format and optimize clips for TikTok, Instagram, YouTube, and more.',
      benefits: ['Platform-specific ratios', 'Optimal durations', 'Custom branding']
    }
  ]

  const process = [
    {
      icon: Upload,
      title: 'Upload Your Content',
      description: 'Drop your video files or paste YouTube/Vimeo URLs',
      time: '30 seconds'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Our AI identifies viral moments and creates clips',
      time: '2-5 minutes'
    },
    {
      icon: Scissors,
      title: 'Smart Editing',
      description: 'Automatic captions, branding, and optimization',
      time: '1-2 minutes'
    },
    {
      icon: Download,
      title: 'Download & Share',
      description: 'Get viral-ready clips with performance predictions',
      time: 'Instant'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Content Creator',
      company: '@sarahcreates',
      avatar: '/avatars/sarah.jpg',
      content: 'ReelRemix transformed my 2-hour podcast into 50+ viral clips. My engagement increased by 400% and I gained 100K followers in just one month!',
      rating: 5,
      metrics: { followers: '100K+', engagement: '+400%', time: '95% saved' }
    },
    {
      name: 'Marcus Johnson',
      role: 'Digital Marketing Director',
      company: 'TechFlow Agency',
      avatar: '/avatars/marcus.jpg',
      content: 'The AI scoring is incredibly accurate. It consistently picks the moments that perform best. Our client content now gets 10x more reach.',
      rating: 5,
      metrics: { reach: '10x increase', accuracy: '95%', clients: '50+ happy' }
    },
    {
      name: 'Emily Rodriguez',
      role: 'YouTuber & Entrepreneur',
      company: '@emilybuilds',
      avatar: '/avatars/emily.jpg',
      content: 'What used to take me 8 hours now takes 10 minutes. The quality is better than what I could do manually. This is a game-changer.',
      rating: 5,
      metrics: { time: '8hrs → 10min', quality: 'Better than manual', revenue: '+250%' }
    }
  ]

  const competitors = [
    {
      name: 'Manual Editing',
      time: '8+ hours',
      cost: '$400+',
      quality: 'Variable',
      scale: 'Limited'
    },
    {
      name: 'Opus Clip',
      time: '30 minutes',
      cost: '$95/month',
      quality: 'Good',
      scale: 'Medium'
    },
    {
      name: 'ReelRemix',
      time: '5 minutes',
      cost: '$59/month',
      quality: 'Excellent',
      scale: 'Unlimited'
    }
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      price: 59,
      description: 'Perfect for solo creators',
      features: [
        '80 renders per month',
        '400 minutes source content',
        '3 preset styles',
        'MP4 + SRT export',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: 99,
      description: 'For growing creators & teams',
      features: [
        '240 renders per month',
        '1,200 minutes source content',
        'Team collaboration',
        'Priority processing',
        'Advanced analytics',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Business',
      price: 199,
      description: 'For agencies & enterprises',
      features: [
        'Unlimited renders',
        'Unlimited source content',
        'White-label solution',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee'
      ],
      popular: false
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20">
        <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-6 text-sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Trusted by 10,000+ Content Creators
              </Badge>
              
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
                Turn Your Videos Into
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block mt-2">
                  Viral Gold
                </span>
              </h1>
              
              <p className="mx-auto max-w-3xl text-xl text-muted-foreground sm:text-2xl mb-8">
                AI-powered video editing that transforms your long-form content into 
                <strong className="text-foreground"> dozens of viral clips</strong> in minutes. 
                Get 10x more reach, engagement, and followers.
              </p>

              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center mb-8">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-4 h-auto">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Creating for Free
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-4 h-auto"
                  onClick={() => {
                    // Open demo video modal or navigate to demo
                    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
                  }}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch 2-Min Demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Free 14-day trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 blur-3xl" />
        </div>
      </section>

      {/* Social Proof Stats */}
      <section ref={statsRef} className="border-y bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Content Creators Worldwide</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of creators who are already growing their audience with ReelRemix
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: 'Videos Processed', value: stats.videosProcessed.toLocaleString(), suffix: '+', icon: Video },
              { label: 'Clips Generated', value: stats.clipsGenerated.toLocaleString(), suffix: '+', icon: Zap },
              { label: 'Hours Saved', value: stats.timesSaved.toLocaleString(), suffix: '+', icon: Clock },
              { label: 'Avg. Engagement Increase', value: stats.avgEngagement, suffix: '%', icon: TrendingUp }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isStatsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {item.value}{item.suffix}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Stop Spending Hours on Manual Editing
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground">
                <p>
                  Content creators waste <strong className="text-foreground">8+ hours per week</strong> manually 
                  editing long-form content into short clips. Most clips never go viral because 
                  they miss the key moments that drive engagement.
                </p>
                <p>
                  <strong className="text-foreground">ReelRemix changes everything.</strong> Our AI analyzes 
                  your content like a viral video expert, identifying the exact moments that will 
                  capture attention and drive shares.
                </p>
              </div>
              
              <div className="mt-8 space-y-4">
                {[
                  'AI identifies viral moments with 99.2% accuracy',
                  'Generate 20+ clips from one video in 5 minutes',
                  'Automatic captions, branding, and optimization',
                  'Platform-specific formatting for maximum reach'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-16 w-16 text-white" fill="currentColor" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg">
                <div className="text-2xl font-bold text-green-500">+340%</div>
                <div className="text-sm text-muted-foreground">Avg. Engagement</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="bg-muted/50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powerful Features That Drive Results
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create viral content at scale, powered by cutting-edge AI
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isFeaturesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{feature.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base mb-4">
                        {feature.description}
                      </CardDescription>
                      <div className="space-y-2">
                        {feature.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              From Upload to Viral in 4 Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground">
              Our streamlined process gets you results in minutes, not hours
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {process.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-6">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground mb-2">{step.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    <Timer className="mr-1 h-3 w-3" />
                    {step.time}
                  </Badge>
                  
                  {index < process.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-8 -right-4 h-6 w-6 text-muted-foreground" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Choose ReelRemix?
            </h2>
            <p className="text-xl text-muted-foreground">
              See how we compare to traditional editing and competitors
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-5 gap-4 mb-4">
              <div className="font-semibold">Solution</div>
              <div className="font-semibold text-center">Time Required</div>
              <div className="font-semibold text-center">Monthly Cost</div>
              <div className="font-semibold text-center">Quality</div>
              <div className="font-semibold text-center">Scalability</div>
            </div>
            
            {competitors.map((competitor, index) => (
              <div 
                key={competitor.name}
                className={`grid grid-cols-5 gap-4 p-4 rounded-lg ${
                  competitor.name === 'ReelRemix' 
                    ? 'bg-primary/10 border-2 border-primary' 
                    : 'bg-background border'
                }`}
              >
                <div className="font-medium flex items-center">
                  {competitor.name === 'ReelRemix' && (
                    <Award className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {competitor.name}
                </div>
                <div className="text-center">{competitor.time}</div>
                <div className="text-center">{competitor.cost}</div>
                <div className="text-center">{competitor.quality}</div>
                <div className="text-center">{competitor.scale}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Loved by Content Creators Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See the real results our users are achieving
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <blockquote className="text-muted-foreground mb-6">
                      "{testimonial.content}"
                    </blockquote>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-400" />
                      <div>
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                      </div>
                    </div>

                    <Separator className="mb-4" />
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      {Object.entries(testimonial.metrics).map(([key, value]) => (
                        <div key={key}>
                          <div className="font-semibold text-primary">{value}</div>
                          <div className="text-muted-foreground capitalize">{key}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your content creation needs
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${plan.popular ? 'lg:scale-105' : ''}`}
              >
                <Card className={`h-full ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to="/auth?mode=signup">
                      <Button 
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                            : ''
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        {plan.popular && <Sparkles className="mr-2 h-4 w-4" />}
                        Start Free Trial
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <Link to="/pricing" className="text-primary hover:underline">
              View detailed pricing comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-16 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to 10x Your Content Reach?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already using ReelRemix to grow their audience 
              and build their brand with viral content.
            </p>
            
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4 h-auto">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Free Trial
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4 h-auto">
                  View Pricing
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 mt-8 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                No setup fees
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
