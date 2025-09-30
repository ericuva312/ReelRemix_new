import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  Calculator,
  TrendingUp,
  Users,
  Clock,
  Star
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [videoMinutes, setVideoMinutes] = useState([120]) // Default 2 hours per month
  const [teamSize, setTeamSize] = useState([1])

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for solo creators and podcasters',
      monthlyPrice: 59,
      annualPrice: 49,
      features: [
        '80 renders per month',
        '400 minutes source content',
        '3 preset styles',
        'MP4 + SRT export',
        'Interactive demo access',
        'Email support',
        'Basic analytics'
      ],
      limits: {
        renders: 80,
        minutes: 400,
        seats: 1,
        presets: 3
      },
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Pro',
      description: 'For creators and teams posting regularly',
      monthlyPrice: 99,
      annualPrice: 79,
      features: [
        '240 renders per month',
        '1,200 minutes source content',
        'Team library access',
        'Preset manager',
        'Priority queue',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access'
      ],
      limits: {
        renders: 240,
        minutes: 1200,
        seats: 3,
        presets: 'unlimited'
      },
      popular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'Business',
      description: 'For agencies and large content teams',
      monthlyPrice: 199,
      annualPrice: 159,
      features: [
        'Unlimited renders',
        'Unlimited source content',
        'Unlimited team members',
        'White-label solution',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'SLA guarantee',
        'Custom AI training'
      ],
      limits: {
        renders: 'unlimited',
        minutes: 'unlimited',
        seats: 'unlimited',
        presets: 'unlimited'
      },
      popular: false,
      cta: 'Contact Sales'
    }
  ]

  const calculateROI = () => {
    const monthlyMinutes = videoMinutes[0]
    const clipsPerHour = 8 // Average clips per hour of content
    const totalClips = (monthlyMinutes / 60) * clipsPerHour
    const timePerClip = 45 // Minutes to create manually
    const hourlyRate = 50 // Assumed hourly rate
    
    const timeSaved = (totalClips * timePerClip) / 60 // Hours saved
    const costSaved = timeSaved * hourlyRate
    const planCost = isAnnual ? plans[1].annualPrice : plans[1].monthlyPrice
    const roi = ((costSaved - planCost) / planCost) * 100

    return {
      clipsGenerated: Math.round(totalClips),
      timeSaved: Math.round(timeSaved),
      costSaved: Math.round(costSaved),
      roi: Math.round(roi)
    }
  }

  const roiData = calculateROI()

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="mr-1 h-3 w-3" />
                Simple, Transparent Pricing
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Choose Your
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {' '}Growth Plan
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Start free, scale as you grow. All plans include our core AI features with no hidden fees.
              </p>
            </motion.div>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex items-center justify-center space-x-4"
            >
              <span className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge variant="secondary" className="ml-2">
                  Save 20%
                </Badge>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'lg:scale-105' : ''}`}
              >
                <Card className={`h-full ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                        <Crown className="mr-1 h-3 w-3" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {isAnnual && (
                        <div className="text-sm text-muted-foreground">
                          Billed annually (${plan.annualPrice * 12})
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      {plan.cta === 'Contact Sales' ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            // Open contact form or redirect to contact page
                            window.location.href = '/contact'
                          }}
                        >
                          Contact Sales
                        </Button>
                      ) : (
                        <Link to="/auth?mode=signup">
                          <Button 
                            className={`w-full ${
                              plan.popular 
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                                : ''
                            }`}
                            variant={plan.popular ? 'default' : 'outline'}
                            onClick={() => {
                              // Track pricing plan selection
                              console.log(`Selected plan: ${plan.name}`)
                            }}
                          >
                            {plan.popular && <Sparkles className="mr-2 h-4 w-4" />}
                            {plan.cta}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Calculate Your ROI
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how much time and money ReelRemix can save your content creation workflow
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
            {/* Calculator Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Your Content Volume
                </CardTitle>
                <CardDescription>
                  Adjust the sliders to match your content creation needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">
                      Video Content per Month
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {videoMinutes[0]} minutes
                    </span>
                  </div>
                  <Slider
                    value={videoMinutes}
                    onValueChange={setVideoMinutes}
                    max={600}
                    min={30}
                    step={30}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>30 min</span>
                    <span>10 hours</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">
                      Team Size
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {teamSize[0]} {teamSize[0] === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <Slider
                    value={teamSize}
                    onValueChange={setTeamSize}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 person</span>
                    <span>10+ people</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ROI Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Your Potential Savings
                </CardTitle>
                <CardDescription>
                  Based on your content volume and industry averages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {roiData.clipsGenerated}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Clips Generated
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {roiData.timeSaved}h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Time Saved
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-green-500">
                      ${roiData.costSaved}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cost Savings
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-green-500">
                      {roiData.roi}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ROI
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                  <div className="text-sm text-center">
                    <strong>Monthly Savings: ${roiData.costSaved - (isAnnual ? plans[1].annualPrice : plans[1].monthlyPrice)}</strong>
                    <br />
                    <span className="text-muted-foreground">
                      vs. manual editing at $50/hour
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link to="/auth?mode=signup">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start Saving Today
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about our pricing and features
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "What counts as a 'render'?",
                answer: "A render is one completed short-form clip generated from your content. Each clip includes automatic captions, branding, and platform optimization."
              },
              {
                question: "Can I change plans anytime?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
              },
              {
                question: "What video formats do you support?",
                answer: "We support all major video formats including MP4, MOV, AVI, and more. You can also upload directly from YouTube, Vimeo, or other platforms."
              },
              {
                question: "Is there a free trial?",
                answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to start, and you can cancel anytime."
              },
              {
                question: "Do you offer refunds?",
                answer: "We offer a 30-day money-back guarantee. If you're not satisfied with ReelRemix, we'll refund your payment in full."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-16 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Content?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
              Join thousands of creators who are already growing their audience with AI-powered video editing.
            </p>
            <div className="mt-8">
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="secondary">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
