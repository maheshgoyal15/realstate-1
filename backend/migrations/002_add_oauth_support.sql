-- Add support for OAuth (Google) sign-in alongside existing password auth.
-- password_hash becomes nullable since OAuth-only users never set one.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255);

ALTER TABLE users ADD CONSTRAINT chk_users_auth_method
    CHECK (password_hash IS NOT NULL OR oauth_provider IS NOT NULL);

-- One row per (provider, external id); NULLs (password-only users) are unconstrained.
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id)
    WHERE oauth_provider IS NOT NULL;
