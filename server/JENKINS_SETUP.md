# Jenkins Pipeline Setup Guide

## 📋 Overview

This Jenkins pipeline automates the complete CI/CD workflow:
1. 📥 Pull code from GitHub
2. 🐳 Build Docker image
3. 📤 Push to Docker Hub
4. 📊 Deploy ELK Stack (Elasticsearch, Logstash, Kibana, Filebeat)
5. 🚀 Deploy Backend Application
6. 🧪 Run comprehensive tests

---

## 🔧 Prerequisites

### 1. Jenkins Installation
```bash
# Install Jenkins on Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk -y
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update
sudo apt install jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

Access Jenkins: http://localhost:8080

### 2. Required Jenkins Plugins
Install these plugins from **Manage Jenkins → Plugins → Available**:
- ✅ Git Plugin
- ✅ Docker Pipeline Plugin
- ✅ Kubernetes Plugin
- ✅ Pipeline Plugin
- ✅ Credentials Plugin
- ✅ GitHub Plugin (optional, for webhooks)

### 3. System Tools on Jenkins Server
```bash
# Install Docker
sudo apt update
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker jenkins

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Python3 and pip (for tests)
sudo apt install python3 python3-pip -y

# Restart Jenkins to apply group changes
sudo systemctl restart jenkins
```

### 4. Kubernetes Access
```bash
# Copy kubeconfig to Jenkins user
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo chmod 600 /var/lib/jenkins/.kube/config
```

---

## 🔐 Configure Jenkins Credentials

### 1. Docker Hub Credentials
1. Go to **Manage Jenkins → Credentials → System → Global credentials**
2. Click **Add Credentials**
3. Select **Username with password**
4. Configure:
   - **Username**: Your Docker Hub username (e.g., `shreyas0s`)
   - **Password**: Your Docker Hub password or access token
   - **ID**: `dockerhub-credentials` (MUST match the Jenkinsfile)
   - **Description**: Docker Hub Login
5. Click **OK**

### 2. GitHub Credentials (Optional - for private repos)
1. Add Credentials
2. Select **Username with password** or **Secret text** (for Personal Access Token)
3. Configure:
   - **Username**: Your GitHub username
   - **Password**: Personal Access Token
   - **ID**: `github-credentials`
   - **Description**: GitHub Access

---

## 📝 Create Jenkins Pipeline

### Method 1: Pipeline from SCM (Recommended)

1. **Create New Item**
   - Click **New Item**
   - Enter name: `RecsysELK-Pipeline`
   - Select **Pipeline**
   - Click **OK**

2. **Configure Pipeline**
   - **Description**: "Automated deployment pipeline for Recommendation System with ELK Stack"
   
3. **Build Triggers** (Optional)
   - ☑️ **GitHub hook trigger for GITScm polling** (for automatic builds on push)
   - ☑️ **Poll SCM**: `H/5 * * * *` (check every 5 minutes as fallback)

4. **Pipeline Configuration**
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/Aaryan-Ajith-Dev/Project-25034.git`
   - **Credentials**: Select GitHub credentials if private repo
   - **Branch**: `*/main`
   - **Script Path**: `server/Jenkinsfile`

5. **Save**

### Method 2: Pipeline Script (Direct)

1. Create New Item (same as above)
2. In **Pipeline** section:
   - **Definition**: Pipeline script
   - Copy and paste the entire Jenkinsfile content
3. Save

---

## 🔄 Setup GitHub Webhook (Automatic Builds)

### Configure in GitHub:
1. Go to your repository: https://github.com/Aaryan-Ajith-Dev/Project-25034
2. Navigate to **Settings → Webhooks → Add webhook**
3. Configure:
   - **Payload URL**: `http://<your-jenkins-url>:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Which events**: Just the push event
   - **Active**: ☑️
4. Click **Add webhook**

### Configure in Jenkins:
1. Go to your pipeline job
2. **Configure → Build Triggers**
3. Enable: **GitHub hook trigger for GITScm polling**
4. Save

Now every push to GitHub will automatically trigger the pipeline!

---

## 🚀 Running the Pipeline

### Manual Trigger
1. Go to your pipeline: `RecsysELK-Pipeline`
2. Click **Build Now**
3. Watch the progress in **Build History**
4. Click on build number (e.g., #1) to see details
5. Click **Console Output** to see real-time logs

### Automatic Trigger
- Just push changes to GitHub:
```bash
git add .
git commit -m "Update backend code"
git push origin main
```
- Pipeline starts automatically!

---

## 📊 Pipeline Stages

The pipeline executes these stages in order:

| Stage | Duration | Description |
|-------|----------|-------------|
| 🧹 Cleanup Workspace | ~5s | Cleans previous build artifacts |
| 📥 Checkout Code | ~10s | Pulls latest code from GitHub |
| 🐳 Build Docker Image | ~2-5min | Builds Docker image from Dockerfile |
| 🔐 Login to Docker Hub | ~2s | Authenticates with Docker Hub |
| 📤 Push Docker Image | ~1-3min | Pushes image with build tag and 'latest' |
| 🔧 Setup Kubernetes | ~5s | Creates namespace and prepares cluster |
| 📊 Deploy ELK Stack | ~2-3min | Deploys Elasticsearch, Logstash, Kibana, Filebeat |
| 🚀 Deploy Backend | ~1-2min | Deploys application with new image |
| ✔️ Verify Deployment | ~30s | Checks all pods are running |
| ⏳ Wait for Services | ~60s | Allows services to stabilize |
| 🧪 Run Tests | ~30-60s | Runs comprehensive test suite (8 tests) |
| 📋 Generate Report | ~5s | Creates deployment summary |

**Total Duration**: ~10-15 minutes

---

## 🔍 Monitoring the Pipeline

### View Console Output
```
Jenkins → RecsysELK-Pipeline → #<build-number> → Console Output
```

### Key Indicators
- ✅ Green checkmark = Stage passed
- ❌ Red X = Stage failed
- 🔵 Blue progress = Stage running
- ⏸️ Gray = Stage pending

### Check Kubernetes Status
```bash
# Check all resources
kubectl get all -n recsys

# Check pod logs
kubectl logs -n recsys deployment/recsys-backend -c recsys-backend -f

# Check ELK stack
kubectl get pods -n recsys | grep -E "elasticsearch|logstash|kibana"
```

---

## 🎯 Expected Outputs

### Successful Build
```
🎉 DEPLOYMENT SUCCESSFUL
Build: 5
Image: shreyas0s/recsys:5
Namespace: recsys

All services are running and tests passed!
```

### Test Results
```
================================================================================
TEST REPORT - Recommendation System with ELK Logging
================================================================================
Total Tests: 8
Passed: 8
Failed: 0

Test Results:
  ✓ PASS: API Health Check
  ✓ PASS: User Signup
  ✓ PASS: User Login
  ✓ PASS: User Profile Update
  ✓ PASS: Get Recommendations
  ✓ PASS: Backend Logs Written
  ✓ PASS: Logs in Elasticsearch
  ✓ PASS: Log Content Verification
```

### Access URLs (after deployment)
- **Kibana Dashboard**: http://<minikube-ip>:30561
- **API Endpoint**: http://api.<minikube-ip>.nip.io

---

## 🐛 Troubleshooting

### Issue 1: Docker Permission Denied
```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Issue 2: Kubectl Not Found
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/
```

### Issue 3: Kubernetes Config Not Found
```bash
# Copy kubeconfig
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
```

### Issue 4: Docker Hub Login Failed
- Check credentials in Jenkins
- Verify ID is `dockerhub-credentials`
- Try using Docker Hub access token instead of password

### Issue 5: Tests Fail
```bash
# Check if pods are running
kubectl get pods -n recsys

# Check pod logs
kubectl logs -n recsys deployment/recsys-backend

# Check if services are accessible
kubectl get svc -n recsys
```

### Issue 6: Build Timeout
- Increase timeout in Jenkinsfile stages:
```groovy
kubectl wait --for=condition=ready pod -l app=elasticsearch -n recsys --timeout=600s
```

### View Pipeline Logs
```bash
# Jenkins console output shows all stage logs
# Or check directly:
kubectl logs -n recsys -l app=recsys-backend --tail=100
```

---

## 🔒 Security Best Practices

### 1. Use Secrets for Sensitive Data
```groovy
environment {
    DB_PASSWORD = credentials('mongodb-password')
    JWT_SECRET = credentials('jwt-secret')
}
```

### 2. Don't Commit Credentials
- Never hardcode passwords in Jenkinsfile
- Use Jenkins Credentials Manager
- Use Kubernetes Secrets

### 3. Restrict Jenkins Access
- Enable authentication
- Use Role-Based Access Control (RBAC)
- Limit build permissions

### 4. Secure Docker Images
- Scan images for vulnerabilities
- Use official base images
- Keep images updated

---

## 📈 Advanced Features

### 1. Email Notifications
Add to Jenkinsfile `post` section:
```groovy
post {
    success {
        mail to: 'team@example.com',
             subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
             body: "Build completed successfully!"
    }
    failure {
        mail to: 'team@example.com',
             subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
             body: "Build failed. Check console output."
    }
}
```

### 2. Slack Notifications
Install Slack Notification Plugin, then:
```groovy
post {
    success {
        slackSend color: 'good', message: "Deployment successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    }
}
```

### 3. Parallel Stages
```groovy
stage('Parallel Tests') {
    parallel {
        stage('Unit Tests') {
            steps { sh 'pytest tests/unit' }
        }
        stage('Integration Tests') {
            steps { sh 'pytest tests/integration' }
        }
    }
}
```

### 4. Artifact Archiving
```groovy
post {
    always {
        archiveArtifacts artifacts: 'tests/*.log', allowEmptyArchive: true
    }
}
```

---

## 📝 Customization

### Change Docker Image Name
Edit in Jenkinsfile:
```groovy
environment {
    DOCKER_IMAGE = 'your-dockerhub-username/your-image-name'
}
```

### Change Kubernetes Namespace
```groovy
environment {
    K8S_NAMESPACE = 'your-namespace'
}
```

### Change GitHub Repository
```groovy
environment {
    GIT_REPO = 'https://github.com/your-username/your-repo.git'
    GIT_BRANCH = 'develop'
}
```

### Add Environment Variables
```groovy
environment {
    MONGODB_URI = credentials('mongodb-uri')
    API_KEY = credentials('api-key')
}
```

---

## 🎓 Learning Resources

- **Jenkins Documentation**: https://www.jenkins.io/doc/
- **Pipeline Syntax**: https://www.jenkins.io/doc/book/pipeline/syntax/
- **Docker Plugin**: https://plugins.jenkins.io/docker-workflow/
- **Kubernetes Plugin**: https://plugins.jenkins.io/kubernetes/

---

## ✅ Verification Checklist

Before running the pipeline, verify:

- [ ] Jenkins is running and accessible
- [ ] Docker is installed and jenkins user has access
- [ ] kubectl is installed and configured
- [ ] Kubernetes cluster (Minikube) is running
- [ ] Docker Hub credentials are configured in Jenkins
- [ ] GitHub repository URL is correct in Jenkinsfile
- [ ] Docker image name matches your Docker Hub account
- [ ] All required plugins are installed
- [ ] Jenkinsfile is in the repository at `server/Jenkinsfile`

---

## 🚀 Quick Start Commands

```bash
# 1. Start Minikube
minikube start

# 2. Start Jenkins
sudo systemctl start jenkins

# 3. Verify Jenkins can access Docker
sudo -u jenkins docker ps

# 4. Verify Jenkins can access Kubernetes
sudo -u jenkins kubectl get nodes

# 5. Create pipeline in Jenkins UI

# 6. Run pipeline or push to GitHub

# 7. Monitor deployment
kubectl get all -n recsys

# 8. Access services
minikube service kibana -n recsys
```

---

## 📞 Support

If you encounter issues:
1. Check Console Output in Jenkins
2. Verify Kubernetes pod status: `kubectl get pods -n recsys`
3. Check pod logs: `kubectl logs -n recsys <pod-name>`
4. Review Jenkins logs: `sudo journalctl -u jenkins -f`

---

**Created by**: GitHub Copilot  
**Date**: December 11, 2025  
**Version**: 1.0
