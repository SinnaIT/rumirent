# Dual Environment Setup - Implementation Summary

## Overview

This implementation provides a complete dual-environment setup for running QA and PRODUCTION environments on a single VPS with Nginx reverse proxy.

## What Was Created

### 1. Docker Compose Files

#### [docker-compose.qa.yml](./docker-compose.qa.yml)
- QA environment configuration
- Container names: `rumirent-qa-app`, `rumirent-qa-db`
- Ports: App 3001, DB 5433
- Image: `ghcr.io/${GITHUB_REPOSITORY}:qa`
- Network: `rumirent-qa-network`

#### [docker-compose.prod.yml](./docker-compose.prod.yml)
- PRODUCTION environment configuration
- Container names: `rumirent-prod-app`, `rumirent-prod-db`
- Ports: App 3000, DB 5432
- Image: `ghcr.io/${GITHUB_REPOSITORY}:latest`
- Network: `rumirent-prod-network`

### 2. Nginx Configurations

#### [docker/nginx/rumirent-qa.conf](./docker/nginx/rumirent-qa.conf)
- QA virtual host for `demo.rumirent.com`
- Reverse proxy to `localhost:3001`
- Rate limiting, caching, security headers
- SSL support (commented, ready for Certbot)

#### [docker/nginx/rumirent-prod.conf](./docker/nginx/rumirent-prod.conf)
- PRODUCTION virtual host for `desk.rumirent.com`
- Reverse proxy to `localhost:3000`
- Rate limiting, caching, security headers
- SSL support (commented, ready for Certbot)

### 3. Deployment Scripts

#### [scripts/deploy-qa.sh](./scripts/deploy-qa.sh)
- Deploys QA environment
- Pulls `ghcr.io/${GITHUB_REPOSITORY}:qa`
- Runs migrations on QA database
- Health checks on port 3001

#### [scripts/deploy-prod.sh](./scripts/deploy-prod.sh)
- Deploys PRODUCTION environment
- Pulls `ghcr.io/${GITHUB_REPOSITORY}:latest`
- Runs migrations on PROD database
- Health checks on port 3000

#### [scripts/nginx-setup.sh](./scripts/nginx-setup.sh)
- Automated Nginx installation and configuration
- Copies site configs to `/etc/nginx/sites-available/`
- Enables both QA and PROD sites
- Tests and restarts Nginx

### 4. Environment Templates

#### [.env.qa.example](./.env.qa.example)
- QA environment variables template
- Database: `rumirent_qa_db` on `qa-db:5432`
- URL: `https://demo.rumirent.com`
- Image tag: `:qa`

#### [.env.prod.example](./.env.prod.example)
- PRODUCTION environment variables template
- Database: `rumirent_prod_db` on `prod-db:5432`
- URL: `https://desk.rumirent.com`
- Image tag: `:latest`

### 5. Documentation

#### [proyect_documentations/VPS_DUAL_ENV_SETUP.md](./proyect_documentations/VPS_DUAL_ENV_SETUP.md)
Complete guide covering:
- Architecture overview
- Prerequisites
- Initial VPS setup
- DNS configuration
- Environment setup (QA and PROD)
- Nginx configuration
- SSL/HTTPS with Let's Encrypt
- Deployment procedures
- Maintenance (backups, monitoring)
- Troubleshooting

#### [proyect_documentations/VPS_SETUP.md](./proyect_documentations/VPS_SETUP.md) - Updated
- Added reference to dual environment guide
- Link to VPS_DUAL_ENV_SETUP.md

### 6. GitHub Actions Workflow

#### [.github/workflows/deploy.yml](./.github/workflows/deploy.yml) - Updated
- Supports both `main` and `develop` branches
- Manual workflow dispatch with environment selection
- Image tagging:
  - `main` branch → `:latest` + `:prod-<sha>`
  - `develop` branch → `:qa` + `:qa-<sha>`
- Deployment instructions in output

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   VPS Server  │
              │  (Public IP)  │
              └───────┬───────┘
                      │
              ┌───────▼────────┐
              │     Nginx      │
              │  (port 80/443) │
              └───────┬────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌─────────────────┐        ┌─────────────────┐
│ demo.rumirent.com│       │ desk.rumirent.com│
│   (QA)          │        │   (PROD)         │
│ localhost:3001  │        │ localhost:3000   │
└────────┬────────┘        └────────┬─────────┘
         │                          │
    ┌────▼──────┐             ┌────▼──────┐
    │ qa-app    │             │ prod-app  │
    │ container │             │ container │
    └────┬──────┘             └────┬──────┘
         │                          │
    ┌────▼──────┐             ┌────▼──────┐
    │ qa-db     │             │ prod-db   │
    │ :5433     │             │ :5432     │
    └───────────┘             └───────────┘
```

---

## Quick Start Guide

### 1. Prerequisites
- VPS with Docker and Docker Compose installed
- DNS records pointing to VPS:
  - `demo.rumirent.com` → VPS_IP
  - `desk.rumirent.com` → VPS_IP

### 2. Setup VPS Directories

```bash
# On VPS
sudo mkdir -p /opt/rumirent-app-qa
sudo mkdir -p /opt/rumirent-app-prod
sudo chown -R $USER:$USER /opt/rumirent-app-qa
sudo chown -R $USER:$USER /opt/rumirent-app-prod
```

### 3. Copy Files to VPS

**For QA:**
```bash
cd /opt/rumirent-app-qa
# Copy docker-compose.qa.yml, .env.qa.example, deploy-qa.sh
# Rename .env.qa.example to .env and configure
```

**For PROD:**
```bash
cd /opt/rumirent-app-prod
# Copy docker-compose.prod.yml, .env.prod.example, deploy-prod.sh
# Rename .env.prod.example to .env and configure
```

### 4. Configure Nginx

```bash
cd /path/to/repo
sudo ./scripts/nginx-setup.sh
```

### 5. Setup SSL

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d demo.rumirent.com
sudo certbot --nginx -d desk.rumirent.com
```

### 6. Deploy

**QA:**
```bash
cd /opt/rumirent-app-qa
./deploy-qa.sh
```

**PROD:**
```bash
cd /opt/rumirent-app-prod
./deploy-prod.sh
```

---

## GitHub Actions Workflow

### Automatic Deployment (on push)

- Push to `develop` branch → Builds image with `:qa` tag
- Push to `main` branch → Builds image with `:latest` tag

### Manual Deployment

1. Go to GitHub Actions
2. Select "Build and Push Docker Image" workflow
3. Click "Run workflow"
4. Choose environment: `qa` or `prod`
5. Run workflow

After image is built, SSH to VPS and run deployment script.

---

## Environment Variables

### Critical Variables to Configure

**Both Environments:**
- `POSTGRES_USER` - Database user (different for QA/PROD)
- `POSTGRES_PASSWORD` - Strong password (different for QA/PROD)
- `POSTGRES_DB` - Database name (different for QA/PROD)
- `DATABASE_URL` - Full connection string
- `JWT_SECRET` - Strong secret (different for QA/PROD)
- `NEXTAUTH_URL` - Application URL
- `GITHUB_REPOSITORY` - GitHub repo (format: `username/repo`)

**Generate Strong Secrets:**
```bash
# JWT Secret
openssl rand -base64 32

# Password
openssl rand -base64 24
```

---

## Port Reference

| Service          | QA Host Port | QA Container Port | PROD Host Port | PROD Container Port |
|------------------|--------------|-------------------|----------------|---------------------|
| Next.js App      | 3001         | 3000              | 3000           | 3000                |
| PostgreSQL       | 5433         | 5432              | 5432           | 5432                |
| Nginx HTTP       | 80           | -                 | 80             | -                   |
| Nginx HTTPS      | 443          | -                 | 443            | -                   |

---

## Useful Commands

### Docker Management

```bash
# View all containers
docker ps

# View QA containers only
docker ps | grep qa

# View PROD containers only
docker ps | grep prod

# View logs
docker logs -f rumirent-qa-app
docker logs -f rumirent-prod-app

# Restart containers
cd /opt/rumirent-app-qa && docker-compose -f docker-compose.qa.yml restart
cd /opt/rumirent-app-prod && docker-compose -f docker-compose.prod.yml restart
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/qa-access.log
sudo tail -f /var/log/nginx/prod-access.log
sudo tail -f /var/log/nginx/qa-error.log
sudo tail -f /var/log/nginx/prod-error.log
```

### SSL Management

```bash
# View certificates
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Backup Strategy

### Database Backups

Create automated backup scripts (see VPS_DUAL_ENV_SETUP.md for full scripts):

```bash
# QA backup
docker exec rumirent-qa-db pg_dump -U rumirent_qa rumirent_qa_db | gzip > backup_qa_$(date +%Y%m%d).sql.gz

# PROD backup
docker exec rumirent-prod-db pg_dump -U rumirent_prod rumirent_prod_db | gzip > backup_prod_$(date +%Y%m%d).sql.gz
```

### Automated Backups with Cron

```bash
# Edit crontab
crontab -e

# Add daily backups
0 2 * * * /opt/scripts/backup-qa.sh
0 3 * * * /opt/scripts/backup-prod.sh
```

---

## Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3000/3001 are available
2. **DNS not resolving**: Wait 5-10 minutes for DNS propagation
3. **SSL certificate fails**: Ensure domain points to server first
4. **Container won't start**: Check .env file configuration
5. **Database connection fails**: Verify DATABASE_URL format

### Health Checks

```bash
# Test QA
curl http://localhost:3001/api/test
curl https://demo.rumirent.com

# Test PROD
curl http://localhost:3000/api/test
curl https://desk.rumirent.com

# Test Nginx
curl http://localhost/nginx-health  # Should return error (no default site)
```

---

## Security Recommendations

1. **Use strong, different passwords** for QA and PROD
2. **Keep JWT secrets different** between environments
3. **Enable firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   ```
4. **Regular backups** of both databases
5. **Monitor logs** regularly
6. **Keep system updated**: `sudo apt update && sudo apt upgrade`

---

## Support & Documentation

- **Detailed Setup**: [VPS_DUAL_ENV_SETUP.md](./proyect_documentations/VPS_DUAL_ENV_SETUP.md)
- **Basic Setup**: [VPS_SETUP.md](./proyect_documentations/VPS_SETUP.md)
- **GitHub Actions**: [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)

---

**Created:** 2025
**Version:** 1.0
**Environments:** QA (demo.rumirent.com) + PROD (desk.rumirent.com)
