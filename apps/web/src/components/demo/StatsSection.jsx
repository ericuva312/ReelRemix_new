import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Clock, Zap } from 'lucide-react'

export default function StatsSection() {
  const [stats, setStats] = useState({
    videosProcessed: 0,
    clipsGenerated: 0,
    timesSaved: 0,
    avgEngagement: 0
  })

  const finalStats = {
    videosProcessed: 12847,
    clipsGenerated: 156234,
    timesSaved: 8932,
    avgEngagement: 340
  }

  useEffect(() => {
    const duration = 2000 // 2 seconds
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
  }, [])

  const statItems = [
    {
      icon: Users,
      value: stats.videosProcessed.toLocaleString(),
      label: 'Videos Processed',
      suffix: '+'
    },
    {
      icon: Zap,
      value: stats.clipsGenerated.toLocaleString(),
      label: 'Clips Generated',
      suffix: '+'
    },
    {
      icon: Clock,
      value: stats.timesSaved.toLocaleString(),
      label: 'Hours Saved',
      suffix: '+'
    },
    {
      icon: TrendingUp,
      value: stats.avgEngagement,
      label: 'Avg. Engagement Increase',
      suffix: '%'
    }
  ]

  return (
    <section className="border-y bg-muted/30 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Trusted by Content Creators Worldwide</h2>
          <p className="text-muted-foreground">
            Join thousands of creators who are already growing their audience with ReelRemix
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {statItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center cursor-pointer p-4 rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => {
                  // Add interactive functionality for stats
                  console.log(`Clicked on ${item.label} stat`);
                }}
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
  )
}
