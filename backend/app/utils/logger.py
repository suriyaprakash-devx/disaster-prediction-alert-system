import logging
import sys
from app.config import settings

def setup_logger():
    log_format = (
        '{"time": "%(asctime)s", "level": "%(levelname)s", '
        '"module": "%(name)s", "message": "%(message)s"}'
    )
    
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        datefmt="%Y-%m-%dT%H:%M:%SZ"
    )
    return logging.getLogger("designops_ai")

logger = setup_logger()
