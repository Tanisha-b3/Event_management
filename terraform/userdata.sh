#!/bin/bash
# EC2 Instance User Data Script

set -e

echo "Starting instance initialization..."

# Update system
yum update -y

# Install required packages
yum install -y docker httpd mod_ssl

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start and enable httpd
systemctl start httpd
systemctl enable httpd

# Create application directory
mkdir -p /var/app
cd /var/app

# Clone application (replace with your repository)
# git clone <your-repo-url> /var/app

# Set permissions
chown -R ec2-user:ec2-user /var/app

echo "Instance initialization complete!"