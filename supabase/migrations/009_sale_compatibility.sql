-- Compatibility-only mapping for installations that still contain the older "sale" value.
-- This is intentionally non-destructive and preserves every record.
UPDATE properties
SET transaction_type = 'buy'
WHERE transaction_type = 'sale';

UPDATE properties
SET transaction_type = 'buy', category = 'residential', taxonomy_needs_review = false
WHERE category = 'sale';
