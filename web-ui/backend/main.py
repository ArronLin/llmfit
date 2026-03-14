import argparse
import uvicorn
import os
import sys
from fastapi import FastAPI
from fastapi.responses import FileResponse
from app.main import app as api_app
from app.core.config import settings
from app.api.v1 import router as api_router

def get_base_path():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(__file__)

def main():
    parser = argparse.ArgumentParser(description='LLMFit Backend Server')
    parser.add_argument('--port', type=int, default=8000, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to bind to')
    args = parser.parse_args()
    
    base_path = get_base_path()
    
    # Create a new app and register routes in the correct order
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=settings.APP_DESCRIPTION,
    )
    
    # Add CORS middleware
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # FIRST: Register API routes
    app.include_router(api_router)
    
    # Mount static files - try both bundled and external locations
    static_dir = os.path.join(base_path, 'dist')
    if not os.path.exists(static_dir):
        static_dir = os.path.join(os.path.dirname(__file__), 'dist')
    
    if os.path.exists(static_dir):
        # FIRST: Serve root path with index.html
        @app.get("/")
        async def serve_root():
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return {"detail": "Not Found"}
        
        # Serve static assets
        @app.get("/assets/{path:path}")
        async def serve_assets(path: str):
            file_path = os.path.join(static_dir, "assets", path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return FileResponse(file_path)
            return {"detail": "Not Found"}
        
        # LAST: Catch-all for SPA - serve index.html for all other paths
        @app.get("/{path:path}")
        async def serve_spa(path: str):
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return {"detail": "Not Found"}
    
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")

if __name__ == "__main__":
    main()
