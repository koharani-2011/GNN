from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os

from services import FraudDetectionService
from database import init_db

app = FastAPI(
    title="Graph Fraud Analysis API",
    description="Backend REST API for cryptocurrency transaction analysis using Graph Neural Networks (GNN)",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = FraudDetectionService()

@app.on_event("startup")
def on_startup():
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database initialization skipped: {e}")

@app.get("/")
def read_root():
    return {
        "service": "Graph Fraud Analysis API",
        "status": "online",
        "version": "2.1.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Graph Fraud Analytics",
        "models": ["GAT (Graph Attention Network)", "EvolveGCN", "GraphSAGE", "GCN Baseline"]
    }

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    ext = file.filename.split('.')[-1].lower()
    if ext not in ['csv', 'xlsx', 'xls', 'txt']:
        raise HTTPException(status_code=400, detail="Only CSV or Excel files are supported")
        
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
    result = service.analyze_file(file.filename, contents)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result
