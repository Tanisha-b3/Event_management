# 📅 Event Management System

<div align="center">

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-29.1.3-blue?style=for-the-badge&logo=docker)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-blue?style=for-the-badge&logo=kubernetes)
![Jenkins](https://img.shields.io/badge/CI%2FCD-Jenkins-red?style=for-the-badge&logo=jenkins)
![Terraform](https://img.shields.io/badge/IaC-Terraform-purple?style=for-the-badge&logo=terraform)
![Live](https://img.shields.io/badge/Live-Vercel-black?style=for-the-badge&logo=vercel)

**[🌐 Live Demo → event-management-olive-beta.vercel.app](https://event-management-olive-beta.vercel.app)**

</div>

---

## 📝 Project Description

The **Event Management System** is a full-stack web application built with the **MERN stack (MongoDB, Express.js, React.js, Node.js)**. It allows users to create, manage, discover, and promote events — streamlining the event planning process and enhancing engagement for both organizers and attendees.

---

## 🚀 Key Features

### ✅ 1. User Registration & Authentication
- User registration, login, and logout
- Secure authentication using **JWT**
- Social login support (Google, Facebook)

### ✅ 2. Event Creation
- Create events with title, description, date, time, location, and ticketing details
- Custom privacy settings and flexible ticket pricing

### ✅ 3. Event Management Dashboard
- Organizer dashboard to manage all created events
- View attendee lists, track ticket sales, edit event details
- Send notifications and updates to attendees via **Twilio SMS**

### ✅ 4. Event Discovery
- Search and browse upcoming events by location, date, category, or keyword
- Advanced filters and sorting

### ✅ 5. Ticketing & Registration
- Integrated ticketing system for event registration and secure online payments
- Users can choose ticket types, register, and receive confirmations
- Optional: **Stripe** or **Razorpay** integration

### ✅ 6. Real-Time Attendee Engagement
- Live features powered by **Socket.io** — discussion boards, polls, live Q&A
- Organizers can gather feedback and interact with attendees in real time

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (Vite), TailwindCSS v4, React Router v7, JavaScript (ES6+) |
| **Backend** | Node.js 18, Express.js, Mongoose ORM |
| **Database** | MongoDB 6 |
| **Authentication** | JWT |
| **Real-Time** | Socket.io (WebSocket) |
| **Notifications** | Twilio SMS |
| **Containerization** | Docker 29.1.3, Docker Compose |
| **Orchestration** | Kubernetes (Minikube), kubectl |
| **CI/CD** | Jenkins (Jenkinsfile included) |
| **Infrastructure** | AWS EC2 (Ubuntu 24.04 LTS), Terraform |
| **Deployment** | Vercel (frontend), Docker Hub (`tanishab3/event-backend`, `tanishab3/event-frontend`) |

---

## 📁 Project Structure
Event_management/
├── backend/                  # Node.js + Express API
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── uploads/
│   ├── utils/
│   ├── socketHandler.js
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/                 # React + Vite app
│   ├── src/
│   │   └── components/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
├── k8s/                      # Kubernetes manifests
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   └── mongo-service.yaml
├── terraform/                # Infrastructure as Code (AWS)
├── docker-compose.yaml
├── Jenkinsfile
├── .gitignore
├── package.json
└── README.md

---

## ⚙️ Local Setup (Without Docker)

### Prerequisites
- Node.js v20+
- MongoDB running locally
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Tanisha-b3/Event_management.git
cd Event_management
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/eventdb
JWT_SECRET=your_jwt_secret_here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

Start the backend server:

```bash
node server.js
# Server running on port 5000
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend dev server:

```bash
npm run dev
# App running at http://localhost:5173
```

---

## 🐳 Docker Compose Setup

Run the full stack (frontend + backend + MongoDB) with a single command.

### Prerequisites
- Docker 20+
- Docker Compose

### Steps

```bash
# Clone the repo
git clone https://github.com/Tanisha-b3/Event_management.git
cd Event_management

# Create environment files
# (see backend/.env and frontend/.env sections above)
# Use MONGO_URI=mongodb://mongo:27017/eventdb for Docker networking

# Build and start all services
sudo docker-compose up -d --build
```

### Running Services

| Container | Image | Port |
|---|---|---|
| event-frontend | nginx:alpine (React build) | `0.0.0.0:80→80` |
| event-backend | node:18 | internal `5000` |
| event-mongo | mongo:6 | internal `27017` |

### Useful Commands

```bash
# Check running containers
sudo docker ps

# View backend logs
sudo docker-compose logs backend

# View frontend (Nginx) logs
sudo docker-compose logs frontend

# Stream logs in real time
sudo docker-compose logs -f backend

# Stop all services
sudo docker-compose down

# Rebuild after code changes
sudo docker-compose down
sudo docker-compose up -d --build
```

> **Note:** The `MONGO_URI` must use the service name `mongo` (not `localhost`) when running inside Docker: `mongodb://mongo:27017/eventdb`

---

## ☸️ Kubernetes Deployment (Minikube)

### Prerequisites
- Docker (with user added to docker group)
- Minikube
- kubectl

### 1. Add User to Docker Group

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Install Minikube & kubectl

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

sudo snap install kubectl --classic
```

### 3. Start Minikube

```bash
minikube start
# Uses Docker driver automatically
# Kubernetes v1.35.1, 2 CPUs, 3072 MB RAM
```

### 4. Push Images to Docker Hub

Kubernetes pulls images from a registry — local images won't work directly.

```bash
docker login

docker build -t tanishab3/event-backend ./backend
docker push tanishab3/event-backend

docker build -t tanishab3/event-frontend ./frontend
docker push tanishab3/event-frontend
```

### 5. Deploy to Kubernetes

```bash
kubectl apply -f k8s/
```

Expected output:
deployment.apps/backend created
service/backend created
deployment.apps/frontend created
service/frontend created
service/mongo created

### 6. Verify & Access

```bash
# Check pod status (all should show Running 1/1)
kubectl get pods

# Check services
kubectl get services

# View backend logs
kubectl logs <backend-pod-name>

# Access the frontend
minikube service frontend
# Opens: http://192.168.49.2:30007

# Alternative: port-forward for local access
kubectl port-forward svc/frontend 8080:80
# Access at http://localhost:8080
```

### Kubernetes Manifest Summary

| File | Kind | Type | Port |
|---|---|---|---|
| `mongo-service.yaml` | Service | ClusterIP | 27017 |
| `backend-deployment.yaml` | Deployment | — | 5000 |
| `backend-service.yaml` | Service | ClusterIP | 5000 |
| `frontend-deployment.yaml` | Deployment | — | 80 |
| `frontend-service.yaml` | Service | NodePort | 80:30007 |

---

## 🔁 CI/CD Pipeline (Jenkins)

The `Jenkinsfile` at the repo root defines a full pipeline:
Pipeline Stages:
┌─────────────────────────────────┐
│  1. Clone Repository            │  git pull from GitHub
│  2. Install Backend Dependencies│  npm install in /backend
│  3. Install Frontend Dependencies│ npm install in /frontend
│  4. Build Frontend              │  npm run build (Vite)
│  5. Start Backend (PM2)         │  pm2 start server.js
│  6. Serve Frontend              │  copy dist/ → /var/www/html
└─────────────────────────────────┘

**Post-build:**
- ✅ Success → `Deployment Successful!`
- ❌ Failure → `Deployment Failed!`

---

## 🌍 Infrastructure as Code (Terraform)

The `terraform/` directory contains scripts for provisioning the AWS EC2 instance used in deployment. This enables reproducible, version-controlled infrastructure setup.

---

## 🛠️ Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `Permission denied` on Docker socket | User not in docker group | `sudo usermod -aG docker $USER && newgrp docker` |
| `CustomEvent is not defined` on build | Frontend Dockerfile used `node:18` | Change to `FROM node:20 as build` |
| `ECONNREFUSED` MongoDB connection | Wrong `MONGO_URI` hostname | Use `mongodb://mongo:27017/eventdb` (not `localhost`) |
| `KeyError: 'ContainerConfig'` | docker-compose v1 incompatibility with Docker 29+ | `sudo docker-compose down && sudo docker-compose up -d --build` |
| `ErrImagePull` in Kubernetes | Image name mismatch in YAML | Ensure image is `tanishab3/event-backend:latest` |
| Git push rejected — large file | Binary committed to repo | `git rm --cached <file>` and add to `.gitignore` |
| `502 Bad Gateway` from Nginx | Backend container not reachable | Check `nginx.conf` proxy target matches backend service name |

---

## 📚 Learning & Reference Links

| Topic | Resources |
|---|---|
| JavaScript / ES6 | [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript) · [JS Tutorial](https://www.javascripttutorial.net/) |
| React.js | [React Docs](https://react.dev/) |
| Node.js & Express | [Node.js](https://nodejs.org/en/docs) · [Express](https://expressjs.com/) |
| MongoDB | [MongoDB Docs](https://www.mongodb.com/docs/) |
| Docker | [Docker Docs](https://docs.docker.com/) |
| Kubernetes | [K8s Docs](https://kubernetes.io/docs/) |
| Jenkins | [Jenkins Docs](https://www.jenkins.io/doc/) |
| Terraform | [Terraform Docs](https://developer.hashicorp.com/terraform/docs) |

---

## 🤝 Contribution

Feel free to **fork** this repository, **raise issues**, and **submit pull requests** to improve features, fix bugs, or suggest enhancements.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 🙌 Thank You

Thank you for exploring this **Event Management System**!  
Happy coding and best of luck building awesome events! 🚀🎉
