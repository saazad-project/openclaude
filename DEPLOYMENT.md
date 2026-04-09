# OpenClaude Web - Deployment Guide

## 🚀 Deployment Options

### 1. Vercel (Recommended - Easiest)

Vercel is the creator of Next.js and provides the best deployment experience.

#### Prerequisites
- Vercel account (free at vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

#### Steps

**Option A: Via Dashboard**
```bash
# 1. Push your code to GitHub
git push origin main

# 2. Go to https://vercel.com/new
# 3. Select "Import Git Repository"
# 4. Choose your openclaude repo
# 5. Add environment variables:
#    - LONGCAT_API_KEY
#    - LONGCAT_API_URL (optional)
#    - LONGCAT_MODEL (optional)
# 6. Click "Deploy"
```

**Option B: Via CLI**
```bash
# 1. Install Vercel CLI
npm i -g vercel
# or
bun install -g vercel

# 2. Deploy from project root
vercel

# 3. Follow prompts and add environment variables

# 4. For production deployment
vercel --prod
```

#### Environment Variables on Vercel
1. Go to your project settings
2. Click "Environment Variables"
3. Add:
   - `LONGCAT_API_KEY` = your_key_here
   - `LONGCAT_API_URL` = https://api.longcat.ai/v1 (optional)
   - `LONGCAT_MODEL` = longcat-v1 (optional)

**Custom Domain**
1. Go to project settings → Domains
2. Add your domain (e.g., openclaude.com)
3. Update DNS records as instructed

### 2. Docker + Docker Compose

Containerized deployment for self-hosted or cloud platforms.

#### Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy files
COPY package.json bun.lock* ./
RUN npm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies only
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "run", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  openclaude:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LONGCAT_API_KEY=${LONGCAT_API_KEY}
      - LONGCAT_API_URL=${LONGCAT_API_URL:-https://api.longcat.ai/v1}
      - LONGCAT_MODEL=${LONGCAT_MODEL:-longcat-v1}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

#### Deploy with Docker Compose
```bash
# 1. Create .env file
cat > .env << EOF
LONGCAT_API_KEY=your_key_here
LONGCAT_API_URL=https://api.longcat.ai/v1
LONGCAT_MODEL=longcat-v1
EOF

# 2. Build and run
docker-compose up -d

# 3. View logs
docker-compose logs -f

# 4. Stop
docker-compose down
```

### 3. Railway.app

Railway provides easy Git-to-deploy with minimal configuration.

#### Steps
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your openclaude repository
4. Railway auto-detects Next.js
5. Add variables in project settings:
   - `LONGCAT_API_KEY`
   - `LONGCAT_API_URL`
   - `LONGCAT_MODEL`
6. Deploy automatically

### 4. Render

Render offers free tier with generous limits.

#### Steps
1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - Build command: `npm run build`
   - Start command: `npm run start`
5. Add environment variables
6. Deploy

### 5. Fly.io

Fly provides global deployment with edge computing.

#### Setup
```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Launch app
fly launch --image node:20

# 4. Set environment variables
fly secrets set LONGCAT_API_KEY=your_key_here

# 5. Deploy
fly deploy
```

### 6. Self-Hosted (VPS/Dedicated Server)

For full control on your own hardware.

#### Prerequisites
- VPS or dedicated server (DigitalOcean, Linode, AWS EC2, etc.)
- Ubuntu 20.04+ or similar Linux
- Node.js 20+ installed
- Nginx or Apache for reverse proxy

#### Installation
```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/your-org/openclaude.git
cd openclaude

# 3. Install dependencies
npm install

# 4. Create .env.local
cat > .env.local << EOF
LONGCAT_API_KEY=your_key_here
LONGCAT_API_URL=https://api.longcat.ai/v1
LONGCAT_MODEL=longcat-v1
NODE_ENV=production
EOF

# 5. Build
npm run build

# 6. Start with PM2 (recommended)
npm install -g pm2
pm2 start npm --name openclaude -- run start
pm2 save
pm2 startup

# 7. Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/openclaude
```

#### Nginx Configuration
```nginx
upstream openclaude {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://openclaude;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Enable & Restart
```bash
sudo ln -s /etc/nginx/sites-available/openclaude /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d your-domain.com
```

### 7. AWS (EC2 + ALB)

For enterprise-grade deployment.

#### Steps
1. Launch EC2 instance (Ubuntu 20.04, t3.medium+)
2. Security groups: Allow 22 (SSH), 80 (HTTP), 443 (HTTPS)
3. Install dependencies and deploy (same as self-hosted above)
4. Create Application Load Balancer
5. Point domain DNS to ALB
6. Attach SSL certificate (AWS Certificate Manager)

### 8. Google Cloud Platform (Cloud Run)

Serverless option with auto-scaling.

#### Steps
1. Push code to Cloud Source Repositories or GitHub
2. In Cloud Console, go to Cloud Run
3. Create new service from source
4. Select repository and branch
5. Configure:
   - Memory: 512MB or more
   - Timeout: 3600s
6. Add environment variables
7. Deploy

---

## 🔒 Security Best Practices

### Before Deploying

- [ ] Never commit `.env.local` to git
- [ ] Verify `.gitignore` includes `.env*`
- [ ] Rotate API keys before deployment
- [ ] Review environment variables are correct
- [ ] Enable HTTPS/SSL everywhere
- [ ] Set security headers

### In Production

```javascript
// Add to next.config.ts
const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ],
};
```

---

## 📊 Monitoring & Logging

### Error Tracking
```bash
# Install Sentry for error monitoring
npm install @sentry/nextjs

# Initialize in next.config.ts
withSentryConfig(nextConfig, { /* options */ })
```

### Analytics
- Vercel Analytics (automatic with Vercel)
- Google Analytics 4
- PostHog (privacy-focused)

### Logs
- Vercel: Automatic in dashboard
- Docker: `docker logs -f container_name`
- PM2: `pm2 logs openclaude`
- Systemd: `journalctl -u openclaude -f`

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Type check
        run: npm run typecheck
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🧪 Testing Before Production

```bash
# Type checking
npm run typecheck

# Build locally
npm run build

# Run production build locally
npm run start

# Test API endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

---

**Need help?** Check the logs first, then review the environment variables. Most issues are missing or incorrect API keys.
