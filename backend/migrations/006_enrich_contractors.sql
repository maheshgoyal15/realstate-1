-- Extend contractors with the directory-profile fields the frontend needs
-- (previously only present in a hardcoded mock). specialties/pricing_info/
-- reviews are JSONB since this is static seed/reference data with no
-- user-generated writes in this pass - the moment reviews become
-- user-submitted, this needs to become a real contractor_reviews table with
-- ownership and moderation. No "distance" column - real distance needs
-- geocoding + the viewer's location, out of scope; the UI shows service
-- area/location instead of a fabricated mileage number.
ALTER TABLE contractors ADD COLUMN license VARCHAR(100);
ALTER TABLE contractors ADD COLUMN location VARCHAR(255);
ALTER TABLE contractors ADD COLUMN avg_cost NUMERIC(12,2);
ALTER TABLE contractors ADD COLUMN avg_timeline VARCHAR(100);
ALTER TABLE contractors ADD COLUMN availability VARCHAR(100);
ALTER TABLE contractors ADD COLUMN bio TEXT;
ALTER TABLE contractors ADD COLUMN snippet VARCHAR(500);
ALTER TABLE contractors ADD COLUMN specialties JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE contractors ADD COLUMN pricing_info JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE contractors ADD COLUMN reviews JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE contractors ADD COLUMN reviews_count INTEGER NOT NULL DEFAULT 0;

INSERT INTO contractors
    (company_name, trade_category, service_zip_codes, contact_email, contact_phone, rating,
     license, location, avg_cost, avg_timeline, availability, bio, snippet, specialties, pricing_info, reviews, reviews_count)
VALUES
(
    'Home Remodeling Pro', 'Kitchen Remodel', ARRAY['78701', '78702', '78703'],
    'contact@homeremodelingpro.example', '512-555-0101', 4.8,
    'TCLD-12345', 'Austin, TX', 34500.00, '4-5 Weeks', 'Starting next month',
    'Serving the Austin metro area since 2012, specializing in structural modifications, custom cabinetry, and premium tiling.',
    'Excellent communication, finished on time!',
    '["Kitchens", "Bathrooms", "Hardwoods"]'::jsonb,
    '[{"project": "Kitchen Remodel", "cost": "$30k - $45k"}, {"project": "Bath Modernization", "cost": "$15k - $25k"}, {"project": "Hardwood Refinishing", "cost": "$4k - $8k"}]'::jsonb,
    '[{"author": "Sarah M.", "rating": 5, "text": "They completely refaced our dated 90s kitchen. The quartz installation is stunning!"}, {"author": "Devin K.", "rating": 4, "text": "Solid work on the hardwood sanding. Highly recommend."}]'::jsonb,
    142
),
(
    'Austin Kitchen & Bath Co.', 'Kitchen Remodel', ARRAY['78701', '78704'],
    'hello@austinkitchenbath.example', '512-555-0102', 4.6,
    'TCLD-56789', 'Austin, TX', 35800.00, '6-7 Weeks', 'Immediate start',
    'Focused on modern functional kitchen layouts and bathroom spa integrations.',
    'Very professional crew and great cleanup.',
    '["Kitchens", "Bathrooms", "Countertops"]'::jsonb,
    '[{"project": "Kitchen Remodel", "cost": "$32k - $48k"}, {"project": "Bath Modernization", "cost": "$12k - $22k"}]'::jsonb,
    '[{"author": "Linda P.", "rating": 5, "text": "Excellent design choices, helped us get high value upgrades within our budget."}]'::jsonb,
    89
),
(
    'Elite Roofing Austin', 'Roof Repair', ARRAY['78701', '78745', '78748'],
    'service@eliteroofingatx.example', '512-555-0103', 4.9,
    'ROOF-9912', 'Austin, TX', 8200.00, '1-2 Weeks', 'Next week',
    'Rapid-response roof replacements, composite shingle repairs, and gutter guard installations.',
    'Fast service, handled the insurance details perfectly.',
    '["Roofing", "Gutters", "Siding"]'::jsonb,
    '[{"project": "Roof Replacement", "cost": "$8k - $14k"}, {"project": "Flashing & Patching", "cost": "$1k - $3k"}]'::jsonb,
    '[{"author": "James D.", "rating": 5, "text": "Fixed leak in less than 24 hours. Phenomenal response times."}]'::jsonb,
    210
),
(
    'Lone Star Flooring Co.', 'Flooring Replacement', ARRAY['78701', '78702', '78723'],
    'info@lonestarflooring.example', '512-555-0104', 4.7,
    'TCLD-33221', 'Austin, TX', 6800.00, '1 Week', 'Starting in 2 weeks',
    'Hardwood, laminate, and tile flooring specialists serving Central Texas for over a decade.',
    'Beautiful refinishing work, very tidy job site.',
    '["Flooring", "Hardwoods", "Tile"]'::jsonb,
    '[{"project": "Hardwood Refinishing", "cost": "$4k - $9k"}, {"project": "Tile Installation", "cost": "$5k - $10k"}]'::jsonb,
    '[{"author": "Maria G.", "rating": 5, "text": "Our floors look brand new. Great attention to detail."}]'::jsonb,
    64
),
(
    'Precision HVAC Services', 'HVAC Servicing', ARRAY['78701', '78704', '78745'],
    'support@precisionhvac.example', '512-555-0105', 4.5,
    'HVAC-77410', 'Austin, TX', 4300.00, '2-3 Days', 'Same week availability',
    'Full-service HVAC installation, repair, and efficiency tune-ups for residential properties.',
    'Quick diagnosis and fair pricing.',
    '["HVAC", "Insulation"]'::jsonb,
    '[{"project": "System Tune-Up", "cost": "$300 - $800"}, {"project": "Full System Replacement", "cost": "$5k - $9k"}]'::jsonb,
    '[{"author": "Tom R.", "rating": 4, "text": "Explained everything clearly and got our AC running again same day."}]'::jsonb,
    57
),
(
    'Green Scape Landscaping', 'Landscaping Refresh', ARRAY['78701', '78702', '78703', '78704'],
    'hello@greenscapeatx.example', '512-555-0106', 4.6,
    'LSCP-44120', 'Austin, TX', 3600.00, '3-5 Days', 'Immediate start',
    'Curb-appeal focused landscaping crews specializing in pre-listing cleanups and seasonal refreshes.',
    'Transformed our front yard in a single weekend.',
    '["Landscaping", "Irrigation"]'::jsonb,
    '[{"project": "Curb Appeal Cleanup", "cost": "$2k - $5k"}, {"project": "Full Yard Redesign", "cost": "$8k - $15k"}]'::jsonb,
    '[{"author": "Priya S.", "rating": 5, "text": "Our listing photos looked amazing after their cleanup."}]'::jsonb,
    38
),
(
    'Capital City Painters', 'Exterior Paint', ARRAY['78701', '78702', '78723', '78745'],
    'contact@capitalcitypainters.example', '512-555-0107', 4.7,
    'PNT-19233', 'Austin, TX', 5400.00, '1 Week', 'Starting next month',
    'Exterior and interior painting crews with a focus on fast turnaround before listing.',
    'Clean lines, showed up on time every day.',
    '["Exterior Paint", "Interior Paint"]'::jsonb,
    '[{"project": "Exterior Repaint", "cost": "$4k - $8k"}, {"project": "Interior Repaint", "cost": "$2k - $6k"}]'::jsonb,
    '[{"author": "Wei C.", "rating": 5, "text": "House looks brand new from the street."}]'::jsonb,
    73
),
(
    'ClearView Windows & Doors', 'Window Replacement', ARRAY['78701', '78704', '78748'],
    'sales@clearviewwindows.example', '512-555-0108', 4.4,
    'GLZ-30871', 'Austin, TX', 11800.00, '2-3 Weeks', 'Starting in 3 weeks',
    'Energy-efficient window and door replacement specialists serving the greater Austin area.',
    'Noticeably quieter house and lower energy bills already.',
    '["Windows", "Doors"]'::jsonb,
    '[{"project": "Full-Home Window Replacement", "cost": "$10k - $18k"}, {"project": "Patio Door Replacement", "cost": "$2k - $5k"}]'::jsonb,
    '[{"author": "Brian F.", "rating": 4, "text": "Good install crew, took a bit longer than quoted but quality is great."}]'::jsonb,
    41
),
(
    'Modern Bath Studio', 'Bathroom Refresh', ARRAY['78701', '78702', '78704'],
    'hello@modernbathstudio.example', '512-555-0109', 4.8,
    'TCLD-90321', 'Austin, TX', 7500.00, '2 Weeks', 'Immediate start',
    'Boutique bathroom remodeling studio focused on fast, high-impact vanity and fixture upgrades.',
    'Fast, clean, and the new vanity looks fantastic.',
    '["Bathrooms", "Fixtures"]'::jsonb,
    '[{"project": "Vanity & Fixture Upgrade", "cost": "$5k - $10k"}, {"project": "Full Bath Remodel", "cost": "$15k - $28k"}]'::jsonb,
    '[{"author": "Alicia N.", "rating": 5, "text": "Turned our dated bathroom into something out of a magazine."}]'::jsonb,
    52
);
