#!/usr/bin/env python3
"""
FortuNet Production Deployment Script
====================================

This script helps deploy FortuNet to production with proper configuration.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def create_env_file():
    """Create .env file from template"""
    env_content = """# FortuNet Production Environment Variables
# Update these values with your actual MikroTik and M-Pesa credentials

# Flask settings
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-production-secret-key-change-this

# MikroTik RouterOS settings
MIKROTIK_IP=192.168.88.1
MIKROTIK_USERNAME=admin
MIKROTIK_PASSWORD=your-mikrotik-password
MIKROTIK_PORT=8728
MIKROTIK_USE_SSL=False
MIKROTIK_SSL_VERIFY=False

# M-Pesa Daraja API settings
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PAYBILL=your-paybill-number
MPESA_ENVIRONMENT=production

# Database settings
DATABASE_URL=sqlite:///hotspot.db

# Server settings
HOST=0.0.0.0
PORT=5000

# CORS settings
CORS_ORIGINS=*

# Security settings
SESSION_COOKIE_SECURE=True
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env file")
    print("⚠️  Please update the .env file with your actual credentials!")

def install_dependencies():
    """Install production dependencies"""
    print("📦 Installing production dependencies...")
    
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    
    return True

def build_frontend():
    """Build the React frontend for production"""
    print("🔨 Building frontend...")
    
    try:
        subprocess.run(['npm', 'run', 'build'], check=True)
        print("✅ Frontend built successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to build frontend: {e}")
        return False
    
    return True

def create_production_script():
    """Create production startup script"""
    script_content = """#!/bin/bash
# FortuNet Production Startup Script

# Activate virtual environment
source venv/bin/activate

# Set production environment
export FLASK_ENV=production

# Start the application with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 --keep-alive 2 flask_api_endpoints:app
"""
    
    with open('start_production.sh', 'w') as f:
        f.write(script_content)
    
    # Make executable on Unix systems
    os.chmod('start_production.sh', 0o755)
    
    print("✅ Created production startup script: start_production.sh")

def create_systemd_service():
    """Create systemd service file for production"""
    service_content = """[Unit]
Description=FortuNet MikroTik Hotspot Management
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/fortunet
Environment=PATH=/path/to/your/fortunet/venv/bin
ExecStart=/path/to/your/fortunet/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 flask_api_endpoints:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
    
    with open('fortunet.service', 'w') as f:
        f.write(service_content)
    
    print("✅ Created systemd service file: fortunet.service")
    print("⚠️  Update the paths in fortunet.service before using!")

def create_nginx_config():
    """Create Nginx configuration for production"""
    nginx_config = """server {
    listen 80;
    server_name your-domain.com;  # Update with your domain
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;  # Update with your domain
    
    # SSL configuration
    ssl_certificate /path/to/your/ssl/certificate.crt;
    ssl_certificate_key /path/to/your/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend static files
    location / {
        root /path/to/your/fortunet/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
"""
    
    with open('nginx_fortunet.conf', 'w') as f:
        f.write(nginx_config)
    
    print("✅ Created Nginx configuration: nginx_fortunet.conf")
    print("⚠️  Update the domain and SSL paths in nginx_fortunet.conf!")

def main():
    """Main deployment function"""
    print("🚀 FortuNet Production Deployment")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not Path('flask_api_endpoints.py').exists():
        print("❌ Please run this script from the FortuNet project directory")
        sys.exit(1)
    
    # Create .env file
    create_env_file()
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Build frontend
    if not build_frontend():
        sys.exit(1)
    
    # Create production scripts
    create_production_script()
    create_systemd_service()
    create_nginx_config()
    
    print("\n🎉 Deployment preparation completed!")
    print("\n📋 Next steps:")
    print("1. Update .env file with your actual credentials")
    print("2. Update paths in fortunet.service")
    print("3. Update domain and SSL paths in nginx_fortunet.conf")
    print("4. Copy nginx config to /etc/nginx/sites-available/")
    print("5. Enable the site: sudo ln -s /etc/nginx/sites-available/fortunet /etc/nginx/sites-enabled/")
    print("6. Copy fortunet.service to /etc/systemd/system/")
    print("7. Enable and start the service: sudo systemctl enable fortunet && sudo systemctl start fortunet")
    print("\n🔒 Security reminder: Change default passwords and use strong secrets!")

if __name__ == "__main__":
    main()

