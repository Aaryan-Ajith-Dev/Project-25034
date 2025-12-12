#!/bin/bash

# Script to start/restart all application resources in the recsys namespace
# Usage: ./start-application.sh

set -e

NAMESPACE="recsys"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "======================================"
echo "  Starting Application in namespace: $NAMESPACE"
echo "======================================"
echo ""

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    log_error "Namespace '$NAMESPACE' does not exist!"
    exit 1
fi

# Scale up statefulsets first (Elasticsearch)
log_info "Scaling up statefulsets..."
STATEFULSETS=$(kubectl get statefulsets -n $NAMESPACE -o name 2>/dev/null)
if [ -n "$STATEFULSETS" ]; then
    for statefulset in $STATEFULSETS; do
        log_info "Scaling $statefulset to 1 replica"
        kubectl scale $statefulset -n $NAMESPACE --replicas=1
    done
    log_info "Waiting for statefulset pods to be ready..."
    sleep 10
else
    log_warn "No statefulsets found"
fi

# Scale up deployments
log_info "Scaling up deployments..."
DEPLOYMENTS=$(kubectl get deployments -n $NAMESPACE -o name 2>/dev/null)
if [ -n "$DEPLOYMENTS" ]; then
    for deployment in $DEPLOYMENTS; do
        DEPLOYMENT_NAME=$(echo $deployment | cut -d'/' -f2)
        
        # Different replica counts based on deployment
        if [[ "$DEPLOYMENT_NAME" == "recsys-backend" ]]; then
            # Let HPA manage this if it exists
            HPA_EXISTS=$(kubectl get hpa -n $NAMESPACE 2>/dev/null | grep -c "$DEPLOYMENT_NAME" || echo "0")
            if [ "$HPA_EXISTS" -gt 0 ]; then
                log_info "HPA is managing $DEPLOYMENT_NAME, setting to minReplicas (1)"
                kubectl scale $deployment -n $NAMESPACE --replicas=1
            else
                log_info "Scaling $deployment to 2 replicas"
                kubectl scale $deployment -n $NAMESPACE --replicas=2
            fi
        else
            log_info "Scaling $deployment to 1 replica"
            kubectl scale $deployment -n $NAMESPACE --replicas=1
        fi
    done
else
    log_warn "No deployments found"
fi

echo ""
log_info "Waiting for all pods to be ready..."
sleep 15

echo ""
log_info "Current pod status:"
kubectl get pods -n $NAMESPACE

echo ""
log_info "======================================"
log_info "✓ Application started!"
log_info "======================================"
echo ""
log_info "Access points:"
echo "  - Backend API: http://api.192.168.49.2.nip.io/"
echo "  - Kibana UI: http://192.168.49.2:30561"
echo ""
log_info "To check status: kubectl get all,ingress,hpa -n $NAMESPACE"
log_info "To stop again: ./stop-application.sh"
