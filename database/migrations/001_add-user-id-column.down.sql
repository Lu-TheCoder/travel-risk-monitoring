-- 1. Drop the foreign key constraint first (required before dropping the column)
ALTER TABLE vehicle
DROP CONSTRAINT fk_vehicle_user;

-- 2. Drop the user_id column
ALTER TABLE vehicle
DROP COLUMN user_id;