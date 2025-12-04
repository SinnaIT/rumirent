# VPS Dual Environment Setup Guide

Complete guide for setting up QA and PRODUCTION environments on a single VPS with Nginx reverse proxy.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Initial VPS Setup](#initial-vps-setup)
- [DNS Configuration](#dns-configuration)
- [Environment Setup](#environment-setup)
- [Nginx Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#ssl-https-setup)
- [Deployment](#deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

---

## Overview

This setup allows you to run two separate environments on a single VPS:

- **QA Environment**: `demo.rumirent.com` (port 3001)
- **PRODUCTION Environment**: `desk.rumirent.com` (port 3000)

Each environment has:
- Isolated Docker containers
- Separate PostgreSQL databases
- Independent environment variables
- Own deployment scripts

---

## Architecture

```
Internet
    ↓
VPS (Your Server IP)
    ↓
Nginx (Host-based, port 80/443)
    ├─→ demo.rumirent.com → localhost:3001 (QA)
    └─→ desk.rumirent.com → localhost:3000 (PROD)

Containers:
├─ rumirent-qa-app (port 3001)
├─ rumirent-qa-db (port 5433)
├─ rumirent-prod-app (port 3000)
└─ rumirent-prod-db (port 5432)
```

### Port Mapping

| Environment | App Port (Host→Container) | DB Port (Host→Container) |
|-------------|---------------------------|--------------------------|
| QA          | 3001 → 3000              | 5433 → 5432             |
| PRODUCTION  | 3000 → 3000              | 5432 → 5432             |

---

## Prerequisites

### On Your VPS
- Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- At least 2GB RAM (4GB recommended)
- At least 20GB disk space
- Public IP address

### On Your Local Machine
- Git
- SSH access to VPS
- Repository cloned locally

### Domain Requirements
- Domain name (e.g., `rumirent.com`)
- Access to DNS management panel

---

## Initial VPS Setup

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
```

### 3. Install Docker Compose

```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 4. Install Basic Tools

```bash
sudo apt install -y curl wget git nano vim htop
```

---

## DNS Configuration

Configure DNS A records in your domain registrar's panel:

| Type | Name   | Value         | TTL  |
|------|--------|---------------|------|
| A    | demo   | YOUR_VPS_IP   | 3600 |
| A    | desk   | YOUR_VPS_IP   | 3600 |

**Verification (wait 5-10 minutes for DNS propagation):**

```bash
# Check QA domain
dig demo.rumirent.com

# Check PROD domain
dig desk.rumirent.com

# Should both return your VPS IP
```

---

## Environment Setup

### 1. Create Directory Structure

```bash
# Create directories for both environments
sudo mkdir -p /opt/rumirent-app-qa
sudo mkdir -p /opt/rumirent-app-prod

# Set ownership
sudo chown -R $USER:$USER /opt/rumirent-app-qa
sudo chown -R $USER:$USER /opt/rumirent-app-prod
```

### 2. Copy Files to QA Directory

```bash
cd /opt/rumirent-app-qa

# Copy docker-compose file
cp /path/to/repo/docker-compose.qa.yml .

# Copy deployment script
cp /path/to/repo/scripts/deploy-qa.sh .
chmod +x deploy-qa.sh

# Create .env file from template
cp /path/to/repo/.env.qa.example .env
```

### 3. Configure QA Environment Variables

Edit `/opt/rumirent-app-qa/.env`:

```bash
nano /opt/rumirent-app-qa/.env
```

Update these values:

```env
# Database credentials (use strong passwords!)
POSTGRES_USER=rumirent_qa
POSTGRES_PASSWORD=your_strong_password_here_qa
POSTGRES_DB=rumirent_qa_db

# Database URL (match the above credentials)
DATABASE_URL="postgresql://rumirent_qa:your_strong_password_here_qa@qa-db:5432/rumirent_qa_db"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your_jwt_secret_here_qa"

# Application URL
NEXTAUTH_URL="https://demo.rumirent.com"

# GitHub repository (format: username/repo-name)
GITHUB_REPOSITORY="your-username/rumirent-app"
```

### 4. Copy Files to PROD Directory

```bash
cd /opt/rumirent-app-prod

# Copy docker-compose file
cp /path/to/repo/docker-compose.prod.yml .

# Copy deployment script
cp /path/to/repo/scripts/deploy-prod.sh .
chmod +x deploy-prod.sh

# Create .env file from template
cp /path/to/repo/.env.prod.example .env
```

### 5. Configure PROD Environment Variables

Edit `/opt/rumirent-app-prod/.env`:

```bash
nano /opt/rumirent-app-prod/.env
```

Update these values:

```env
# Database credentials (DIFFERENT from QA!)
POSTGRES_USER=rumirent_prod
POSTGRES_PASSWORD=your_different_strong_password_prod
POSTGRES_DB=rumirent_prod_db

# Database URL (match the above credentials)
DATABASE_URL="postgresql://rumirent_prod:your_different_strong_password_prod@prod-db:5432/rumirent_prod_db"

# JWT Secret (DIFFERENT from QA! Generate with: openssl rand -base64 32)
JWT_SECRET="your_different_jwt_secret_prod"

# Application URL
NEXTAUTH_URL="https://desk.rumirent.com"

# GitHub repository
GITHUB_REPOSITORY="your-username/rumirent-app"
```

**⚠️ IMPORTANT:**
- Use DIFFERENT passwords for QA and PROD
- Use DIFFERENT JWT secrets for QA and PROD
- Keep these credentials secure and backed up

---

## Nginx Configuration

### 1. Run Nginx Setup Script

From your repository directory:

```bash
cd /path/to/repo
sudo ./scripts/nginx-setup.sh
```

This script will:
- Install Nginx (if not installed)
- Copy configuration files
- Enable QA and PROD sites
- Disable default site
- Create certbot directory
- Test and restart Nginx

### 2. Manual Nginx Setup (Alternative)

If the script fails, you can set up manually:

```bash
# Install Nginx
sudo apt install nginx -y

# Copy configurations
sudo cp docker/nginx/rumirent-qa.conf /etc/nginx/sites-available/rumirent-qa
sudo cp docker/nginx/rumirent-prod.conf /etc/nginx/sites-available/rumirent-prod

# Enable sites
sudo ln -s /etc/nginx/sites-available/rumirent-qa /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/rumirent-prod /etc/nginx/sites-enabled/

# Disable default site
sudo rm /etc/nginx/sites-enabled/default

# Create certbot directory
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 3. Verify Nginx Status

```bash
sudo systemctl status nginx
```

---

## SSL/HTTPS Setup

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate for QA

```bash
sudo certbot --nginx -d demo.rumirent.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 3. Obtain SSL Certificate for PROD

```bash
sudo certbot --nginx -d desk.rumirent.com
```

### 4. Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### 5. Verify SSL Setup

```bash
# Check certificate status
sudo certbot certificates

# Test HTTPS
curl -I https://demo.rumirent.com
curl -I https://desk.rumirent.com
```

Certbot automatically:
- Obtains certificates
- Updates Nginx configurations
- Sets up auto-renewal (twice daily check)

---

## Deployment

### 1. Initial Deployment - QA Environment

```bash
cd /opt/rumirent-app-qa
./deploy-qa.sh
```

The script will:
1. Pull latest QA image from GHCR
2. Stop existing containers
3. Start new containers
4. Wait for services to be ready
5. Run database migrations
6. Clean up old images
7. Perform health check

### 2. Initial Deployment - PROD Environment

```bash
cd /opt/rumirent-app-prod
./deploy-prod.sh
```

### 3. Verify Deployments

```bash
# Check QA
docker ps | grep qa
curl http://localhost:3001/api/test
curl https://demo.rumirent.com

# Check PROD
docker ps | grep prod
curl http://localhost:3000/api/test
curl https://desk.rumirent.com
```

### 4. View Logs

```bash
# QA logs
cd /opt/rumirent-app-qa
docker-compose -f docker-compose.qa.yml logs -f qa-app

# PROD logs
cd /opt/rumirent-app-prod
docker-compose -f docker-compose.prod.yml logs -f prod-app
```

---

## Maintenance

### Database Backups

Create backup script `/opt/scripts/backup-qa.sh`:

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/qa"
mkdir -p $BACKUP_DIR

docker exec rumirent-qa-db pg_dump -U rumirent_qa rumirent_qa_db | \
  gzip > $BACKUP_DIR/backup_qa_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

Create backup script `/opt/scripts/backup-prod.sh`:

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/prod"
mkdir -p $BACKUP_DIR

docker exec rumirent-prod-db pg_dump -U rumirent_prod rumirent_prod_db | \
  gzip > $BACKUP_DIR/backup_prod_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

Make executable:

```bash
chmod +x /opt/scripts/backup-qa.sh
chmod +x /opt/scripts/backup-prod.sh
```

### Automated Backups with Cron

```bash
# Edit crontab
crontab -e

# Add these lines (daily backups)
0 2 * * * /opt/scripts/backup-qa.sh
0 3 * * * /opt/scripts/backup-prod.sh
```

### Update Deployments

When new code is pushed:

```bash
# Update QA
cd /opt/rumirent-app-qa
./deploy-qa.sh

# Update PROD (after testing QA)
cd /opt/rumirent-app-prod
./deploy-prod.sh
```

### Monitor Resources

```bash
# System resources
htop

# Docker stats
docker stats

# Disk usage
df -h

# Nginx logs
sudo tail -f /var/log/nginx/qa-access.log
sudo tail -f /var/log/nginx/prod-access.log
```

---

## Troubleshooting

### Issue: Cannot connect to domain

**Check DNS:**
```bash
dig demo.rumirent.com
dig desk.rumirent.com
```

**Check Nginx:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

**Check Firewall:**
```bash
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

### Issue: Container won't start

**Check logs:**
```bash
# QA
cd /opt/rumirent-app-qa
docker-compose -f docker-compose.qa.yml logs

# PROD
cd /opt/rumirent-app-prod
docker-compose -f docker-compose.prod.yml logs
```

**Check .env file:**
```bash
cat /opt/rumirent-app-qa/.env
cat /opt/rumirent-app-prod/.env
```

### Issue: Database connection fails

**Check database is running:**
```bash
docker ps | grep db
```

**Check DATABASE_URL format:**
```env
# Correct format:
DATABASE_URL="postgresql://user:password@host:port/database"

# For QA (service name is qa-db):
DATABASE_URL="postgresql://rumirent_qa:password@qa-db:5432/rumirent_qa_db"

# For PROD (service name is prod-db):
DATABASE_URL="postgresql://rumirent_prod:password@prod-db:5432/rumirent_prod_db"
```

### Issue: Migrations fail

**Reset migrations (CAUTION: Deletes data):**
```bash
# For QA
cd /opt/rumirent-app-qa
docker-compose -f docker-compose.qa.yml exec qa-app npx prisma migrate reset

# For PROD (be very careful!)
cd /opt/rumirent-app-prod
docker-compose -f docker-compose.prod.yml exec prod-app npx prisma migrate reset
```

**Check migration status:**
```bash
docker-compose -f docker-compose.qa.yml exec qa-app npx prisma migrate status
```

### Issue: SSL certificate renewal fails

**Check certbot:**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

**Manual renewal:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Issue: Port already in use

**Check what's using the port:**
```bash
sudo lsof -i :3000
sudo lsof -i :3001
```

**Stop conflicting service:**
```bash
docker ps
docker stop <container_id>
```

### Common Commands

```bash
# Restart QA
cd /opt/rumirent-app-qa
docker-compose -f docker-compose.qa.yml restart

# Restart PROD
cd /opt/rumirent-app-prod
docker-compose -f docker-compose.prod.yml restart

# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Clean Docker system
docker system prune -a

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx config
sudo nginx -t
```

---

## Security Recommendations

1. **Firewall Configuration:**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   ```

2. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Strong Passwords:**
   - Use different passwords for QA and PROD
   - Store passwords in a secure password manager
   - Never commit passwords to git

4. **Backup Strategy:**
   - Daily automated backups
   - Test restore procedures regularly
   - Store backups off-site

5. **Monitoring:**
   - Set up log monitoring
   - Monitor disk space
   - Monitor container health

---

## Support

For issues or questions:
1. Check this documentation
2. Review logs: `docker-compose logs`
3. Check Nginx logs: `/var/log/nginx/`
4. Review GitHub Actions for CI/CD issues

---

**Last Updated:** 2025
**Version:** 1.0
