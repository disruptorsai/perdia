import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yvvtsfgryweqfppilkvo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('🔍 Checking articles table schema...');
console.log('─'.repeat(60));

// Check using PostgREST metadata
const checkSchema = async () => {
  try {
    // Try to insert a test record to see which columns are available
    const { error: insertError } = await supabase
      .from('articles')
      .insert({
        title: '__test__schema__check__',
        source_idea_id: '00000000-0000-0000-0000-000000000000'
      })
      .select();

    if (insertError) {
      if (insertError.message.includes('source_idea_id')) {
        console.log('❌ source_idea_id column does NOT exist');
        console.log('   Error:', insertError.message);
        console.log('');
        console.log('✅ Migration needs to be applied');
      } else {
        console.log('⚠️  Different error occurred:', insertError.message);
      }
    } else {
      console.log('✅ source_idea_id column EXISTS!');
      console.log('   Successfully inserted test record');
      console.log('');
      console.log('🧹 Cleaning up test record...');

      // Clean up test record
      await supabase
        .from('articles')
        .delete()
        .eq('title', '__test__schema__check__');

      console.log('✅ Test record removed');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
};

checkSchema();
