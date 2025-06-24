const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchemas() {
  try {
    console.log('🔍 Checking database schemas...');
    
    // Check schema audit view
    const { data: schemas, error } = await supabase
      .from('schema_audit')
      .select('*');

    if (error) {
      console.error('❌ Error checking schemas:', error.message);
      return;
    }

    console.log('📊 Schema Status:');
    schemas.forEach(schema => {
      console.log(`  ${schema.schemaname}: ${schema.table_count} tables`);
      console.log(`    Tables: ${schema.tables.join(', ')}`);
    });

    // Check for orphaned net schema
    const netSchema = schemas.find(s => s.schemaname === 'net');
    if (netSchema) {
      console.warn('⚠️ WARNING: "net" schema still exists with tables:', netSchema.tables);
      console.log('   Run: npm run fix-schemas');
    } else {
      console.log('✅ No "net" schema found - all good!');
    }

  } catch (error) {
    console.error('💥 Schema check failed:', error.message);
  }
}

if (require.main === module) {
  checkSchemas();
}

module.exports = { checkSchemas };
