import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Twitter, Github, Linkedin, Mail, Heart } from 'lucide-react'

export default function Footer() {
  const [hoveredSection, setHoveredSection] = useState(null)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Demo', href: '/#demo' },
      { name: 'API', href: '/api' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Status', href: '/status' },
      { name: 'Community', href: '/community' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' },
    ],
  }

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
  ]

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Play className="h-4 w-4 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-xl font-bold">ReelRemix</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Transform your long-form content into viral short clips with AI-powered video editing.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      // Handle social media link clicks
                      console.log(`Clicked ${item.name} social link`);
                      // In production, these would link to actual social media pages
                      if (item.name === 'Twitter') {
                        window.open('https://twitter.com/reelremix', '_blank');
                      } else if (item.name === 'GitHub') {
                        window.open('https://github.com/reelremix', '_blank');
                      } else if (item.name === 'LinkedIn') {
                        window.open('https://linkedin.com/company/reelremix', '_blank');
                      }
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors hover:scale-110 transform"
                  >
                    <span className="sr-only">{item.name}</span>
                    <Icon className="h-5 w-5" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-4 lg:grid-cols-4">
            <div 
              onMouseEnter={() => setHoveredSection('product')}
              onMouseLeave={() => setHoveredSection(null)}
              className={`transition-all duration-200 ${hoveredSection === 'product' ? 'transform scale-105' : ''}`}
            >
              <h3 className="text-sm font-semibold">Product</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div 
              onMouseEnter={() => setHoveredSection('company')}
              onMouseLeave={() => setHoveredSection(null)}
              className={`transition-all duration-200 ${hoveredSection === 'company' ? 'transform scale-105' : ''}`}
            >
              <h3 className="text-sm font-semibold">Company</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div 
              onMouseEnter={() => setHoveredSection('support')}
              onMouseLeave={() => setHoveredSection(null)}
              className={`transition-all duration-200 ${hoveredSection === 'support' ? 'transform scale-105' : ''}`}
            >
              <h3 className="text-sm font-semibold">Support</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.support.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div 
              onMouseEnter={() => setHoveredSection('legal')}
              onMouseLeave={() => setHoveredSection(null)}
              className={`transition-all duration-200 ${hoveredSection === 'legal' ? 'transform scale-105' : ''}`}
            >
              <h3 className="text-sm font-semibold">Legal</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} ReelRemix Corporation. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for content creators worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
