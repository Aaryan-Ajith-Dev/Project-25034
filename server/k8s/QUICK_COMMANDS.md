# Quick Commands for Managing the Application

## Stop all pods (scale to 0)
```bash
./stop-application.sh
```

## Start all pods (scale back up)
```bash
./start-application.sh
```

## Alternative: Manual commands

### Stop Everything (Scale to 0)
```bash
# Scale all deployments to 0
kubectl scale deployment --all -n recsys --replicas=0

# Scale all statefulsets to 0
kubectl scale statefulset --all -n recsys --replicas=0

# Verify all pods are terminated
kubectl get pods -n recsys
```

### Start Everything (Scale back up)
```bash
# Scale Elasticsearch first
kubectl scale statefulset elasticsearch -n recsys --replicas=1

# Wait a bit for Elasticsearch
sleep 10

# Scale other services
kubectl scale deployment logstash -n recsys --replicas=1
kubectl scale deployment kibana -n recsys --replicas=1
kubectl scale deployment recsys-backend -n recsys --replicas=2

# Check status
kubectl get pods -n recsys
```

## Complete Cleanup (Delete Everything)
```bash
# Delete all resources in the namespace
kubectl delete namespace recsys

# Or delete specific resources
kubectl delete -f elasticsearch.yaml
kubectl delete -f logstash.yaml
kubectl delete -f kibana.yaml
kubectl delete -f deployment.yaml
kubectl delete -f ingress.yaml
kubectl delete -f hpa.yaml
```

## Check Status
```bash
# View all resources
kubectl get all,ingress,hpa,pvc -n recsys

# Watch pods in real-time
kubectl get pods -n recsys -w

# Check HPA status
kubectl get hpa -n recsys
```
