# Jenkins Pipeline Pre-Flight Checklist

Use this checklist to ensure everything is ready before running the pipeline.

---

## ✅ Phase 1: Prerequisites (One-Time Setup)

### System Requirements
- [ ] Ubuntu/Debian Linux system
- [ ] Minimum 4GB RAM
- [ ] Minimum 20GB disk space
- [ ] Sudo/root access

### Minikube Setup
```bash
# Check Minikube status
minikube status
```
- [ ] Minikube is installed
- [ ] Minikube is running
- [ ] Can access with: `kubectl get nodes`

### Docker Setup
```bash
# Check Docker
docker --version
docker ps
```
- [ ] Docker is installed (version 20.10+)
- [ ] Docker service is running
- [ ] Can run: `docker ps` without sudo

---

## ✅ Phase 2: Jenkins Installation

### Install Jenkins
```bash
# Install
sudo apt update
sudo apt install openjdk-11-jdk jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
sudo systemctl status jenkins
```

- [ ] Java 11 is installed
- [ ] Jenkins is installed
- [ ] Jenkins service is running
- [ ] Jenkins is enabled on boot

### Access Jenkins
```bash
# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# Open in browser
http://localhost:8080
```

- [ ] Can access Jenkins UI at http://localhost:8080
- [ ] Got initial admin password
- [ ] Completed initial setup wizard
- [ ] Installed suggested plugins
- [ ] Created admin user account

---

## ✅ Phase 3: Jenkins Plugins

Go to: **Manage Jenkins → Plugins → Available**

Install these plugins:
- [ ] Git Plugin
- [ ] Docker Pipeline Plugin
- [ ] Kubernetes Plugin
- [ ] Pipeline Plugin
- [ ] Credentials Plugin
- [ ] GitHub Plugin (optional, for webhooks)

After installation:
- [ ] Restart Jenkins
- [ ] All plugins show as active

---

## ✅ Phase 4: System Tools Configuration

### Configure Jenkins User for Docker
```bash
# Add jenkins to docker group
sudo usermod -aG docker jenkins

# Verify
sudo -u jenkins docker ps
```

- [ ] Jenkins user added to docker group
- [ ] Can run: `sudo -u jenkins docker ps`

### Install kubectl
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/

# Verify
kubectl version --client
```

- [ ] kubectl is installed
- [ ] kubectl version shows client version

### Configure kubectl for Jenkins
```bash
# Create .kube directory for jenkins user
sudo mkdir -p /var/lib/jenkins/.kube

# Copy kubeconfig
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config

# Set ownership
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube

# Set permissions
sudo chmod 600 /var/lib/jenkins/.kube/config

# Verify
sudo -u jenkins kubectl get nodes
```

- [ ] `.kube` directory created for jenkins
- [ ] Kubeconfig copied
- [ ] Correct ownership set
- [ ] Can run: `sudo -u jenkins kubectl get nodes`

### Install Python Tools
```bash
# Install Python and pip
sudo apt install python3 python3-pip -y

# Verify
python3 --version
pip3 --version
```

- [ ] Python 3 is installed
- [ ] pip3 is installed

### Restart Jenkins
```bash
sudo systemctl restart jenkins
```

- [ ] Jenkins restarted successfully
- [ ] All changes applied

---

## ✅ Phase 5: Docker Hub Setup

### Create Docker Hub Account (if needed)
- [ ] Have Docker Hub account
- [ ] Know Docker Hub username
- [ ] Have Docker Hub password or access token

**Recommended:** Use Personal Access Token instead of password
1. Go to: https://hub.docker.com/settings/security
2. Create new access token
3. Copy and save it securely

- [ ] Created Docker Hub access token (optional but recommended)

---

## ✅ Phase 6: Jenkins Credentials

### Add Docker Hub Credentials
1. Go to: **Manage Jenkins → Credentials → System → Global credentials**
2. Click: **Add Credentials**
3. Configure:
   - Kind: **Username with password**
   - Username: `shreyas0s` (or your Docker Hub username)
   - Password: Your Docker Hub password or access token
   - ID: `dockerhub-credentials` (MUST be exact!)
   - Description: Docker Hub Login
4. Click: **OK**

- [ ] Opened Jenkins Credentials page
- [ ] Added Docker Hub credentials
- [ ] ID is exactly: `dockerhub-credentials`
- [ ] Verified credentials are saved

---

## ✅ Phase 7: GitHub Repository

### Repository Access
```bash
# Test clone (optional)
git clone https://github.com/Aaryan-Ajith-Dev/Project-25034.git /tmp/test-clone
```

- [ ] Repository exists: https://github.com/Aaryan-Ajith-Dev/Project-25034
- [ ] Repository is accessible (public or have credentials)
- [ ] `server/Jenkinsfile` exists in repo
- [ ] All k8s manifests exist in `server/k8s/`

---

## ✅ Phase 8: Create Jenkins Pipeline Job

### Create Pipeline
1. Click: **New Item**
2. Name: `RecsysELK-Pipeline`
3. Select: **Pipeline**
4. Click: **OK**

- [ ] Created new pipeline item

### Configure Pipeline
1. **Description**: "Automated deployment pipeline for Recommendation System with ELK Stack"
2. **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/Aaryan-Ajith-Dev/Project-25034.git`
   - Credentials: (leave blank if public repo)
   - Branch: `*/main`
   - Script Path: `server/Jenkinsfile`
3. Click: **Save**

- [ ] Set pipeline description
- [ ] Configured SCM to Git
- [ ] Set correct repository URL
- [ ] Set branch to `*/main`
- [ ] Set script path to `server/Jenkinsfile`
- [ ] Saved configuration

### Optional: Enable Auto-Build
1. **Configure** → **Build Triggers**
2. Enable: **GitHub hook trigger for GITScm polling**
3. **Save**

- [ ] Enabled GitHub webhook trigger (optional)

---

## ✅ Phase 9: Verify Jenkinsfile

### Check Jenkinsfile Contents
```bash
# View Jenkinsfile
cat server/Jenkinsfile
```

Verify these environment variables are correct:
- [ ] `DOCKER_IMAGE`: Set to your Docker Hub username/image
- [ ] `K8S_NAMESPACE`: Set to `recsys` (or your namespace)
- [ ] `GIT_REPO`: Set to correct GitHub repo URL
- [ ] `GIT_BRANCH`: Set to `main` (or your branch)

If changes needed:
```bash
# Edit Jenkinsfile
nano server/Jenkinsfile

# Update DOCKER_IMAGE
DOCKER_IMAGE = 'your-username/your-image'

# Save and push
git add server/Jenkinsfile
git commit -m "Updated Jenkinsfile config"
git push origin main
```

- [ ] Reviewed Jenkinsfile
- [ ] All environment variables are correct
- [ ] Committed any changes (if needed)

---

## ✅ Phase 10: Pre-Flight Checks

### System Checks
```bash
# Check all services
systemctl status jenkins
systemctl status docker
minikube status

# Check access
sudo -u jenkins docker ps
sudo -u jenkins kubectl get nodes

# Check disk space
df -h
```

- [ ] Jenkins is running
- [ ] Docker is running
- [ ] Minikube is running
- [ ] Jenkins can use Docker
- [ ] Jenkins can use kubectl
- [ ] Enough disk space (>10GB free)

### Kubernetes Checks
```bash
# Check Kubernetes
kubectl cluster-info
kubectl get nodes
kubectl get namespaces

# Check if namespace exists (should not exist yet)
kubectl get namespace recsys
```

- [ ] Kubernetes cluster is accessible
- [ ] At least one node is Ready
- [ ] Can list namespaces
- [ ] `recsys` namespace doesn't exist yet (pipeline will create it)

### Network Checks
```bash
# Check network
ping -c 3 github.com
ping -c 3 hub.docker.com
```

- [ ] Can reach GitHub
- [ ] Can reach Docker Hub
- [ ] No network issues

---

## ✅ Phase 11: Test Run (Dry Run)

### Manual Verification
```bash
# Test Docker build (in project directory)
cd server
docker build -t test-image .

# Verify build succeeded
docker images | grep test-image

# Clean up
docker rmi test-image
```

- [ ] Docker build succeeds
- [ ] No build errors
- [ ] Image appears in `docker images`

### Test kubectl
```bash
# Test kubectl commands
kubectl get nodes
kubectl get pods --all-namespaces
```

- [ ] kubectl commands work
- [ ] No authentication errors

---

## ✅ Phase 12: Run the Pipeline!

### Start Pipeline
1. Go to Jenkins: http://localhost:8080
2. Click: `RecsysELK-Pipeline`
3. Click: **Build Now**
4. Click: Build number (e.g., #1)
5. Click: **Console Output**
6. Watch the progress

- [ ] Pipeline started
- [ ] Console output is visible
- [ ] No immediate errors

### Monitor Progress
Watch for these stages to complete:
- [ ] ✅ Stage 1: Cleanup Workspace
- [ ] ✅ Stage 2: Checkout Code
- [ ] ✅ Stage 3: Build Docker Image
- [ ] ✅ Stage 4: Login to Docker Hub
- [ ] ✅ Stage 5: Push Docker Image
- [ ] ✅ Stage 6: Setup Kubernetes
- [ ] ✅ Stage 7: Deploy ELK Stack
- [ ] ✅ Stage 8: Deploy Backend Application
- [ ] ✅ Stage 9: Verify Deployment
- [ ] ✅ Stage 10: Wait for Services
- [ ] ✅ Stage 11: Run Tests
- [ ] ✅ Stage 12: Generate Test Report

**Expected Duration**: 10-15 minutes

---

## ✅ Phase 13: Verify Success

### Check Console Output
Look for this at the end:
```
🎉 DEPLOYMENT SUCCESSFUL
Build: 1
Image: shreyas0s/recsys:1
Namespace: recsys

All services are running and tests passed!
```

- [ ] Pipeline shows SUCCESS
- [ ] All stages completed
- [ ] All tests passed (8/8)
- [ ] No error messages

### Check Kubernetes
```bash
# Check all resources
kubectl get all -n recsys

# Expected output:
# - 1 Elasticsearch pod (Running)
# - 1 Logstash pod (Running)
# - 1 Kibana pod (Running)
# - 2+ Backend pods (Running) with 2/2 ready (app + filebeat)
```

- [ ] Namespace `recsys` exists
- [ ] Elasticsearch pod is Running (1/1)
- [ ] Logstash pod is Running (1/1)
- [ ] Kibana pod is Running (1/1)
- [ ] Backend pods are Running (2/2 each)
- [ ] Services are created
- [ ] HPA is active
- [ ] Ingress is created

### Check Docker Hub
1. Go to: https://hub.docker.com/r/shreyas0s/recsys (or your image)
2. Check: New image with tag = build number

- [ ] New image appears on Docker Hub
- [ ] Image has correct tag
- [ ] `latest` tag is updated

### Test API
```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)
echo "API URL: http://api.${MINIKUBE_IP}.nip.io"

# Test API
curl http://api.${MINIKUBE_IP}.nip.io/

# Expected: {"message":"Welcome to the Recommendation System"}
```

- [ ] API is accessible
- [ ] API returns correct response
- [ ] No connection errors

### Test Kibana
```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)
echo "Kibana URL: http://${MINIKUBE_IP}:30561"

# Open in browser
```

- [ ] Kibana is accessible
- [ ] Kibana UI loads
- [ ] No errors in Kibana

### Check Elasticsearch
```bash
# Port-forward Elasticsearch
kubectl port-forward -n recsys svc/elasticsearch 9200:9200 &

# Check logs
curl http://localhost:9200/backend-logs-*/_count

# Expected: {"count":12} or more
```

- [ ] Elasticsearch is accessible
- [ ] Logs are indexed
- [ ] Count > 0

---

## ✅ Phase 14: Final Verification

### Run Tests Manually
```bash
cd server/tests
./run_all_tests.sh
```

- [ ] All 8 tests pass
- [ ] No test failures
- [ ] Logs visible in Elasticsearch

### Check Auto-Scaling
```bash
# Check HPA
kubectl get hpa -n recsys

# Scale manually to test
kubectl scale deployment recsys-backend --replicas=3 -n recsys

# Wait and check
kubectl get pods -n recsys
```

- [ ] HPA is active
- [ ] Can scale manually
- [ ] Pods scale correctly

---

## 🎉 Success Checklist

If all items above are checked, you have successfully:

✅ Installed and configured Jenkins  
✅ Set up all required plugins  
✅ Configured Docker and kubectl access  
✅ Added Docker Hub credentials  
✅ Created pipeline job  
✅ Run pipeline successfully  
✅ Deployed complete ELK Stack  
✅ Deployed backend application  
✅ Verified all tests pass  
✅ Confirmed services are accessible  

**Your CI/CD pipeline is now fully operational!** 🚀

---

## 📝 Post-Setup Tasks

### Optional: Setup GitHub Webhook
1. Go to: GitHub repo → Settings → Webhooks
2. Add webhook:
   - URL: `http://<your-jenkins-ip>:8080/github-webhook/`
   - Content type: `application/json`
   - Events: Just the push event
3. Save

- [ ] GitHub webhook configured (optional)
- [ ] Tested with a push (optional)

### Optional: Email Notifications
1. Go to: Manage Jenkins → Configure System
2. Configure: Email Notification
3. Update Jenkinsfile with email addresses

- [ ] Email configured (optional)

### Optional: Slack Notifications
1. Install: Slack Notification Plugin
2. Configure Slack workspace
3. Update Jenkinsfile with Slack webhook

- [ ] Slack configured (optional)

---

## 🐛 Troubleshooting

If any stage fails, check:

### Common Issues
- [ ] Jenkins can access Docker: `sudo -u jenkins docker ps`
- [ ] Jenkins can access Kubernetes: `sudo -u jenkins kubectl get nodes`
- [ ] Docker Hub credentials ID is: `dockerhub-credentials`
- [ ] Minikube is running: `minikube status`
- [ ] Enough disk space: `df -h`
- [ ] Network connectivity: `ping github.com`

### Get Help
- Check: Console Output in Jenkins
- Check: `kubectl get pods -n recsys`
- Check: `kubectl logs -n recsys <pod-name>`
- Review: JENKINS_SETUP.md for detailed troubleshooting

---

## 📞 Quick Reference

### Essential Commands
```bash
# Jenkins
sudo systemctl status jenkins
sudo systemctl restart jenkins
sudo journalctl -u jenkins -f

# Kubernetes
kubectl get all -n recsys
kubectl logs -n recsys <pod-name> -f
kubectl describe pod <pod-name> -n recsys

# Minikube
minikube status
minikube stop
minikube start

# Docker
docker ps
docker images | grep recsys
```

### Access URLs
- Jenkins: http://localhost:8080
- Kibana: http://<minikube-ip>:30561
- API: http://api.<minikube-ip>.nip.io

---

**Date**: December 11, 2025  
**Version**: 1.0  
**Status**: Complete ✅
