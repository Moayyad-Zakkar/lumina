-- Add refinement support to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS parent_case_id BIGINT REFERENCES cases(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS refinement_number INTEGER DEFAULT 0;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS refinement_reason TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cases_parent_case_id ON cases(parent_case_id);
