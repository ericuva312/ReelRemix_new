import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { 
  Target, 
  Users, 
  Lightbulb, 
  Award,
  Heart,
  Zap,
  Globe,
  TrendingUp,
  Shield,
  Rocket,
  Star,
  CheckCircle,
  ArrowRight,
  Mail,
  Linkedin,
  Twitter
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function AboutPage() {
  const heroRef = useRef(null)
  const valuesRef = useRef(null)
  const teamRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })
  const isValuesInView = useInView(valuesRef, { once: true })
  const isTeamInView = useInView(teamRef, { once: true })

  const values = [
    {
      icon: Lightbulb,
      title: 'Innovation First',
      description: 'We push the boundaries of what\'s possible with AI and video technology to create tools that truly make a difference.'
    },
    {
      icon: Users,
      title: 'Creator-Centric',
      description: 'Every feature we build is designed with content creators in mind, solving real problems they face every day.'
    },
    {
      icon: Heart,
      title: 'Authentic Growth',
      description: 'We believe in helping creators grow authentically by amplifying their best content, not manufacturing fake engagement.'
    },
    {
      icon: Shield,
      title: 'Trust & Transparency',
      description: 'We\'re committed to being transparent about our AI, our pricing, and our mission to empower creators.'
    }
  ]

  const milestones = [
    {
      year: '2023',
      title: 'The Spark',
      description: 'Founded by content creators frustrated with spending hours on manual video editing.',
      icon: Lightbulb
    },
    {
      year: '2024',
      title: 'AI Breakthrough',
      description: 'Developed our proprietary viral moment detection algorithm with 99.2% accuracy.',
      icon: Zap
    },
    {
      year: '2024',
      title: 'Community Growth',
      description: 'Reached 10,000+ active creators and processed over 1 million minutes of content.',
      icon: Users
    },
    {
      year: '2024',
      title: 'Global Impact',
      description: 'Helped creators generate over 100 million views and grow their audiences by 340% on average.',
      icon: Globe
    }
  ]

  const team = [
    {
      name: 'Alex Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former YouTube creator with 2M+ subscribers. Built ReelRemix after spending countless hours manually editing content.',
      image: '/team/alex.jpg',
      social: {
        twitter: '@alexchen',
        linkedin: 'alexchen'
      }
    },
    {
      name: 'Sarah Kim',
      role: 'CTO & Co-Founder',
      bio: 'Ex-Google AI researcher specializing in computer vision and video analysis. PhD in Machine Learning from Stanford.',
      image: '/team/sarah.jpg',
      social: {
        twitter: '@sarahkim',
        linkedin: 'sarahkim'
      }
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Head of Product',
      bio: 'Former TikTok product manager who helped scale their creator tools to 1B+ users. Expert in viral content patterns.',
      image: '/team/marcus.jpg',
      social: {
        twitter: '@marcusr',
        linkedin: 'marcusrodriguez'
      }
    },
    {
      name: 'Emily Zhang',
      role: 'Head of Engineering',
      bio: 'Full-stack engineer with 10+ years at Netflix and Spotify. Passionate about building scalable creator tools.',
      image: '/team/emily.jpg',
      social: {
        twitter: '@emilyzhang',
        linkedin: 'emilyzhang'
      }
    }
  ]

  const stats = [
    { label: 'Active Creators', value: '10,000+', icon: Users },
    { label: 'Videos Processed', value: '50,000+', icon: Target },
    { label: 'Total Views Generated', value: '100M+', icon: TrendingUp },
    { label: 'Average Growth', value: '340%', icon: Rocket }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20">
        <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-6 text-sm">
                <Heart className="mr-2 h-4 w-4" />
                Built by Creators, for Creators
              </Badge>
              
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6">
                Empowering the Next Generation of
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block mt-2">
                  Content Creators
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground sm:text-2xl mb-8">
                We're on a mission to democratize viral content creation by giving every creator 
                access to AI-powered tools that were once only available to major media companies.
              </p>

              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-4 h-auto"
                  onClick={() => {
                    window.location.href = '/contact'
                  }}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Get in Touch
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-4 h-auto"
                  onClick={() => {
                    // Open community link or Discord
                    window.open('https://discord.gg/reelremix', '_blank')
                  }}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Join Our Community
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 blur-3xl" />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Story</h2>
              <p className="text-xl text-muted-foreground">
                How two frustrated content creators decided to change the game
              </p>
            </div>

            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="text-xl leading-relaxed mb-8">
                It started with a simple frustration. As content creators ourselves, we were spending 
                <strong className="text-foreground"> 8+ hours every week</strong> manually editing our 
                long-form content into short clips for social media. Even worse, most of our clips 
                weren't performing well because we were guessing at which moments would resonate.
              </p>

              <p className="text-xl leading-relaxed mb-8">
                We knew there had to be a better way. What if AI could analyze content like a viral 
                video expert? What if it could identify the exact moments that drive engagement and 
                automatically create optimized clips?
              </p>

              <p className="text-xl leading-relaxed mb-8">
                After months of research and development, we created ReelRemix. Our AI doesn't just 
                cut videos randomly – it understands what makes content viral. It analyzes speech 
                patterns, visual elements, and engagement triggers to identify the moments that will 
                capture attention and drive shares.
              </p>

              <p className="text-xl leading-relaxed">
                Today, ReelRemix helps over 10,000 creators save time and grow their audiences. 
                We've processed millions of minutes of content and helped generate over 100 million 
                views. But we're just getting started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section ref={valuesRef} className="bg-muted/50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Mission & Values</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We believe every creator deserves access to the tools and technology needed to share 
              their voice with the world
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-none">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-lg text-muted-foreground">
                  To democratize viral content creation by making AI-powered video editing tools 
                  accessible to creators of all sizes, helping them amplify their authentic voice 
                  and grow meaningful audiences.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isValuesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{value.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {value.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-xl text-muted-foreground">
              Key milestones in our mission to empower creators
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon
                return (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-8"
                  >
                    <div className="flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <Badge variant="secondary">{milestone.year}</Badge>
                        <h3 className="text-xl font-semibold">{milestone.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section ref={teamRef} className="bg-muted/50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground">
              The passionate people behind ReelRemix
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isTeamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                    
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          window.open(`https://twitter.com/${member.social.twitter}`, '_blank')
                        }}
                      >
                        <Twitter className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          window.open(`https://linkedin.com/in/${member.social.linkedin}`, '_blank')
                        }}
                      >
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-16 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Want to Learn More?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              We'd love to hear from you. Whether you're a creator, investor, or just curious 
              about what we're building, let's connect.
            </p>
            
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4 h-auto">
                <Mail className="mr-2 h-5 w-5" />
                hello@reelremix.com
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4 h-auto">
                <Users className="mr-2 h-5 w-5" />
                Join Our Community
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 mt-8 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Always hiring great talent
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Open to partnerships
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Creator-friendly company
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
