-- Reference catalog of candidate upgrades, matched against an analysis's
-- detected defects to produce real, persisted recommendations. This is
-- seed/fallback data (no live MLS/contractor pricing feed exists yet) - the
-- seam for swapping in a live API later is the generate_recommendations()
-- function boundary in recommendation_service.py, not this table.
--
-- trigger_defect values are aligned with cv_service.py's offline fallback
-- vocabulary (outdated_kitchen_cabinets, worn_hardwood_floors,
-- old_shingle_roof, laminate_countertops, brass_fixtures,
-- overgrown_landscaping) so dev/offline matching is meaningful; a real
-- Gemini-tier CV pass can produce richer free-form defect strings that fall
-- back to the fill-to-minimum selection rule instead.
CREATE TABLE upgrade_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(255) NOT NULL,
    trigger_defect VARCHAR(255) NOT NULL,
    estimated_cost NUMERIC(12,2) NOT NULL,
    projected_value_increase NUMERIC(12,2) NOT NULL,
    timeline VARCHAR(100) NOT NULL,
    explanation_template TEXT NOT NULL,
    why_details_template TEXT NOT NULL,
    scope JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_upgrade_catalog_trigger_defect ON upgrade_catalog(trigger_defect);

GRANT SELECT ON upgrade_catalog TO homeready_app;
GRANT SELECT ON upgrade_catalog TO homeready_readonly;

INSERT INTO upgrade_catalog
    (category, trigger_defect, estimated_cost, projected_value_increase, timeline, explanation_template, why_details_template, scope)
VALUES
(
    'Kitchen Remodel', 'outdated_kitchen_cabinets', 18500.00, 27000.00, '3-4 weeks',
    'A {style} kitchen refresh is one of the highest-ROI upgrades for resale, addressing the outdated cabinetry detected in your scan.',
    'Buyers consistently rank kitchens as the top factor in offer decisions. Refacing or replacing cabinets in a {style} style modernizes the room without a full gut renovation.',
    '[{"item": "Cabinet refacing or replacement", "checked": false}, {"item": "Updated hardware", "checked": false}, {"item": "Countertop resurfacing", "checked": false}]'::jsonb
),
(
    'Roof Repair', 'old_shingle_roof', 9800.00, 12500.00, '1-2 weeks',
    'Addressing the aging shingle roof detected in your scan before listing prevents it from becoming an inspection-negotiation issue.',
    'A roof flagged in a pre-listing inspection routinely costs sellers more in buyer-requested credits than the repair itself.',
    '[{"item": "Shingle replacement in affected areas", "checked": false}, {"item": "Gutter inspection", "checked": false}]'::jsonb
),
(
    'Flooring Replacement', 'worn_hardwood_floors', 6400.00, 8900.00, '1 week',
    'The worn hardwood flooring detected in your scan is one of the first things buyers notice on a walkthrough; refinishing or replacing it in a {style} finish improves first impressions.',
    'Flooring condition is a common source of low-ball offers and is inexpensive to correct relative to its impact on buyer perception.',
    '[{"item": "Sand and refinish, or replace flooring", "checked": false}, {"item": "Matching trim touch-up", "checked": false}]'::jsonb
),
(
    'Countertop Upgrade', 'laminate_countertops', 5400.00, 8200.00, '3-5 days',
    'Replacing the laminate countertops identified in your scan with quartz or granite is a quick, high-visibility upgrade that fits a {style} kitchen.',
    'Laminate counters read as dated to buyers even when the rest of the kitchen is in good shape; a countertop swap alone measurably shifts buyer perception.',
    '[{"item": "Remove existing laminate", "checked": false}, {"item": "Template and install quartz/granite", "checked": false}]'::jsonb
),
(
    'Fixture Modernization', 'brass_fixtures', 2600.00, 3900.00, '2-3 days',
    'Swapping the dated brass fixtures detected in your scan for brushed nickel or matte black is a low-cost, high-visibility update.',
    'Fixture finish is one of the cheapest ways to make a kitchen or bathroom read as updated, and stands out clearly in listing photos.',
    '[{"item": "Replace faucets and cabinet hardware", "checked": false}, {"item": "Replace light fixtures", "checked": false}]'::jsonb
),
(
    'Landscaping Refresh', 'overgrown_landscaping', 3400.00, 5100.00, '3-5 days',
    'A landscaping cleanup directly addresses the overgrown landscaping detected in your scan at a low relative cost.',
    'Landscaping is typically the very first thing a buyer sees, in person and in listing photos.',
    '[{"item": "Trim and clear overgrowth", "checked": false}, {"item": "Fresh mulch and seasonal plantings", "checked": false}]'::jsonb
),
(
    'Bathroom Refresh', 'outdated_bathroom_fixtures', 7200.00, 10400.00, '2 weeks',
    'A {style} bathroom refresh corrects outdated fixtures at a modest cost relative to its value lift.',
    'Fixture and vanity updates are among the lowest-cost, highest-visibility upgrades a seller can make before listing.',
    '[{"item": "Vanity and fixture replacement", "checked": false}, {"item": "Re-grout or replace tile", "checked": false}]'::jsonb
),
(
    'Exterior Paint', 'exterior_paint_wear', 5200.00, 7600.00, '1 week',
    'Fresh exterior paint improves curb appeal and is one of the highest ROI-per-dollar upgrades available.',
    'Curb appeal drives online listing click-through rates before a buyer ever schedules a showing.',
    '[{"item": "Pressure wash and prep", "checked": false}, {"item": "Two-coat exterior paint", "checked": false}]'::jsonb
),
(
    'HVAC Servicing', 'hvac_inefficiency', 4100.00, 5200.00, '2-3 days',
    'Servicing or replacing key HVAC components avoids a costly inspection finding.',
    'HVAC age and condition are near-universal inspection checklist items and a common cause of post-inspection price renegotiation.',
    '[{"item": "System inspection and tune-up", "checked": false}, {"item": "Filter and coil service", "checked": false}]'::jsonb
);
