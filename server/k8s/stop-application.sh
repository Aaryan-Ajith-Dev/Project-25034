#!/bin/bash

# Script to stop all application resources in the recsys namespace
# Usage: ./stop-application.sh

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
echo "  Stopping Application in namespace: $NAMESPACE"
echo "======================================"
echo ""

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    log_error "Namespace '$NAMESPACE' does not exist!"
    exit 1
fi

# Scale down deployments to 0 replicas
log_info "Scaling down all deployments to 0 replicas..."
DEPLOYMENTS=$(kubectl get deployments -n $NAMESPACE -o name 2>/dev/null)
if [ -n "$DEPLOYMENTS" ]; then
    for deployment in $DEPLOYMENTS; do
        log_info "Scaling $deployment to 0"
        kubectl scale $deployment -n $NAMESPACE --replicas=0
    done
else
    log_warn "No deployments found"
fi

# Scale down statefulsets to 0 replicas
log_info "Scaling down all statefulsets to 0 replicas..."
STATEFULSETS=$(kubectl get statefulsets -n $NAMESPACE -o name 2>/dev/null)
if [ -n "$STATEFULSETS" ]; then
    for statefulset in $STATEFULSETS; do
        log_info "Scaling $statefulset to 0"
        kubectl scale $statefulset -n $NAMESPACE --replicas=0
    done
else
    log_warn "No statefulsets found"
fi

echo ""
log_info "Waiting for all pods to terminate..."
kubectl wait --for=delete pod --all -n $NAMESPACE --timeout=60s 2>/dev/null || true

echo ""
log_info "Current pod status:"
kubectl get pods -n $NAMESPACE

echo ""
log_info "======================================"
log_info "✓ All application pods stopped!"
log_info "======================================"
echo ""
log_info "Resources still exist but are scaled to 0:"
echo "  - Deployments: scaled to 0 replicas"
echo "  - StatefulSets: scaled to 0 replicas"
echo "  - Services: still active (no pods behind them)"
echo "  - ConfigMaps/Secrets: unchanged"
echo "  - PersistentVolumes: unchanged"
echo ""
log_info "To restart the application, run: ./start-application.sh"
log_warn "To completely delete all resources, run: kubectl delete namespace $NAMESPACE"
