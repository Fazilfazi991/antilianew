-- Separate transaction and property category without deleting existing records.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS transaction_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS taxonomy_needs_review boolean NOT NULL DEFAULT false;

-- Legacy buy/rent values can be mapped exactly. Legacy commercial records did not
-- contain a transaction value, so they retain a visible record and are flagged
-- for an administrator to confirm instead of being silently discarded.
UPDATE properties
SET transaction_type = CASE
  WHEN category = 'rent' THEN 'rent'
  WHEN category = 'buy' THEN 'buy'
  ELSE 'buy'
END,
taxonomy_needs_review = (category = 'commercial')
WHERE transaction_type IS NULL;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_category_check;
UPDATE properties
SET category = CASE
  WHEN category IN ('rent', 'buy') THEN 'residential'
  WHEN category = 'commercial' THEN 'commercial'
  ELSE category
END;

ALTER TABLE properties ALTER COLUMN transaction_type SET NOT NULL;
ALTER TABLE properties ADD CONSTRAINT properties_transaction_type_check CHECK (transaction_type IN ('buy', 'rent'));
ALTER TABLE properties ADD CONSTRAINT properties_category_check CHECK (category IN ('residential', 'commercial', 'industrial'));
CREATE INDEX IF NOT EXISTS properties_transaction_category_idx ON properties (transaction_type, category);
