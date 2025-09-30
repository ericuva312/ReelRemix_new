# ReelRemix Production Deployment Checklist

## 🚀 Complete Guide to Deploy ReelRemix to Production

This checklist covers everything needed to take ReelRemix from local development to a live, publicly accessible production environment.

## Phase 1: Domain & DNS Setup

### 1.1 Domain Registration
- [ ] **Purchase Domain Name** (e.g., reelremix.com)
  - Recommended registrars: Namecheap, GoDaddy, or Google Domains
  - Cost: ~$10-15/year
  - Consider purchasing common variations (.net, .org) for brand protection

### 1.2 DNS Configuration
- [ ] **Set up DNS records** pointing to your hosting provider
  - A record: `@` → Your server IP
  - CNAME record: `www` → Your domain
  - CNAME record: `api` → Your domain (for API subdomain)
  - CNAME record: `ai` → Your domain (for AI service subdomain)

## Phase 2: Cloud Infrastructure Setup

### 2.1 AWS Account Setup
- [ ] **Create AWS Account** (if not already done)
- [ ] **Set up billing alerts** to monitor costs
- [ ] **Create IAM user** with appropriate permissions for deployment
- [ ] **Generate access keys** for programmatic access

### 2.2 Required AWS Services
- [ ] **VPC Setup** - Virtual Private Cloud for network isolation
- [ ] **RDS PostgreSQL** - Managed database service
- [ ] **ElastiCache Redis** - Managed Redis for caching
- [ ] **S3 Bucket** - File storage for videos and clips
- [ ] **CloudFront** - CDN for global content delivery
- [ ] **ECS Cluster** - Container orchestration
- [ ] **Application Load Balancer** - Traffic distribution
- [ ] **Route 53** - DNS management (optional, can use domain registrar)

### 2.3 Estimated AWS Costs (Monthly)
- **RDS (db.t3.micro)**: ~$15-20
- **ElastiCache (cache.t3.micro)**: ~$15
- **ECS Fargate**: ~$30-50 (depending on usage)
- **S3 Storage**: ~$5-20 (depending on video volume)
- **CloudFront**: ~$5-15
- **Load Balancer**: ~$20
- **Total estimated**: ~$90-140/month initially

## Phase 3: External Service Accounts

### 3.1 Payment Processing (Stripe)
- [ ] **Create Stripe Account**
  - Go to stripe.com and create business account
  - Complete business verification process
  - Get API keys (publishable and secret)
  - Set up webhook endpoints

### 3.2 AI Services (OpenAI)
- [ ] **Create OpenAI Account**
  - Sign up at platform.openai.com
  - Add payment method for API usage
  - Generate API key
  - Estimated cost: $50-200/month depending on video volume

### 3.3 Monitoring Services
- [ ] **DataDog Account** (optional but recommended)
  - 14-day free trial, then ~$15/month per host
- [ ] **Sentry Account** (optional but recommended)
  - Free tier available, paid plans start at $26/month

## Phase 4: Environment Configuration

### 4.1 Production Environment Variables
Create `.env.production` file with:

```bash
# Application
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
AI_SERVICE_URL=https://ai.yourdomain.com

# Database
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/reelremix
REDIS_URL=redis://your-elasticache-endpoint:6379

# Authentication
JWT_SECRET=your-super-secure-production-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# OpenAI
OPENAI_API_KEY=sk-your_production_openai_api_key

# AWS
AWS_ACCESS_KEY_ID=AKIA_your_production_access_key
AWS_SECRET_ACCESS_KEY=your_production_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET=your-production-reelremix-bucket
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net

# Monitoring (optional)
DATADOG_API_KEY=your_datadog_api_key
SENTRY_DSN=your_sentry_dsn

# Email (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 4.2 SSL Certificate
- [ ] **Request SSL Certificate** through AWS Certificate Manager
  - Free SSL certificates for domains
  - Automatic renewal
  - Validate domain ownership

## Phase 5: Database Setup

### 5.1 Production Database
- [ ] **Create RDS PostgreSQL instance**
  - Instance class: db.t3.micro (can scale up later)
  - Storage: 20GB initially (auto-scaling enabled)
  - Multi-AZ deployment for high availability
  - Automated backups enabled

### 5.2 Database Migration
- [ ] **Run database migrations**
  ```bash
  cd apps/worker
  npx prisma migrate deploy
  npx prisma generate
  ```

### 5.3 Seed Data
- [ ] **Add initial data**
  - Subscription plans
  - Default settings
  - Admin user account

## Phase 6: Container Deployment

### 6.1 Build and Push Images
- [ ] **Build Docker images**
  ```bash
  # Frontend
  cd apps/web
  docker build -t reelremix-frontend .
  
  # Backend API
  cd apps/worker
  docker build -t reelremix-api .
  
  # AI Service
  cd apps/python
  docker build -t reelremix-ai .
  ```

- [ ] **Push to AWS ECR**
  ```bash
  # Create ECR repositories
  aws ecr create-repository --repository-name reelremix-frontend
  aws ecr create-repository --repository-name reelremix-api
  aws ecr create-repository --repository-name reelremix-ai
  
  # Tag and push images
  docker tag reelremix-frontend:latest your-account.dkr.ecr.region.amazonaws.com/reelremix-frontend:latest
  docker push your-account.dkr.ecr.region.amazonaws.com/reelremix-frontend:latest
  ```

### 6.2 ECS Service Deployment
- [ ] **Create ECS task definitions** for each service
- [ ] **Deploy ECS services** with auto-scaling
- [ ] **Configure load balancer** target groups
- [ ] **Set up health checks** for all services

## Phase 7: CI/CD Pipeline Setup

### 7.1 GitHub Repository
- [ ] **Push code to GitHub** (if not already done)
- [ ] **Set up branch protection** rules
- [ ] **Configure repository secrets**:
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - STRIPE_SECRET_KEY
  - OPENAI_API_KEY
  - DATABASE_URL
  - All other production environment variables

### 7.2 GitHub Actions
- [ ] **Configure deployment workflow** (already created in `.github/workflows/deploy.yml`)
- [ ] **Test deployment pipeline** with staging environment first
- [ ] **Set up production deployment** triggers

## Phase 8: Monitoring & Alerting

### 8.1 Health Monitoring
- [ ] **Configure CloudWatch alarms** for:
  - High CPU usage
  - High memory usage
  - Database connection issues
  - High error rates

### 8.2 Application Monitoring
- [ ] **Set up DataDog** (if using)
  - Install DataDog agent on ECS tasks
  - Configure custom dashboards
  - Set up alert notifications

### 8.3 Error Tracking
- [ ] **Configure Sentry** (if using)
  - Add Sentry DSN to environment variables
  - Test error reporting

## Phase 9: Security Configuration

### 9.1 Network Security
- [ ] **Configure security groups** with minimal required access
- [ ] **Set up WAF** (Web Application Firewall) rules
- [ ] **Enable VPC Flow Logs** for network monitoring

### 9.2 Application Security
- [ ] **Rotate all secrets** and API keys for production
- [ ] **Enable HTTPS** everywhere with SSL certificates
- [ ] **Configure CORS** policies for production domains
- [ ] **Set up rate limiting** to prevent abuse

## Phase 10: Testing & Validation

### 10.1 Pre-Launch Testing
- [ ] **Run configuration validation**
  ```bash
  node scripts/validate-config.js
  ```

- [ ] **Run health checks**
  ```bash
  node scripts/health-check.js
  ```

- [ ] **Test all user flows**:
  - User registration and login
  - Video upload and processing
  - Payment and subscription
  - Clip generation and download

### 10.2 Performance Testing
- [ ] **Load testing** with expected user volumes
- [ ] **Database performance** validation
- [ ] **CDN configuration** testing
- [ ] **Mobile responsiveness** verification

## Phase 11: Go-Live Checklist

### 11.1 Final Preparations
- [ ] **Backup current state** of all systems
- [ ] **Prepare rollback plan** in case of issues
- [ ] **Schedule maintenance window** (if needed)
- [ ] **Notify team** of go-live timeline

### 11.2 Launch Day
- [ ] **Deploy to production** using CI/CD pipeline
- [ ] **Verify all services** are running correctly
- [ ] **Test critical user paths** end-to-end
- [ ] **Monitor error rates** and performance metrics
- [ ] **Update DNS** to point to production (if using staging domain)

### 11.3 Post-Launch
- [ ] **Monitor for 24 hours** continuously
- [ ] **Check payment processing** is working
- [ ] **Verify email notifications** are being sent
- [ ] **Test customer support** channels

## Quick Start Deployment Options

### Option 1: Simplified Deployment (Recommended for MVP)
**Use managed services to reduce complexity:**

1. **Frontend**: Deploy to **Vercel** or **Netlify**
   - Cost: Free tier available, ~$20/month for pro features
   - Automatic SSL, CDN, and deployments from GitHub
   - Simple environment variable configuration

2. **Backend**: Deploy to **Railway** or **Render**
   - Cost: ~$20-50/month
   - Managed PostgreSQL and Redis included
   - Automatic deployments from GitHub

3. **AI Service**: Deploy to **Railway** or **Google Cloud Run**
   - Cost: ~$30-100/month depending on usage
   - Automatic scaling and container management

**Total estimated cost: ~$70-170/month**

### Option 2: Full AWS Deployment (Recommended for Scale)
**Use the complete AWS infrastructure as designed:**
- Follow the full checklist above
- More complex but highly scalable
- Better for long-term growth
- **Total estimated cost: ~$90-140/month initially**

## Immediate Next Steps

### To deploy in the next 24 hours:

1. **Choose deployment option** (Simplified vs Full AWS)
2. **Purchase domain name** (~$15)
3. **Create necessary accounts** (Stripe, OpenAI, hosting provider)
4. **Set up environment variables** for production
5. **Deploy using chosen method**

### Minimum viable deployment requirements:
- Domain name
- Stripe account (can use test mode initially)
- OpenAI API key
- Hosting service account
- 2-4 hours of setup time

Would you like me to help you with any specific part of this deployment process, or would you prefer to start with the simplified deployment option to get online quickly?
