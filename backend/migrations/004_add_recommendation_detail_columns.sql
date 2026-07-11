-- Persist the detail fields the API already serves (why_details, scope) so
-- recommendations can be read back from the DB instead of regenerated.
ALTER TABLE recommendations ADD COLUMN why_details TEXT NOT NULL DEFAULT '';
ALTER TABLE recommendations ADD COLUMN scope JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE recommendations ADD COLUMN upgrade_catalog_id UUID REFERENCES upgrade_catalog(id);
