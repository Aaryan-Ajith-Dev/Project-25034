#!/bin/bash

# ELK Stack + Backend Deployment Script for Kubernetes
# Usage: ./deploy-elk.sh [install|uninstall|status]

set -e

NAMESPACE="recsys"
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

function check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl first."
        exit 1
    fi
    log_info "kubectl found: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
}

function create_namespace() {
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        log_info "Namespace '$NAMESPACE' already exists"
    else
        log_info "Creating namespace '$NAMESPACE'"
        kubectl create namespace $NAMESPACE
    fi
}

function deploy_elasticsearch() {
    log_info "Deploying Elasticsearch..."
    kubectl apply -f "$K8S_DIR/elasticsearch.yaml"
    
    log_info "Waiting for Elasticsearch to be ready (this may take 2-3 minutes)..."
    kubectl wait --for=condition=ready pod -l app=elasticsearch -n $NAMESPACE --timeout=300s || {
        log_error "Elasticsearch failed to start. Check logs with: kubectl logs -n $NAMESPACE -l app=elasticsearch"
        return 1
    }
    log_info "✓ Elasticsearch is ready"
}

function deploy_logstash() {
    log_info "Deploying Logstash..."
    kubectl apply -f "$K8S_DIR/logstash.yaml"
    
    log_info "Waiting for Logstash to be ready..."
    kubectl wait --for=condition=ready pod -l app=logstash -n $NAMESPACE --timeout=180s || {
        log_error "Logstash failed to start. Check logs with: kubectl logs -n $NAMESPACE -l app=logstash"
        return 1
    }
    log_info "✓ Logstash is ready"
}

function deploy_kibana() {
    log_info "Deploying Kibana..."
    kubectl apply -f "$K8S_DIR/kibana.yaml"
    
    log_info "Waiting for Kibana to be ready..."
    kubectl wait --for=condition=ready pod -l app=kibana -n $NAMESPACE --timeout=180s || {
        log_error "Kibana failed to start. Check logs with: kubectl logs -n $NAMESPACE -l app=kibana"
        return 1
    }
    log_info "✓ Kibana is ready"
}

function deploy_backend() {
    log_info "Deploying Filebeat ConfigMap..."
    kubectl apply -f "$K8S_DIR/filebeat-configmap.yaml"
    
    log_info "Deploying Backend with Filebeat sidecar..."
    
    # Check if secrets and configmap exist
    if [ -f "$K8S_DIR/secrets.yaml" ]; then
        kubectl apply -f "$K8S_DIR/secrets.yaml"
    else
        log_warn "secrets.yaml not found, skipping..."
    fi
    
    if [ -f "$K8S_DIR/configmap.yaml" ]; then
        kubectl apply -f "$K8S_DIR/configmap.yaml"
    else
        log_warn "configmap.yaml not found, skipping..."
    fi
    
    kubectl apply -f "$K8S_DIR/deployment.yaml"
    
    if [ -f "$K8S_DIR/service.yaml" ]; then
        kubectl apply -f "$K8S_DIR/service.yaml"
    fi
    
    log_info "Waiting for backend pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=recsys-backend -n $NAMESPACE --timeout=180s || {
        log_error "Backend failed to start. Check logs with: kubectl logs -n $NAMESPACE -l app=recsys-backend -c recsys-backend"
        return 1
    }
    log_info "✓ Backend is ready"
}

function install() {
    log_info "Starting ELK Stack + Backend deployment..."
    
    check_kubectl
    create_namespace
    
    deploy_elasticsearch || exit 1
    deploy_logstash || exit 1
    deploy_kibana || exit 1
    deploy_backend || exit 1
    
    log_info ""
    log_info "=========================================="
    log_info "✓ ELK Stack + Backend deployed successfully!"
    log_info "=========================================="
    log_info ""
    show_access_info
}

function uninstall() {
    log_warn "Uninstalling ELK Stack + Backend from namespace '$NAMESPACE'..."
    
    kubectl delete -f "$K8S_DIR/deployment.yaml" --ignore-not-found=true
    kubectl delete -f "$K8S_DIR/service.yaml" --ignore-not-found=true 2>/dev/null || true
    kubectl delete -f "$K8S_DIR/filebeat-configmap.yaml" --ignore-not-found=true
    kubectl delete -f "$K8S_DIR/kibana.yaml" --ignore-not-found=true
    kubectl delete -f "$K8S_DIR/logstash.yaml" --ignore-not-found=true
    kubectl delete -f "$K8S_DIR/elasticsearch.yaml" --ignore-not-found=true
    
    log_info "✓ ELK Stack + Backend uninstalled"
    log_warn "Note: Namespace '$NAMESPACE' was not deleted. To delete it, run: kubectl delete namespace $NAMESPACE"
}

function status() {
    log_info "Checking status of ELK Stack + Backend in namespace '$NAMESPACE'..."
    echo ""
    
    echo "Pods:"
    kubectl get pods -n $NAMESPACE
    echo ""
    
    echo "Services:"
    kubectl get svc -n $NAMESPACE
    echo ""
    
    echo "PersistentVolumeClaims:"
    kubectl get pvc -n $NAMESPACE
    echo ""
    
    show_access_info
}

function show_access_info() {
    log_info "Access Information:"
    echo ""
    echo "  Kibana UI:"
    echo "    - NodePort: http://$(minikube ip 2>/dev/null || echo '<NODE-IP>'):30561"
    echo "    - Port Forward: kubectl port-forward -n $NAMESPACE svc/kibana 5601:5601"
    echo "      Then open: http://localhost:5601"
    echo ""
    echo "  Backend API:"
    echo "    - Port Forward: kubectl port-forward -n $NAMESPACE svc/recsys-backend 8000:80"
    echo "      Then open: http://localhost:8000"
    echo ""
    echo "  Elasticsearch:"
    echo "    - Port Forward: kubectl port-forward -n $NAMESPACE svc/elasticsearch 9200:9200"
    echo "      Then access: http://localhost:9200"
    echo ""
    log_info "Next Steps:"
    echo "  1. Access Kibana and create index pattern: backend-logs-*"
    echo "  2. View logs in Discover section"
    echo "  3. Generate test traffic to your backend API"
    echo ""
    log_info "Troubleshooting:"
    echo "  - View backend logs:     kubectl logs -n $NAMESPACE -l app=recsys-backend -c recsys-backend"
    echo "  - View Filebeat logs:    kubectl logs -n $NAMESPACE -l app=recsys-backend -c filebeat"
    echo "  - View Logstash logs:    kubectl logs -n $NAMESPACE -l app=logstash"
    echo "  - View Elasticsearch:    kubectl logs -n $NAMESPACE -l app=elasticsearch"
    echo "  - View Kibana logs:      kubectl logs -n $NAMESPACE -l app=kibana"
    echo ""
}

function show_help() {
    echo "ELK Stack + Backend Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install     Deploy ELK Stack and Backend to Kubernetes"
    echo "  uninstall   Remove ELK Stack and Backend from Kubernetes"
    echo "  status      Show status of all components"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install      # Deploy everything"
    echo "  $0 status       # Check deployment status"
    echo "  $0 uninstall    # Remove all components"
    echo ""
}

# Main script logic
case "${1:-help}" in
    install)
        install
        ;;
    uninstall)
        uninstall
        ;;
    status)
        status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
