const { Pool } = require('pg');

// FIXED: Ensure proper schema configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // FIXED: Explicitly set search_path to avoid schema issues
  options: '-c search_path=public',
});

// FIXED: Add connection error handling and schema verification
pool.on('connect', async (client) => {
  try {
    // Verify we're using the correct schema
    const result = await client.query('SELECT current_schema()');
    console.log(`✅ Connected to database, using schema: ${result.rows[0].current_schema}`);
    
    // Ensure we're in public schema
    await client.query('SET search_path TO public');
  } catch (error) {
    console.error('❌ Database connection setup error:', error);
  }
});

// FIXED: Add error handling for connection issues
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

module.exports = pool;
