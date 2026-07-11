import logging
import os
import re
import json
import sqlite3
from app.core.config import settings

logger = logging.getLogger(__name__)

SQLITE_DB_PATH = "homeready_dev.db"

def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'homeowner',
            oauth_provider TEXT,
            oauth_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS properties (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            address TEXT NOT NULL,
            mls_id TEXT,
            property_type TEXT,
            year_built INTEGER,
            square_feet INTEGER,
            bedrooms REAL,
            bathrooms REAL,
            lot_size_sqft INTEGER,
            estimated_value REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            property_id TEXT,
            user_id TEXT,
            status TEXT DEFAULT 'processing',
            cv_summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS recommendations (
            id TEXT PRIMARY KEY,
            analysis_id TEXT,
            upgrade_name TEXT,
            category TEXT,
            estimated_cost REAL,
            estimated_roi_percentage REAL,
            value_add_dollars REAL,
            description TEXT,
            priority_rank INTEGER,
            implementation_complexity TEXT,
            timeframe_days INTEGER,
            prerequisites TEXT,
            confidence_score REAL,
            before_image_url TEXT,
            after_image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS contractors (
            id TEXT PRIMARY KEY,
            company_name TEXT,
            contact_name TEXT,
            phone TEXT,
            email TEXT,
            license_number TEXT,
            rating REAL,
            review_count INTEGER,
            service_areas TEXT,
            specialties TEXT,
            verified INTEGER DEFAULT 1,
            thumbtack_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            analysis_id TEXT UNIQUE,
            pdf_url TEXT,
            report_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS lead_requests (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            recommendation_id TEXT,
            contractor_id TEXT,
            status TEXT,
            attribution_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
    return conn

class SQLiteCursorWrapper:
    def __init__(self, cur):
        self.cur = cur

    def execute(self, query: str, params=()):
        # Transform Postgres specific SQL into standard SQLite
        q = query
        q = re.sub(r'::[a-zA-Z0-9_]+', '', q) # remove type casts like ::uuid, ::jsonb
        q = q.replace('%s', '?')
        q = re.sub(r'CURRENT_TIMESTAMP\(\)', 'CURRENT_TIMESTAMP', q, flags=re.I)
        
        # Transform params if any parameter is a wrapper (e.g. psycopg2.extras.Json)
        new_params = []
        for p in (params or ()):
            if hasattr(p, 'adapted'): # psycopg2.extras.Json
                new_params.append(json.dumps(p.adapted))
            elif isinstance(p, (dict, list)):
                new_params.append(json.dumps(p))
            else:
                new_params.append(p)
                
        self.cur.execute(q, tuple(new_params))
        return self

    def fetchone(self):
        return self.cur.fetchone()

    def fetchall(self):
        return self.cur.fetchall()

    def fetchmany(self, size=None):
        return self.cur.fetchmany(size)

    @property
    def rowcount(self):
        return self.cur.rowcount

    @property
    def description(self):
        return self.cur.description

    def close(self):
        self.cur.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False

    def __iter__(self):
        return iter(self.cur)

class SQLiteConnWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return SQLiteCursorWrapper(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()

    def __enter__(self):
        self.conn.__enter__()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self.conn.__exit__(exc_type, exc_val, exc_tb)

def get_db():
    """
    Returns a database connection (Postgres if running, otherwise transparent SQLite wrapper).
    Drop-in replacement for psycopg2.connect(settings.DATABASE_URL).
    """
    if settings.DATABASE_URL.startswith("sqlite"):
        conn = init_sqlite_db()
        return SQLiteConnWrapper(conn)

    try:
        import psycopg2
        return psycopg2.connect(settings.DATABASE_URL)
    except Exception as e:
        logger.info(f"PostgreSQL connection unavailable ({e}). Falling back to local SQLite ({SQLITE_DB_PATH}).")
        conn = init_sqlite_db()
        return SQLiteConnWrapper(conn)
