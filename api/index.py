import sys
import os

# Add parent directory of backend directory to sys.path so 'backend' can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(parent_dir, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Add backend/app so internal imports inside 'backend/app' can resolve properly
app_dir = os.path.join(backend_dir, 'app')
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from backend.app.main import app
