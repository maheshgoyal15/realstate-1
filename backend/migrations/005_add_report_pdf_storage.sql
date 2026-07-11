-- Store generated report PDFs as bytes in Postgres rather than local disk.
-- backend/Dockerfile targets Cloud Run, whose local filesystem is ephemeral
-- and not shared across instances - a PDF written to disk on one instance
-- would be invisible to another and vanish on scale-to-zero. s3_pdf_key
-- stays populated (with a "db:" placeholder key) so a future real-S3 swap
-- only needs to change where bytes are read from, not the column's meaning.
ALTER TABLE reports ADD COLUMN pdf_data BYTEA;
