# Jenkins Pipeline Quick Reference

## 🚀 One-Time Setup (Do Once)

```bash
# 1. Install Jenkins
sudo apt update && sudo apt install openjdk-11-jdk jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins

# 2. Install Docker and add jenkins to docker group
sudo apt install docker.io -y
sudo usermod -aG docker jenkins

# 3. Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/

# 4. Copy kubeconfig for jenkins user
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube

# 5. Install Python for tests
sudo apt install python3 python3-pip -y

# 6. Restart Jenkins
sudo systemctl restart jenkins
```

## 🔐 Jenkins Credentials Setup

1. Go to: **Manage Jenkins → Credentials → System → Global credentials**
2. Add Credentials:
   - **Kind**: Username with password
   - **Username**: `shreyas0s` (your Docker Hub username)
   - **Password**: Your Docker Hub password/token
   - **ID**: `dockerhub-credentials` (MUST be exact)
   - **Description**: Docker Hub Login

## 📋 Create Pipeline Job

1. **New Item** → Name: `RecsysELK-Pipeline` → **Pipeline** → OK
2. **Pipeline** section:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/Aaryan-Ajith-Dev/Project-25034.git`
   - **Branch**: `*/main`
   - **Script Path**: `server/Jenkinsfile`
3. **Save**

## 🎯 How to Use

### Option 1: Manual Build
```
Jenkins Dashboard → RecsysELK-Pipeline → Build Now
```

### Option 2: Auto-Build on Git Push
1. Enable in Jenkins job: **Build Triggers** → ☑️ **GitHub hook trigger**
2. Add webhook in GitHub:
   - URL: `http://<jenkins-ip>:8080/github-webhook/`
   - Content type: `application/json`
3. Now just push code:
```bash
git add .
git commit -m "Updated code"
git push origin main
# Pipeline automatically starts!
```

## 📊 Pipeline Flow

```
1. Checkout Code from GitHub
   ↓
2. Build Docker Image
   ↓
3. Push to Docker Hub (shreyas0s/recsys:BUILD_NUMBER)
   ↓
4. Deploy ELK Stack to Kubernetes
   ↓
5. Deploy Backend Application
   ↓
6. Run Tests (8 tests)
   ↓
7. Generate Report
```

**Duration**: ~10-15 minutes

## 🔍 Monitor Progress

### View Live Logs
```
Jenkins → RecsysELK-Pipeline → #<build-number> → Console Output
```

### Check Kubernetes
```bash
# All resources
kubectl get all -n recsys

# Pod status
kubectl get pods -n recsys

# Backend logs
kubectl logs -n recsys deployment/recsys-backend -c recsys-backend -f

# Test if API works
curl http://api.$(minikube ip).nip.io/
```

## ✅ Success Indicators

### In Jenkins Console:
```
✅ ALL TESTS PASSED! ELK Stack is working correctly!

🎉 DEPLOYMENT SUCCESSFUL
Build: 5
Image: shreyas0s/recsys:5
Namespace: recsys
```

### In Kubernetes:
```bash
$ kubectl get pods -n recsys
NAME                              READY   STATUS    RESTARTS   AGE
elasticsearch-0                   1/1     Running   0          5m
kibana-xxx                        1/1     Running   0          5m
logstash-xxx                      1/1     Running   0          5m
recsys-backend-xxx                2/2     Running   0          3m  # 2/2 = backend + filebeat
```

## 🌐 Access Services

```bash
# Get Minikube IP
minikube ip

# Access Kibana
http://<minikube-ip>:30561

# Access API
http://api.<minikube-ip>.nip.io

# Or use port-forward for Elasticsearch
kubectl port-forward -n recsys svc/elasticsearch 9200:9200
```

## 🐛 Quick Troubleshooting

### Pipeline fails with "Docker permission denied"
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Pipeline fails with "kubectl: command not found"
```bash
sudo apt install kubectl -y
# OR
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/
```

### Pipeline fails with "Docker Hub login failed"
- Check credentials ID is exactly: `dockerhub-credentials`
- Try using Docker Hub Access Token instead of password

### Tests fail
```bash
# Check if pods are ready
kubectl get pods -n recsys

# Check pod logs
kubectl logs -n recsys -l app=recsys-backend

# Delete and redeploy if needed
kubectl delete namespace recsys
# Run pipeline again
```

### Minikube not running
```bash
minikube start
# Wait for it to start, then run pipeline
```

## 🔄 Update Image Name (Optional)

Edit `server/Jenkinsfile`:
```groovy
environment {
    DOCKER_IMAGE = 'your-username/your-image-name'  // Change this
}
```

## 📝 Environment Variables in Jenkinsfile

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCKER_IMAGE` | Docker image name | `shreyas0s/recsys` |
| `IMAGE_TAG` | Image tag | `${BUILD_NUMBER}` |
| `K8S_NAMESPACE` | Kubernetes namespace | `recsys` |
| `GIT_REPO` | GitHub repository | `Project-25034` |
| `GIT_BRANCH` | Git branch | `main` |

## 🎓 Common Jenkins Commands

```bash
# Start/Stop Jenkins
sudo systemctl start jenkins
sudo systemctl stop jenkins
sudo systemctl restart jenkins

# Check Jenkins status
sudo systemctl status jenkins

# View Jenkins logs
sudo journalctl -u jenkins -f

# Jenkins home directory
/var/lib/jenkins/

# Jenkins URL
http://localhost:8080
```

## 📦 Files Created

- ✅ `server/Jenkinsfile` - Pipeline definition
- ✅ `server/JENKINS_SETUP.md` - Detailed setup guide
- ✅ `server/JENKINS_QUICKSTART.md` - This quick reference

## 🎯 Next Steps After Successful Pipeline

1. **View Logs in Kibana**:
   - Open: http://<minikube-ip>:30561
   - Create index pattern: `backend-logs-*`
   - Go to Discover to see logs

2. **Test the API**:
   ```bash
   # Health check
   curl http://api.$(minikube ip).nip.io/
   
   # Signup
   curl -X POST http://api.$(minikube ip).nip.io/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"John","email":"john@example.com","phone":"1234567890","location":"USA","summary":"Test","skills":"Python","password":"password123","role":"developer"}'
   ```

3. **Scale the Application**:
   ```bash
   # Manual scaling
   kubectl scale deployment recsys-backend --replicas=3 -n recsys
   
   # Or let HPA handle it automatically (60% CPU threshold)
   ```

4. **Monitor Resource Usage**:
   ```bash
   kubectl top pods -n recsys
   kubectl top nodes
   ```

## 📞 Need Help?

1. Check Jenkins Console Output
2. Check Kubernetes: `kubectl get pods -n recsys`
3. Check pod logs: `kubectl logs -n recsys <pod-name>`
4. Review `JENKINS_SETUP.md` for detailed troubleshooting

---

**Quick Start Summary**:
1. Setup Jenkins once ☝️
2. Add Docker Hub credentials 🔐
3. Create pipeline job 📋
4. Click "Build Now" or push to GitHub 🚀
5. Wait ~10-15 minutes ⏳
6. Access Kibana & API 🎉
