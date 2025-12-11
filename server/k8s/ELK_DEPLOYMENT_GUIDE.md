# ELK Stack Integration with Kubernetes Backend

## Overview
This guide explains how to deploy the ELK stack (Elasticsearch, Logstash, Kibana) on Kubernetes and integrate it with your backend application for centralized logging.

## Architecture
- **Backend Pods**: Your FastAPI application writing logs to `/app/logs/backend.log`
- **Filebeat Sidecar**: Runs alongside each backend pod, reads logs and forwards to Logstash
- **Logstash**: Receives logs from Filebeat, processes them, and sends to Elasticsearch
- **Elasticsearch**: Stores and indexes all logs
- **Kibana**: Web UI for searching, visualizing, and analyzing logs

## Prerequisites
- Kubernetes cluster (Minikube, Docker Desktop, or cloud-based)
- kubectl configured and connected to your cluster
- Namespace `recsys` created (or modify the manifests)

## Deployment Steps

### 1. Create the Namespace (if not exists)
```bash
kubectl create namespace recsys
```

### 2. Deploy the ELK Stack Components

Deploy in this order to ensure dependencies are met:

```bash
# Deploy Elasticsearch
kubectl apply -f k8s/elasticsearch.yaml

# Wait for Elasticsearch to be ready (may take 2-3 minutes)
kubectl wait --for=condition=ready pod -l app=elasticsearch -n recsys --timeout=300s

# Deploy Logstash
kubectl apply -f k8s/logstash.yaml

# Wait for Logstash to be ready
kubectl wait --for=condition=ready pod -l app=logstash -n recsys --timeout=180s

# Deploy Kibana
kubectl apply -f k8s/kibana.yaml

# Wait for Kibana to be ready
kubectl wait --for=condition=ready pod -l app=kibana -n recsys --timeout=180s
```

### 3. Deploy Filebeat Configuration
```bash
kubectl apply -f k8s/filebeat-configmap.yaml
```

### 4. Deploy Your Backend with Filebeat Sidecar
```bash
# First, ensure your secrets and configmaps are deployed
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# Then deploy the backend with Filebeat sidecar
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 5. Verify Deployment
```bash
# Check all pods are running
kubectl get pods -n recsys

# Expected output:
# NAME                              READY   STATUS    RESTARTS   AGE
# elasticsearch-0                   1/1     Running   0          5m
# logstash-xxxxx                    1/1     Running   0          4m
# kibana-xxxxx                      1/1     Running   0          3m
# recsys-backend-xxxxx              2/2     Running   0          2m
# recsys-backend-yyyyy              2/2     Running   0          2m

# Check services
kubectl get svc -n recsys
```

## Accessing Kibana

### Option 1: Port Forward (Development)
```bash
kubectl port-forward -n recsys svc/kibana 5601:5601
```
Then open: http://localhost:5601

### Option 2: NodePort (already configured)
Get your Minikube/node IP:
```bash
minikube ip  # or kubectl get nodes -o wide
```
Access Kibana at: `http://<NODE-IP>:30561`

### Option 3: Ingress (Production)
Apply the ingress configuration:
```bash
kubectl apply -f k8s/ingress.yaml
```

## Configure Kibana

### 1. Create Index Pattern
1. Open Kibana at http://localhost:5601
2. Go to **Management** → **Stack Management** → **Index Patterns**
3. Click **Create index pattern**
4. Enter: `backend-logs-*`
5. Click **Next step**
6. Select **@timestamp** as the time field
7. Click **Create index pattern**

### 2. View Logs
1. Navigate to **Discover** (compass icon in left sidebar)
2. Select `backend-logs-*` index pattern
3. You'll see logs from all your backend pods

## Testing the Setup

### Generate Test Logs
```bash
# Get backend service details
kubectl get svc -n recsys recsys-backend

# Port forward to test locally
kubectl port-forward -n recsys svc/recsys-backend 8000:80

# Send test requests
curl http://localhost:8000/
curl http://localhost:8000/auth/login
```

### Check Logs Flow

```bash
# Check backend logs are being written
kubectl exec -n recsys -it deployment/recsys-backend -c recsys-backend -- ls -la /app/logs/

# Check Filebeat is reading logs
kubectl logs -n recsys -l app=recsys-backend -c filebeat --tail=20

# Check Logstash is receiving logs
kubectl logs -n recsys -l app=logstash --tail=20

# Check Elasticsearch has indexed logs
kubectl exec -n recsys elasticsearch-0 -- curl -s http://localhost:9200/backend-logs-*/_count
```

## Troubleshooting

### Backend Not Writing Logs
```bash
# Check if /app/logs directory exists
kubectl exec -n recsys -it deployment/recsys-backend -c recsys-backend -- ls -la /app/

# Check Python logging configuration in main.py
kubectl logs -n recsys -l app=recsys-backend -c recsys-backend
```

### Filebeat Not Shipping Logs
```bash
# Check Filebeat container logs
kubectl logs -n recsys -l app=recsys-backend -c filebeat

# Verify ConfigMap
kubectl get cm -n recsys filebeat-config -o yaml

# Check if Logstash service is reachable
kubectl exec -n recsys -it deployment/recsys-backend -c filebeat -- nc -zv logstash 5044
```

### Logstash Not Processing
```bash
# Check Logstash logs
kubectl logs -n recsys -l app=logstash

# Verify Elasticsearch connection
kubectl exec -n recsys -l app=logstash -- curl -s http://elasticsearch:9200/_cluster/health
```

### Elasticsearch Issues
```bash
# Check Elasticsearch logs
kubectl logs -n recsys elasticsearch-0

# Check Elasticsearch health
kubectl exec -n recsys elasticsearch-0 -- curl -s http://localhost:9200/_cluster/health?pretty

# Check disk space
kubectl exec -n recsys elasticsearch-0 -- df -h
```

### Kibana Can't Connect
```bash
# Check Kibana logs
kubectl logs -n recsys -l app=kibana

# Verify Elasticsearch is accessible from Kibana
kubectl exec -n recsys -l app=kibana -- curl -s http://elasticsearch:9200/
```

## Resource Management

### Scaling

Scale backend replicas (Filebeat will scale automatically with sidecar pattern):
```bash
kubectl scale deployment -n recsys recsys-backend --replicas=5
```

### Resource Monitoring
```bash
# Check resource usage
kubectl top pods -n recsys

# Check persistent volumes
kubectl get pvc -n recsys
```

### Cleanup

To remove everything:
```bash
kubectl delete namespace recsys
```

To remove only ELK stack:
```bash
kubectl delete -f k8s/elasticsearch.yaml
kubectl delete -f k8s/logstash.yaml
kubectl delete -f k8s/kibana.yaml
```

## Production Considerations

1. **Elasticsearch Cluster**: For production, deploy a multi-node Elasticsearch cluster (3+ nodes)
2. **Persistent Storage**: Use StorageClass with proper backup policies
3. **Security**: Enable X-Pack security in Elasticsearch/Kibana
4. **Resource Limits**: Adjust based on log volume
5. **Log Retention**: Configure ILM (Index Lifecycle Management) policies
6. **Monitoring**: Set up Metricbeat to monitor the ELK stack itself
7. **High Availability**: Deploy multiple Logstash and Kibana replicas

## File Structure

```
k8s/
├── elasticsearch.yaml       # Elasticsearch StatefulSet & Service
├── logstash.yaml           # Logstash Deployment, Service & ConfigMap
├── kibana.yaml             # Kibana Deployment & Service
├── filebeat-configmap.yaml # Filebeat configuration
├── deployment.yaml         # Backend + Filebeat sidecar
├── service.yaml            # Backend service
├── configmap.yaml          # Backend config
└── secrets.yaml            # Backend secrets
```

## Next Steps

1. **Custom Dashboards**: Create Kibana dashboards for your specific metrics
2. **Alerts**: Set up Kibana alerting for error patterns
3. **Log Parsing**: Enhance Logstash filters to parse JSON logs
4. **APM Integration**: Add Elastic APM for application performance monitoring
