ALTER TABLE vehicle
ADD user_id UUID,
ADD CONSTRAINT fk_vehicle_user
FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
