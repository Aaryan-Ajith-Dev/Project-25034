# services/logging_service.py
import logging
import json
from datetime import datetime
import os

logger = logging.getLogger("app")
logger.setLevel(logging.INFO)

def log_event(event: str, payload: dict):
    """Generic JSON logging function"""
    log_data = {
        "event": event,
        "timestamp": datetime.utcnow().isoformat(),
        "pod": os.getenv("HOSTNAME", "unknown"),
        **payload
    }
    logger.info(json.dumps(log_data))
