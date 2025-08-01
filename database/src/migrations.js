const { Client } = require('pg');
const fs = require('fs-extra');
const path = require('path');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'travel-risk-postgres'
});

async function ensureMigrationTable() {
    await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function getAppliedMigrations() {
    const result = await client.query(`
        SELECT filename FROM migrations
    `);
    return result.rows.map(row => row.filename);
}

async function applyMigrations() {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    const appliedMigrations = await getAppliedMigrations();

    for(const file of files) {
        // only process .sql files
        if(file.endsWith('.sql')) {
            const migrationName = file.replace('.sql', '');
            // skip migration file if it's already applied.
            if(appliedMigrations.includes(migrationName)) {
                console.log(`Skipping ${migrationName} - already applied`);
                continue;
            }
            // otherwise, read the migration file and apply it.
            try {
                const migration = await fs.readFile(path.join(migrationsDir, file), 'utf8');
                console.log(`Applying ${migrationName}`);
                await client.query(migration);
                await client.query(`INSERT INTO migrations (filename) VALUES ($1)`, [migrationName]);
                console.log(`Applied ${migrationName}`);
            } catch(error) {
                console.error(`Error applying ${migrationName}:`, error);
            }
        } else {
            console.log(`Skipping ${file} - not a SQL file`);
        }
        console.log('--------------------------------');
    }
    console.log('All migrations applied successfully');
}

async function migrateUp() {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    const appliedMigrations = await getAppliedMigrations();

    for(const file of files) {
        if(file.endsWith('.up.sql')) {
            const migrationName = file.replace('.up.sql', '');
            if(appliedMigrations.includes(migrationName)) {
                console.log(`Skipping ${migrationName} - already applied`);
                continue;
            }
            try {
                const migration = await fs.readFile(path.join(migrationsDir, file), 'utf8');
                console.log(`Applying ${migrationName}`);
                await client.query(migration);
                await client.query(`INSERT INTO migrations (filename) VALUES ($1)`, [migrationName]);
                console.log(`Applied ${migrationName}`);
            } catch(error) {
                console.error(`Error applying ${migrationName}:`, error);
            }
        } else {
            console.log(`Skipping ${file} - not an up migration`);
        }
        console.log('--------------------------------');
    }
    console.log('All up migrations applied successfully');
}

async function migrateDown() {
    const migrationsDir = path.join(__dirname, '../migrations');
    const appliedMigrations = await getAppliedMigrations();
    // if no migrations have been applied,have an early exit.
    if(appliedMigrations.length === 0) {
        console.log('No migrations to roll back.');
        return;
    }
    // otherwise, we'll roll back each migration in reverse order.
    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    const downMigrationFile = path.join(migrationsDir, `${lastMigration}.down.sql`);
    if(!fs.existsSync(downMigrationFile)) {
        console.error(`No down migration found for ${lastMigration}`);
        return;
    }
    try {
        console.log(`Rolling back ${lastMigration}`);
        const migration = await fs.readFile(downMigrationFile, 'utf8');
        await client.query(migration);
        await client.query(`DELETE FROM migrations WHERE filename = $1`, [lastMigration]);
        console.log(`Rolled back ${lastMigration}`);
    } catch(error) {
        console.error(`Error rolling back ${lastMigration}:`, error);
    }
    console.log('--------------------------------');
    console.log('All down migrations reverted successfully');
}

function getNextMigrationNumber() {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    // if there are no migrations, return 001. (this will be the first migration.)
    if(files.length === 0) {
        return '001';
    }
    const lastMigration = files[files.length - 1];
    const match = lastMigration.match(/^(\d+)_/);
    // if the last migration doesn't match the pattern, return 001.
    // (this is a safety guard to ensure we only deal with migration files that match our pattern, and ignore the rest.)
    if(!match) {
        return '001';
    }
    const next = parseInt(match[1], 10) + 1;
    return String(next).padStart(3, '0');
}

function generateMigration(name) {
    // create the migrations directory if it doesn't exist.
    if(!fs.existsSync(path.join(__dirname, '../migrations'))) {
        fs.mkdirSync(path.join(__dirname, '../migrations'));
    }
    const number = getNextMigrationNumber();
    // create the migration files with the correct naming convention that we support.
    const base = `${number}_${name}`;
    const upName = `${base}.up.sql`;
    const downName = `${base}.down.sql`;
    const upPath = path.join(__dirname, '../migrations', upName);
    const downPath = path.join(__dirname, '../migrations', downName);
    // create the up and down migration files.  
    fs.writeFileSync(upPath, `-- Up migration for ${name}\n-- Example:\n-- CREATE TABLE your_table (...);\n`);
    fs.writeFileSync(downPath, `-- Down migration for ${name}\n-- Example:\n-- DROP TABLE your_table;\n`);

    console.log(`Generated ${upName} and ${downName} migration files.`);
}

async function main() {
    const cmd = process.argv[2];
    const arg = process.argv[3];

    if(cmd === 'generate') {
        if(!arg) {
            console.error('Usage: node migrate.js generate <migration-name>');
            process.exit(1);
        }
        generateMigration(arg);
        return;
    }

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully!');
        await ensureMigrationTable();
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        console.error('Please ensure your database is running and credentials are correct.');
        process.exit(1);
    }

    if(cmd === 'up') {
        await migrateUp();
    } else if(cmd === 'down') {
        await migrateDown();
    } else {
        console.error('Usage: node migrate.js <up|down> \n       node migrate.js generate <migration-name>');
    }

    await client.end();
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});