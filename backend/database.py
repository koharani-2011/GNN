import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./fraud_analytics.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="investigator") # admin or investigator
    badge_number = Column(String(50))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DatasetModel(Base):
    __tablename__ = "datasets"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    filename = Column(String(150), nullable=False)
    total_records = Column(Integer, default=0)
    features_count = Column(Integer, default=0)
    has_labels = Column(Boolean, default=False)
    uploaded_by = Column(String(100))
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

class AnalysisModel(Base):
    __tablename__ = "analyses"
    id = Column(String(50), primary_key=True, index=True)
    dataset_id = Column(String(50), ForeignKey("datasets.id"))
    dataset_name = Column(String(150))
    model_name = Column(String(100), default="GAT (Graph Attention Network)")
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    total_transactions = Column(Integer, default=0)
    predicted_licit = Column(Integer, default=0)
    predicted_illicit = Column(Integer, default=0)
    suspicious_ratio = Column(Float, default=0.0)
    avg_confidence = Column(Float, default=0.0)

class TransactionResultModel(Base):
    __tablename__ = "transaction_results"
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String(50), ForeignKey("analyses.id"), index=True)
    tx_id = Column(String(100), index=True, nullable=False)
    time_step = Column(Integer, default=1)
    predicted_class = Column(String(50), nullable=False) # Licit or Suspicious (Illicit)
    actual_class = Column(String(50), default="Unknown")
    risk_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    in_degree = Column(Integer, default=0)
    out_degree = Column(Integer, default=0)
    explanation = Column(Text)

class InvestigationCaseModel(Base):
    __tablename__ = "investigation_cases"
    id = Column(String(50), primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(30), default="Open") # Open, Under Review, Closed
    priority = Column(String(20), default="High") # Low, Medium, High, Critical
    assigned_to = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class CaseNoteModel(Base):
    __tablename__ = "case_notes"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("investigation_cases.id"))
    author = Column(String(100), nullable=False)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)
    resource = Column(String(50), nullable=False)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
