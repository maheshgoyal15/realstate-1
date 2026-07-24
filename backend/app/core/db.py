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
            property_type TEXT DEFAULT 'RES',
            year_built INTEGER,
            square_feet INTEGER,
            bedrooms REAL,
            bathrooms REAL,
            lot_size_sqft INTEGER,
            budget_ceiling REAL DEFAULT 0.0,
            style_preference TEXT,
            raw_mls_data TEXT DEFAULT '{}',
            estimated_value REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            property_id TEXT,
            user_id TEXT,
            status TEXT DEFAULT 'processing',
            cv_summary TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS upgrade_catalog (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            trigger_defect TEXT NOT NULL,
            estimated_cost REAL NOT NULL,
            projected_value_increase REAL NOT NULL,
            timeline TEXT NOT NULL,
            explanation_template TEXT NOT NULL,
            why_details_template TEXT NOT NULL,
            scope TEXT NOT NULL DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS recommendations (
            id TEXT PRIMARY KEY,
            analysis_id TEXT,
            upgrade_name TEXT,
            upgrade_id TEXT,
            category TEXT,
            estimated_cost REAL,
            estimated_roi_percentage REAL,
            roi_percentage REAL,
            projected_value_increase REAL,
            value_add_dollars REAL,
            description TEXT,
            explanation TEXT,
            why_details TEXT,
            scope TEXT DEFAULT '[]',
            upgrade_catalog_id TEXT,
            priority_rank INTEGER,
            implementation_complexity TEXT,
            timeline TEXT,
            timeframe_days INTEGER,
            prerequisites TEXT,
            confidence_score REAL,
            before_image_url TEXT,
            after_image_url TEXT,
            status TEXT DEFAULT 'suggested',
            actual_spend REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS contractors (
            id TEXT PRIMARY KEY,
            company_name TEXT,
            contact_name TEXT,
            trade_category TEXT,
            phone TEXT,
            contact_phone TEXT,
            email TEXT,
            contact_email TEXT,
            license_number TEXT,
            license TEXT,
            location TEXT,
            rating REAL,
            review_count INTEGER,
            reviews_count INTEGER DEFAULT 0,
            service_areas TEXT,
            service_zip_codes TEXT,
            specialties TEXT DEFAULT '[]',
            avg_cost REAL,
            avg_timeline TEXT,
            availability TEXT,
            bio TEXT,
            snippet TEXT,
            pricing_info TEXT DEFAULT '[]',
            reviews TEXT DEFAULT '[]',
            verified INTEGER DEFAULT 1,
            is_verified INTEGER DEFAULT 1,
            thumbtack_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            analysis_id TEXT UNIQUE,
            pdf_url TEXT,
            s3_pdf_key TEXT,
            shareable_token TEXT UNIQUE,
            pdf_data BLOB,
            report_data TEXT,
            is_password_protected INTEGER DEFAULT 0,
            access_password_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS lead_requests (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            recommendation_id TEXT,
            contractor_id TEXT,
            status TEXT DEFAULT 'sent',
            attribution_token TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Safely add any columns missing from older existing SQLite tables
        missing_columns = [
            ("properties", "budget_ceiling", "REAL DEFAULT 0.0"),
            ("properties", "style_preference", "TEXT"),
            ("properties", "raw_mls_data", "TEXT DEFAULT '{}'"),
            ("analyses", "cv_summary", "TEXT DEFAULT '{}'"),
            ("recommendations", "upgrade_id", "TEXT"),
            ("recommendations", "roi_percentage", "REAL"),
            ("recommendations", "projected_value_increase", "REAL"),
            ("recommendations", "timeline", "TEXT"),
            ("recommendations", "explanation", "TEXT"),
            ("recommendations", "why_details", "TEXT"),
            ("recommendations", "scope", "TEXT DEFAULT '[]'"),
            ("recommendations", "upgrade_catalog_id", "TEXT"),
            ("contractors", "trade_category", "TEXT"),
            ("contractors", "license", "TEXT"),
            ("contractors", "location", "TEXT"),
            ("contractors", "avg_cost", "REAL"),
            ("contractors", "avg_timeline", "TEXT"),
            ("contractors", "availability", "TEXT"),
            ("contractors", "bio", "TEXT"),
            ("contractors", "snippet", "TEXT"),
            ("contractors", "specialties", "TEXT DEFAULT '[]'"),
            ("contractors", "pricing_info", "TEXT DEFAULT '[]'"),
            ("contractors", "reviews", "TEXT DEFAULT '[]'"),
            ("contractors", "reviews_count", "INTEGER DEFAULT 0"),
            ("contractors", "is_verified", "INTEGER DEFAULT 1"),
            ("reports", "s3_pdf_key", "TEXT"),
            ("reports", "shareable_token", "TEXT"),
            ("reports", "pdf_data", "BLOB"),
            ("reports", "is_password_protected", "INTEGER DEFAULT 0"),
            ("reports", "access_password_hash", "TEXT"),
        ]
        cur = conn.cursor()
        for table, col, col_type in missing_columns:
            try:
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};")
            except sqlite3.OperationalError:
                pass

        # Seed upgrade_catalog if missing entries
        catalog_seeds = [
            ('Kitchen Remodel', 'outdated_kitchen_cabinets', 18500.00, 27000.00, '3-4 weeks',
             'A {style} kitchen refresh is one of the highest-ROI upgrades for resale, addressing the outdated cabinetry detected in your scan.',
             'Buyers consistently rank kitchens as the top factor in offer decisions. Refacing or replacing cabinets in a {style} style modernizes the room without a full gut renovation.',
             '[{"item": "Cabinet refacing or replacement", "checked": false}, {"item": "Updated hardware", "checked": false}, {"item": "Countertop resurfacing", "checked": false}]'),
            ('Roof Repair', 'old_shingle_roof', 9800.00, 12500.00, '1-2 weeks',
             'Addressing the aging shingle roof detected in your scan before listing prevents it from becoming an inspection-negotiation issue.',
             'A roof flagged in a pre-listing inspection routinely costs sellers more in buyer-requested credits than the repair itself.',
             '[{"item": "Shingle replacement in affected areas", "checked": false}, {"item": "Gutter inspection", "checked": false}]'),
            ('Flooring Replacement', 'worn_hardwood_floors', 6400.00, 8900.00, '1 week',
             'The worn hardwood flooring detected in your scan is one of the first things buyers notice on a walkthrough; refinishing or replacing it in a {style} finish improves first impressions.',
             'Flooring condition is a common source of low-ball offers and is inexpensive to correct relative to its impact on buyer perception.',
             '[{"item": "Sand and refinish, or replace flooring", "checked": false}, {"item": "Matching trim touch-up", "checked": false}]'),
            ('Countertop Upgrade', 'laminate_countertops', 5400.00, 8200.00, '3-5 days',
             'Replacing the laminate countertops identified in your scan with quartz or granite is a quick, high-visibility upgrade that fits a {style} kitchen.',
             'Laminate counters read as dated to buyers even when the rest of the kitchen is in good shape; a countertop swap alone measurably shifts buyer perception.',
             '[{"item": "Remove existing laminate", "checked": false}, {"item": "Template and install quartz/granite", "checked": false}]'),
            ('Fixture Modernization', 'brass_fixtures', 2600.00, 3900.00, '2-3 days',
             'Swapping the dated brass fixtures detected in your scan for brushed nickel or matte black is a low-cost, high-visibility update.',
             'Fixture finish is one of the cheapest ways to make a kitchen or bathroom read as updated, and stands out clearly in listing photos.',
             '[{"item": "Replace faucets and cabinet hardware", "checked": false}, {"item": "Replace light fixtures", "checked": false}]'),
            ('Bedroom Modernization', 'outdated_bedroom_fixtures', 3200.00, 4800.00, '1 week',
             'A {style} bedroom suite refresh updates lighting, accent wall paint, and closet hardware to maximize buyer appeal.',
             'Bedrooms are primary emotional touchpoints for prospective buyers. A modern, well-lit bedroom suite creates a premium move-in ready impression.',
             '[{"item": "Accent wall painting & trim touch-up", "checked": false}, {"item": "Modern ceiling fan/lighting fixture", "checked": false}, {"item": "Closet hardware & door update", "checked": false}]'),
            ('Interior Paint Refresh', 'dated_wall_color', 2800.00, 4500.00, '3-4 days',
             'Fresh neutral paint across bedroom and living areas brightens spaces and hides minor drywall imperfections.',
             'Interior paint offers high ROI-per-dollar and eliminates buyer hesitation over dated paint choices.',
             '[{"item": "Drywall patch and prep", "checked": false}, {"item": "Two-coat neutral interior paint", "checked": false}]'),
            ('Landscaping Refresh', 'overgrown_landscaping', 3400.00, 5100.00, '3-5 days',
             'A landscaping cleanup directly addresses the overgrown landscaping detected in your scan at a low relative cost.',
             'Landscaping is typically the very first thing a buyer sees, in person and in listing photos.',
             '[{"item": "Trim and clear overgrowth", "checked": false}, {"item": "Fresh mulch and seasonal plantings", "checked": false}]'),
            ('Bathroom Refresh', 'outdated_bathroom_fixtures', 7200.00, 10400.00, '2 weeks',
             'A {style} bathroom refresh corrects outdated fixtures at a modest cost relative to its value lift.',
             'Fixture and vanity updates are among the lowest-cost, highest-visibility upgrades a seller can make before listing.',
             '[{"item": "Vanity and fixture replacement", "checked": false}, {"item": "Re-grout or replace tile", "checked": false}]'),
            ('Exterior Paint', 'exterior_paint_wear', 5200.00, 7600.00, '1 week',
             'Fresh exterior paint improves curb appeal and is one of the highest ROI-per-dollar upgrades available.',
             'Curb appeal drives online listing click-through rates before a buyer ever schedules a showing.',
             '[{"item": "Pressure wash and prep", "checked": false}, {"item": "Two-coat exterior paint", "checked": false}]'),
            ('HVAC Servicing', 'hvac_inefficiency', 4100.00, 5200.00, '2-3 days',
             'Servicing or replacing key HVAC components avoids a costly inspection finding.',
             'HVAC age and condition are near-universal inspection checklist items and a common cause of post-inspection price renegotiation.',
             '[{"item": "System inspection and tune-up", "checked": false}, {"item": "Filter and coil service", "checked": false}]'),
        ]
        for cat, def_key, cost, inc, time, exp, why, sc in catalog_seeds:
            cur.execute("SELECT id FROM upgrade_catalog WHERE trigger_defect = ? OR category = ?;", (def_key, cat))
            if not cur.fetchone():
                import uuid as _uuid
                cur.execute(
                    "INSERT INTO upgrade_catalog (id, category, trigger_defect, estimated_cost, projected_value_increase, timeline, explanation_template, why_details_template, scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
                    (_uuid.uuid4().hex, cat, def_key, cost, inc, time, exp, why, sc)
                )

        # Seed contractors if empty
        cur.execute("SELECT COUNT(*) FROM contractors;")
        if cur.fetchone()[0] == 0:
            contractor_seeds = [
                ('Home Remodeling Pro', 'Kitchen Remodel', 'TCLD-12345', 'Austin, TX', 34500.00, '4-5 Weeks', 'Starting next month',
                 'Serving the Austin metro area since 2012, specializing in structural modifications, custom cabinetry, and premium tiling.',
                 'Excellent communication, finished on time!', '["Kitchens", "Bathrooms", "Hardwoods"]',
                 '[{"project": "Kitchen Remodel", "cost": "$30k - $45k"}, {"project": "Bath Modernization", "cost": "$15k - $25k"}, {"project": "Hardwood Refinishing", "cost": "$4k - $8k"}]',
                 '[{"author": "Sarah M.", "rating": 5, "text": "They completely refaced our dated 90s kitchen. The quartz installation is stunning!"}, {"author": "Devin K.", "rating": 4, "text": "Solid work on the hardwood sanding. Highly recommend."}]', 142, 4.8, 1),
                ('Austin Kitchen & Bath Co.', 'Kitchen Remodel', 'TCLD-56789', 'Austin, TX', 35800.00, '6-7 Weeks', 'Immediate start',
                 'Focused on modern functional kitchen layouts and bathroom spa integrations.',
                 'Very professional crew and great cleanup.', '["Kitchens", "Bathrooms", "Countertops"]',
                 '[{"project": "Kitchen Remodel", "cost": "$32k - $48k"}, {"project": "Bath Modernization", "cost": "$12k - $22k"}]',
                 '[{"author": "Linda P.", "rating": 5, "text": "Excellent design choices, helped us get high value upgrades within our budget."}]', 89, 4.6, 1),
                ('Elite Roofing Austin', 'Roof Repair', 'ROOF-9912', 'Austin, TX', 8200.00, '1-2 Weeks', 'Next week',
                 'Rapid-response roof replacements, composite shingle repairs, and gutter guard installations.',
                 'Fast service, handled the insurance details perfectly.', '["Roofing", "Gutters", "Siding"]',
                 '[{"project": "Roof Replacement", "cost": "$8k - $14k"}, {"project": "Flashing & Patching", "cost": "$1k - $3k"}]',
                 '[{"author": "James D.", "rating": 5, "text": "Fixed leak in less than 24 hours. Phenomenal response times."}]', 210, 4.9, 1),
                ('Lone Star Flooring Co.', 'Flooring Replacement', 'TCLD-33221', 'Austin, TX', 6800.00, '1 Week', 'Starting in 2 weeks',
                 'Hardwood, laminate, and tile flooring specialists serving Central Texas for over a decade.',
                 'Beautiful refinishing work, very tidy job site.', '["Flooring", "Hardwoods", "Tile"]',
                 '[{"project": "Hardwood Refinishing", "cost": "$4k - $9k"}, {"project": "Tile Installation", "cost": "$5k - $10k"}]',
                 '[{"author": "Maria G.", "rating": 5, "text": "Our floors look brand new. Great attention to detail."}]', 64, 4.7, 1),
            ]
            for c_name, cat, lic, loc, cost, time, avail, bio, snip, spec, price, rev, r_cnt, rat, ver in contractor_seeds:
                import uuid as _uuid
                cur.execute(
                    "INSERT INTO contractors (id, company_name, trade_category, license, location, avg_cost, avg_timeline, availability, bio, snippet, specialties, pricing_info, reviews, reviews_count, rating, is_verified, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                    (_uuid.uuid4().hex, c_name, cat, lic, loc, cost, time, avail, bio, snip, spec, price, rev, r_cnt, rat, ver, ver)
                )
        conn.commit()
    return conn

class DictTupleRow(dict):
    """Supports both dictionary key access (row['col']) and tuple index access (row[0])."""
    def __init__(self, keys, values):
        super().__init__(zip(keys, values))
        self._values = tuple(values)
    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return super().__getitem__(key)
    def __iter__(self):
        return iter(self._values)
    def __len__(self):
        return len(self._values)

class SQLiteCursorWrapper:
    def __init__(self, cur, *args, **kwargs):
        self.cur = cur
        self.cursor_factory = kwargs.get('cursor_factory')

    def execute(self, query: str, params=()):
        # Transform Postgres specific SQL into standard SQLite
        q = query
        q = re.sub(r'::[a-zA-Z0-9_]+', '', q) # remove type casts like ::uuid, ::jsonb
        q = q.replace('%s', '?')
        q = re.sub(r'CURRENT_TIMESTAMP\(\)', 'CURRENT_TIMESTAMP', q, flags=re.I)
        
        # Transform params if any parameter is a wrapper (e.g. psycopg2.extras.Json or psycopg2.Binary)
        new_params = []
        for p in (params or ()):
            if hasattr(p, 'adapted'):
                adapted_val = p.adapted
                if isinstance(adapted_val, (bytes, bytearray, memoryview)):
                    new_params.append(sqlite3.Binary(adapted_val))
                else:
                    new_params.append(json.dumps(adapted_val))
            elif isinstance(p, (dict, list)):
                new_params.append(json.dumps(p))
            else:
                new_params.append(p)
                
        self.cur.execute(q, tuple(new_params))
        return self

    def _wrap_row(self, row):
        if row is None:
            return None
        if self.cur.description:
            keys = [col[0] for col in self.cur.description]
            return DictTupleRow(keys, row)
        return row

    def fetchone(self):
        return self._wrap_row(self.cur.fetchone())

    def fetchall(self):
        rows = self.cur.fetchall()
        return [self._wrap_row(r) for r in rows] if rows else []

    def fetchmany(self, size=None):
        rows = self.cur.fetchmany(size)
        return [self._wrap_row(r) for r in rows] if rows else []

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
        for row in self.cur:
            yield self._wrap_row(row)

class SQLiteConnWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self, *args, **kwargs):
        return SQLiteCursorWrapper(self.conn.cursor(), *args, **kwargs)

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
