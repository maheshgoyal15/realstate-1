-- The analyze status endpoint previously reported only processing/completed/
-- failed, so the client had nothing to show for the minute-plus the pipeline
-- runs. The pipeline already computed a progress figure at each phase boundary
-- and threw it away; these columns give it somewhere to land.
--
-- `stage` is the machine-readable identifier of the phase currently executing
-- (see PIPELINE_STAGES in services/multi_agent_pipeline.py) so the client owns
-- the wording. `error` carries the failure reason, which was previously only
-- reachable in server logs.
-- `stage_detail` carries a short factual note for phases long enough that the
-- stage name alone leaves the user staring at a still screen — chiefly the
-- render phase, which reports how many rooms it has finished.
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS progress SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS stage VARCHAR(50);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS stage_detail VARCHAR(120);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS error TEXT;
