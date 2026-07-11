-- The contractors directory UI lets a user request a quote generally,
-- without necessarily citing a specific upgrade recommendation. Making this
-- nullable is a pragmatic stopgap to fit that flow, not a final schema - if
-- "quote about a specific recommendation" and "general contact" turn out to
-- need materially different handling, this should be revisited (e.g. by
-- carrying property_id instead of/alongside recommendation_id).
ALTER TABLE lead_requests ALTER COLUMN recommendation_id DROP NOT NULL;
