const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables quietly (only if not already loaded)
if (!process.env.DB_HOST && !process.env.TEST_DB_HOST) {
    dotenv.config({ silent: true });
}

class DB {
    static instance = null;

    constructor() {
        if (DB.instance) {
            throw new Error('DB is a singleton. Use DB.getInstance() instead.');
        }

        // Database configurations
        const dbConfigs = {
            main: {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5433,
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'travel-risk-postgres',
                max: 10, // Max simultaneous connections in pool
                idleTimeoutMillis: 30000, // Close idle clients after 30s
                connectionTimeoutMillis: 2000, // Fail if connection takes > 2s
            },
            test: {
                host: process.env.TEST_DB_HOST || 'localhost',
                port: process.env.TEST_DB_PORT || 5434,
                database: process.env.TEST_DB_NAME || 'travel-risk-postgres',
                user: process.env.TEST_DB_USER || 'postgres',
                password: process.env.TEST_DB_PASSWORD || 'postgres',
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            }
        };

        // Determine which configuration to use based on environment
        const config = process.env.NODE_ENV === 'test' ? dbConfigs.test : dbConfigs.main;

        this.pool = new Pool(config);
        this.config = config;

        DB.instance = this;
    }

    static getInstance() {
        if (!DB.instance) {
            new DB();
        }
        return DB.instance;
    }

    // Get the current pool (useful for external access)
    getPool() {
        return this.pool;
    }

    // Get the current configuration
    getConfig() {
        return this.config;
    }

    // Check if we're using test database
    isTestEnvironment() {
        return process.env.NODE_ENV === 'test';
    }

    async query(text, params) {
        try {
            return await this.pool.query(text, params);
        } catch (err) {
            console.error('DB Query Error:', err);
            throw err;
        }
    }

    async connect() {
        try {
            // Optional: test one connection at startup
            const client = await this.pool.connect();
            client.release();
            console.log(`DB connected via pool to ${this.isTestEnvironment() ? 'test' : 'main'} database`);
        } catch (err) {
            console.error('DB Connection Error:', err);
            throw err;
        }
    }

    async disconnect() {
        await this.pool.end();
    }

    // Function to close all pools (useful for tests)
    static async closeAllPools() {
        if (DB.instance) {
            await DB.instance.disconnect();
            DB.instance = null;
        }
    }
}

module.exports = DB;
