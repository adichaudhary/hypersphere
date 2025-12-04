# Deployment Guide

## Local Development

### Prerequisites
- Node.js 16+ 
- npm/yarn
- Solana CLI (optional, for program deployment)

### Setup

```bash
cd backend
npm install
cp .env.example .env
```

### Configuration for Local

Edit `.env`:
```env
SOLANA_RPC_URL=http://localhost:8899
PROGRAM_ID=TapToPay111111111111111111111111111111111111
PORT=3001
BASE_URL=http://localhost:3001
```

### Run

```bash
npm run dev
```

---

## Devnet Deployment

### Prerequisites
- Deployed Solana program on devnet
- Program ID from deployment

### Configuration

Edit `.env`:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your-deployed-program-id>
PORT=3001
BASE_URL=https://your-devnet-backend-url.com
```

### Test Deployment

```bash
npm run dev
```

Then test with:
```bash
node examples/test-api.js
```

---

## Production Deployment

### Option 1: Heroku

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Deploy Steps

1. **Initialize Git repo** (if not already):
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create Heroku app**:
   ```bash
   heroku create tap-to-pay-backend
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   heroku config:set PROGRAM_ID=<your-mainnet-program-id>
   heroku config:set PORT=3001
   heroku config:set BASE_URL=https://tap-to-pay-backend.herokuapp.com
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

5. **Monitor**:
   ```bash
   heroku logs --tail
   ```

---

### Option 2: AWS EC2

#### Prerequisites
- AWS account
- EC2 instance running (Ubuntu 20.04+)
- SSH access to instance

#### Setup Steps

1. **Connect to instance**:
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2** (for process management):
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone and setup**:
   ```bash
   git clone <your-repo-url> tap-to-pay-backend
   cd tap-to-pay-backend/backend
   npm install
   ```

5. **Create `.env`**:
   ```bash
   cat > .env << EOF
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   PROGRAM_ID=<your-program-id>
   PORT=3001
   BASE_URL=https://your-domain.com
   EOF
   ```

6. **Start with PM2**:
   ```bash
   pm2 start src/index.js --name "tap-to-pay"
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx reverse proxy**:
   ```bash
   sudo apt-get install -y nginx
   ```

   Edit `/etc/nginx/sites-available/default`:
   ```nginx
   server {
       listen 80 default_server;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

8. **Setup SSL with Let's Encrypt** (optional but recommended):
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

### Option 3: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  tap-to-pay-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
      - PROGRAM_ID=<your-program-id>
      - PORT=3001
      - BASE_URL=https://your-domain.com
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Build and run:
```bash
docker-compose up -d
```

---

## Database Migration

### From SQLite to PostgreSQL

1. **Install PostgreSQL**:
   ```bash
   npm install pg
   npm uninstall sqlite3
   ```

2. **Update `database.js`** to use PostgreSQL:
   ```javascript
   import pkg from 'pg';
   const { Pool } = pkg;

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   });

   export async function getDatabase() {
     return pool;
   }
   ```

3. **Update `.env`**:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/tap_to_pay
   ```

4. **Create tables** (same schema as SQLite):
   ```sql
   CREATE TABLE payment_intents (
     id VARCHAR(36) PRIMARY KEY,
     amount BIGINT NOT NULL,
     merchant_id VARCHAR(255) NOT NULL,
     nonce TEXT NOT NULL,
     payment_url TEXT NOT NULL,
     status VARCHAR(20) DEFAULT 'pending',
     tx_signature TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_merchant_id ON payment_intents(merchant_id);

   CREATE TABLE merchants (
     id VARCHAR(255) PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     wallet_address VARCHAR(44) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

---

## Monitoring & Logging

### Log Rotation (with Winston)

```bash
npm install winston
```

Update `src/index.js`:
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Server started');
```

### Health Monitoring

Setup external monitoring:
```bash
# Uptime Robot, Pingdom, or similar
# Monitor: https://your-domain.com/health
# Should return: { "status": "ok" }
```

---

## Performance Optimization

### 1. Enable Gzip Compression

```javascript
import compression from 'compression';
app.use(compression());
```

### 2. Connection Pooling

```bash
npm install pg-pool
```

### 3. Caching

```javascript
import redis from 'redis';
const client = redis.createClient();
```

### 4. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/payment_intents', limiter);
```

---

## Security Checklist

- [ ] Use HTTPS/SSL in production
- [ ] Set secure CORS origin (not *)
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Validate all inputs
- [ ] Use helmet for security headers
- [ ] Regular dependency updates
- [ ] Monitor logs for anomalies
- [ ] Backup database regularly
- [ ] Use strong wallet addresses

---

## Backup Strategy

### Daily Backups

Linux cron job:
```bash
0 2 * * * cp /app/data/payments.db /backups/payments-$(date +\%Y\%m\%d).db
```

### Cloud Backup (AWS S3)

```javascript
import AWS from 'aws-sdk';

async function backupDatabase() {
  const s3 = new AWS.S3();
  const fileContent = fs.readFileSync('./data/payments.db');
  
  await s3.upload({
    Bucket: 'tap-to-pay-backups',
    Key: `payments-${new Date().toISOString()}.db`,
    Body: fileContent
  }).promise();
}

// Run daily
setInterval(backupDatabase, 24 * 60 * 60 * 1000);
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana network RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `PROGRAM_ID` | Deployed tap-to-pay program ID | `TapToPay111...` |
| `PORT` | Server port | `3001` |
| `BASE_URL` | Public backend URL | `https://backend.example.com` |
| `DATABASE_URL` | PostgreSQL connection (optional) | `postgresql://...` |
| `NODE_ENV` | Environment mode | `production` |

---

## Troubleshooting

### High CPU Usage
- Check for memory leaks in listeners
- Review Solana RPC call frequency
- Ensure database indexes are optimized

### Database Errors
- Check file permissions
- Verify disk space
- Monitor connection pools

### Payment Status Not Updating
- Verify Solana RPC URL is working
- Check program ID is correct
- Review listener logs
- Test with direct Solana queries

### CORS Errors
- Check `BASE_URL` in frontend
- Update `app.use(cors())` configuration
- Verify headers are correct

---

## Support

For deployment issues:
1. Check server logs
2. Verify all environment variables
3. Test Solana RPC connectivity
4. Check database connectivity
5. Review error logs
