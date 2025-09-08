// Quick test to verify database utilities are working
import { fetchMasterData } from './src/lib/database/index.js';

async function testDatabaseUtils() {
  console.log('Testing database utilities...');
  
  try {
    const result = await fetchMasterData();
    console.log('✅ fetchMasterData() successful');
    console.log('Suppliers:', result.suppliers?.length || 0);
    console.log('Items:', result.items?.length || 0);
    console.log('Gap Items:', result.gapItems?.length || 0);
    
    if (result.errors.suppliers) {
      console.error('❌ Suppliers error:', result.errors.suppliers);
    }
    if (result.errors.items) {
      console.error('❌ Items error:', result.errors.items);
    }
    if (result.errors.gapItems) {
      console.error('❌ Gap Items error:', result.errors.gapItems);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDatabaseUtils();
