-- Add pricing columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_study_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS aligners_price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS delivery_charges DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial'));

-- Create payments table to track payment collections
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_case_allocations table to track how payments are split across cases
CREATE TABLE IF NOT EXISTS payment_case_allocations (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(payment_id, case_id)
);

-- Add comments for documentation
COMMENT ON COLUMN cases.case_study_fee IS 'Case study fee charged to the doctor';
COMMENT ON COLUMN cases.aligners_price IS 'Total price for aligners based on quantity and material';
COMMENT ON COLUMN cases.delivery_charges IS 'Delivery/shipping charges';
COMMENT ON COLUMN cases.total_cost IS 'Total cost (case_study_fee + aligners_price + delivery_charges)';
COMMENT ON COLUMN cases.payment_status IS 'Payment status: unpaid, paid, partial';

COMMENT ON TABLE payments IS 'Records of payments received from doctors';
COMMENT ON TABLE payment_case_allocations IS 'Tracks how payments are allocated across specific cases';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cases_payment_status ON cases(payment_status);
CREATE INDEX IF NOT EXISTS idx_cases_doctor_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON payment_case_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_case_id ON payment_case_allocations(case_id);
