-- Create a table for users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS vehicle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS incident (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(120) NOT NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    weather_condition VARCHAR(120) NOT NULL,
    severity VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_risk_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_level VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS route (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coordinates JSONB NOT NULL
);

