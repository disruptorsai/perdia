#!/usr/bin/env node

/**
 * Import Keywords from CSV
 *
 * Usage: node scripts/import-keywords.js <csv-file-path>
 *
 * CSV Format:
 * Keyword,Search Volume,Difficulty,Priority,Status,Current Ranking,Category
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  console.log(`📖 Reading CSV file: ${filePath}`);

  let fileContent = fs.readFileSync(filePath, 'utf-8');

  // Preprocess: Remove problematic quotes from lines
  // Fix lines that have unclosed quotes by removing the opening quote
  const lines = fileContent.split('\n');
  const fixedLines = lines.map((line, index) => {
    // Skip header
    if (index === 0) return line;

    // Count quotes in the line
    const quoteCount = (line.match(/"/g) || []).length;

    // If odd number of quotes, remove them all (malformed)
    if (quoteCount % 2 !== 0) {
      return line.replace(/"/g, '');
    }

    return line;
  });

  fileContent = fixedLines.join('\n');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true  // Allow inconsistent column count
  });

  console.log(`✅ Parsed ${records.length} records from CSV`);
  return records;
}

/**
 * Transform CSV row to keyword object
 */
function transformKeyword(row, userId) {
  return {
    keyword: row['Keyword']?.trim(),
    search_volume: parseInt(row['Search Volume']) || 0,
    difficulty: parseInt(row['Difficulty']) || 0,
    priority: parseInt(row['Priority']) || 3,
    status: row['Status']?.trim()?.toLowerCase() || 'queued',
    current_ranking: parseInt(row['Current Ranking']) || null,
    category: row['Category']?.trim() || null,
    list_type: 'currently_ranked', // All these are currently ranked
    user_id: userId,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  };
}

/**
 * Import keywords in batches
 */
async function importKeywords(keywords, batchSize = 100) {
  console.log(`\n📥 Importing ${keywords.length} keywords in batches of ${batchSize}...`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(keywords.length / batchSize);

    process.stdout.write(`\r⏳ Processing batch ${batchNum}/${totalBatches}...`);

    try {
      const { data, error } = await supabase
        .from('keywords')
        .insert(batch)
        .select();

      if (error) {
        errorCount += batch.length;
        errors.push({ batch: batchNum, error: error.message });
      } else {
        successCount += data.length;
      }
    } catch (err) {
      errorCount += batch.length;
      errors.push({ batch: batchNum, error: err.message });
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n');
  return { successCount, errorCount, errors };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Usage: node scripts/import-keywords.js <csv-file-path>');
    console.error('   Example: node scripts/import-keywords.js ~/Downloads/keywords.csv');
    process.exit(1);
  }

  const csvFilePath = args[0];

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ File not found: ${csvFilePath}`);
    process.exit(1);
  }

  try {
    // Get the first user from auth.users
    console.log('🔍 Finding user account...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Error fetching users:', userError.message);
      process.exit(1);
    }

    if (!users || !users.users || users.users.length === 0) {
      console.error('❌ No users found. Please create a user account first.');
      console.error('   You can sign up at http://localhost:5173/signup');
      process.exit(1);
    }

    const userId = users.users[0].id;
    console.log(`✅ Using user ID: ${userId} (${users.users[0].email})`);

    // Parse CSV
    const records = parseCSV(csvFilePath);

    // Transform to keyword objects
    console.log('🔄 Transforming records...');
    const keywords = records
      .map(row => transformKeyword(row, userId))
      .filter(k => k.keyword && k.keyword.length > 0); // Filter out empty keywords

    console.log(`✅ Prepared ${keywords.length} keywords for import`);

    // Check for existing keywords
    console.log('🔍 Checking for existing keywords...');
    const { count: existingCount } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (existingCount > 0) {
      console.log(`⚠️  Warning: Found ${existingCount} existing keywords for this user`);
      console.log('   This import will ADD to existing keywords (not replace)');
    }

    // Import keywords
    const { successCount, errorCount, errors } = await importKeywords(keywords);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${successCount} keywords`);
    console.log(`❌ Failed to import: ${errorCount} keywords`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(({ batch, error }) => {
        console.log(`   Batch ${batch}: ${error}`);
      });
    }

    if (successCount > 0) {
      console.log('\n🎉 Keywords imported successfully!');
      console.log('   Open the Keyword Manager to view your keywords.');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
