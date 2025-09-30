#!/bin/bash

# ReelRemix Quick MVP Deployment Script
# Deploys to free/low-cost platforms for immediate testing

echo "🚀 ReelRemix Quick MVP Deployment"
echo "=================================="

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "🔍 Checking required tools..."
check_tool "npm"
check_tool "git"

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial ReelRemix commit"
fi

echo ""
echo "🎯 Choose your deployment option:"
echo "1. Vercel (Frontend) + Railway (Backend) - Recommended"
echo "2. Netlify (Frontend) + Render (Backend)"
echo "3. GitHub Pages (Frontend) + Heroku (Backend)"
echo "4. All-in-one Docker deployment"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel + Railway..."
        deploy_vercel_railway
        ;;
    2)
        echo "🚀 Deploying to Netlify + Render..."
        deploy_netlify_render
        ;;
    3)
        echo "🚀 Deploying to GitHub Pages + Heroku..."
        deploy_github_heroku
        ;;
    4)
        echo "🚀 Setting up Docker deployment..."
        deploy_docker
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

deploy_vercel_railway() {
    echo "📦 Setting up Vercel deployment..."
    
    # Install Vercel CLI if not present
    if ! command -v vercel &> /dev/null; then
        echo "📥 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Build frontend
    echo "🔨 Building frontend..."
    cd apps/web
    npm install
    npm run build
    
    # Create vercel.json configuration
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "dist/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.railway.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-backend-url.railway.app"
  }
}
EOF
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    cd ../..
    
    # Railway deployment
    echo "🚂 Setting up Railway deployment..."
    
    if ! command -v railway &> /dev/null; then
        echo "📥 Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Create Railway configuration
    cd apps/worker
    
    cat > railway.json << 'EOF'
{
  "deploy": {
    "startCommand": "node test-server-final.cjs",
    "healthcheckPath": "/health"
  }
}
EOF
    
    cat > Procfile << 'EOF'
web: node test-server-final.cjs
EOF
    
    echo "🚂 Deploying to Railway..."
    railway login
    railway new
    railway up
    
    cd ../..
    
    echo "✅ Deployment complete!"
    echo "📱 Frontend: Check Vercel dashboard for URL"
    echo "🔧 Backend: Check Railway dashboard for URL"
    echo "⚠️  Don't forget to update the API URL in Vercel settings!"
}

deploy_netlify_render() {
    echo "📦 Setting up Netlify + Render deployment..."
    
    # Build frontend
    cd apps/web
    npm install
    npm run build
    
    # Create netlify.toml
    cat > netlify.toml << 'EOF'
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.onrender.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
    
    echo "🌐 Deploy to Netlify:"
    echo "1. Go to https://netlify.com"
    echo "2. Connect your GitHub repository"
    echo "3. Set build directory to 'apps/web/dist'"
    echo "4. Set build command to 'npm run build'"
    
    cd ../worker
    
    # Create render.yaml
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: reelremix-api
    env: node
    buildCommand: npm install
    startCommand: node test-server-final.cjs
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
EOF
    
    echo "🔧 Deploy to Render:"
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub repository"
    echo "3. Select 'apps/worker' as root directory"
    echo "4. Use the render.yaml configuration"
    
    cd ../..
}

deploy_github_heroku() {
    echo "📦 Setting up GitHub Pages + Heroku deployment..."
    
    # Frontend to GitHub Pages
    cd apps/web
    npm install
    npm run build
    
    # Create GitHub Actions workflow
    mkdir -p .github/workflows
    cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install and Build
      run: |
        cd apps/web
        npm install
        npm run build
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./apps/web/dist
EOF
    
    cd ../worker
    
    # Create Heroku configuration
    cat > Procfile << 'EOF'
web: node test-server-final.cjs
EOF
    
    cat > package.json << 'EOF'
{
  "name": "reelremix-backend",
  "version": "1.0.0",
  "description": "ReelRemix Backend API",
  "main": "test-server-final.cjs",
  "scripts": {
    "start": "node test-server-final.cjs"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": "18.x"
  }
}
EOF
    
    echo "🔧 Deploy to Heroku:"
    echo "1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
    echo "2. Run: heroku create your-app-name"
    echo "3. Run: git subtree push --prefix apps/worker heroku main"
    
    cd ../..
}

deploy_docker() {
    echo "🐳 Setting up Docker deployment..."
    
    # Create docker-compose for development
    cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:3001
    depends_on:
      - backend

  backend:
    build:
      context: ./apps/worker
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
    volumes:
      - ./apps/worker:/app
      - /app/node_modules

  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=reelremix
      - POSTGRES_USER=reelremix
      - POSTGRES_PASSWORD=password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF
    
    # Create frontend Dockerfile
    cat > apps/web/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
EOF
    
    # Create backend Dockerfile
    cat > apps/worker/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001
CMD ["node", "test-server-final.cjs"]
EOF
    
    echo "🐳 Docker setup complete!"
    echo "🚀 To run locally:"
    echo "   docker-compose -f docker-compose.dev.yml up"
    echo ""
    echo "☁️  For cloud deployment:"
    echo "1. DigitalOcean App Platform"
    echo "2. AWS ECS/Fargate"
    echo "3. Google Cloud Run"
    echo "4. Azure Container Instances"
}

# Create environment setup script
create_env_setup() {
    cat > setup-env.sh << 'EOF'
#!/bin/bash

echo "🔧 Setting up environment variables..."

# Create .env files for different environments
cat > .env.development << 'ENVEOF'
# Development Environment
NODE_ENV=development
PORT=3001

# Database (use Supabase free tier)
DATABASE_URL=postgresql://username:password@host:5432/database

# Stripe (test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# File Storage (optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
ENVEOF

cat > .env.production << 'ENVEOF'
# Production Environment
NODE_ENV=production
PORT=3001

# Database (production)
DATABASE_URL=postgresql://username:password@host:5432/database

# Stripe (live mode)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# JWT (generate a strong secret)
JWT_SECRET=your-super-secure-production-jwt-key

# OpenAI
OPENAI_API_KEY=sk-...

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-production-bucket
ENVEOF

echo "✅ Environment files created!"
echo "📝 Please edit .env.development and .env.production with your actual values"
EOF

    chmod +x setup-env.sh
}

# Create quick test script
create_test_script() {
    cat > test-deployment.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing ReelRemix Deployment..."

# Test backend health
echo "🔍 Testing backend health..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Test frontend
echo "🔍 Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend not accessible"
fi

# Test API endpoints
echo "🔍 Testing API endpoints..."
if curl -f http://localhost:3001/api/system/endpoints > /dev/null 2>&1; then
    echo "✅ API endpoints working"
else
    echo "❌ API endpoints not working"
fi

echo "🎯 Test complete!"
EOF

    chmod +x test-deployment.sh
}

# Create the additional scripts
create_env_setup
create_test_script

echo ""
echo "🎉 Quick MVP Deployment Setup Complete!"
echo ""
echo "📋 What was created:"
echo "   - Deployment configurations for multiple platforms"
echo "   - Environment setup scripts"
echo "   - Docker configurations"
echo "   - Testing scripts"
echo ""
echo "🚀 Next Steps:"
echo "1. Choose a deployment platform and follow the instructions"
echo "2. Run: ./setup-env.sh to configure environment variables"
echo "3. Deploy using your chosen method"
echo "4. Test with: ./test-deployment.sh"
echo ""
echo "💰 Estimated Monthly Costs:"
echo "   - Vercel + Railway: $0-20/month"
echo "   - Netlify + Render: $0-15/month"
echo "   - GitHub Pages + Heroku: $0-7/month"
echo "   - Docker on DigitalOcean: $5-10/month"
echo ""
echo "🎯 You can be live in 30 minutes with the free tiers!"
