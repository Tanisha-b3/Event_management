resource "aws_security_group" "mern_sg" {
  name = "mern-sg"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "mern_server" {
  ami           = "ami-0f5ee92e2d63afc18"
  instance_type = var.instance_type
  key_name      = var.key_name

  security_groups = [aws_security_group.mern_sg.name]

  tags = {
    Name = "mern-full-production"
  }

  user_data = <<-EOF
#!/bin/bash
set -e

sudo apt update -y
sudo apt install -y nodejs npm git nginx
sudo npm install -g pm2

cd /home/ubuntu
git clone ${var.repo_url}
cd Event_management

# ================= BACKEND =================
cd backend
npm install

cat <<EOT >> .env
MONGO_URI=${var.mongo_uri}
JWT_SECRET=${var.jwt_secret}
ACCESS_TOKEN_SECRET=${var.access_token_secret}
REFRESH_TOKEN_SECRET=${var.refresh_token_secret}
GOOGLE_CLIENT_ID=${var.google_client_id}
CLIENT_SECRET=${var.client_secret}
EMAIL=${var.email}
TWILIO_ACCOUNT_SID=${var.twilio_sid}
TWILIO_AUTH_TOKEN=${var.twilio_token}
TWILIO_PHONE_NUMBER=${var.twilio_number}
FRONTEND_URL=http://$(curl -s ifconfig.me)
GROQ_API_KEY=${var.groq_api_key}
EOT

pm2 start server.js --name backend

# ================= FRONTEND =================
cd ../frontend
npm install

# Set production API
cat <<EOT >> .env
VITE_API_URL=/api
VITE_BASE_URL=
VITE_GOOGLE_CLIENT_ID=${var.google_client_id}
EOT

npm run build

sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# ================= NGINX =================
sudo bash -c 'cat > /etc/nginx/sites-available/default <<EONGINX
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }
}
EONGINX'

sudo systemctl restart nginx

EOF
}