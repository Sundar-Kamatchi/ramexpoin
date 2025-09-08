// Debug script to check if constants are working
import { TABLES, COMMON_SELECTS, ORDER_BY } from './src/lib/database/schema.js';

console.log('=== DEBUGGING CONSTANTS ===');
console.log('TABLES object:', TABLES);
console.log('TABLES.SUPPLIERS:', TABLES.SUPPLIERS);
console.log('COMMON_SELECTS.SUPPLIERS_FULL:', COMMON_SELECTS.SUPPLIERS_FULL);
console.log('ORDER_BY.SUPPLIERS:', ORDER_BY.SUPPLIERS);

// Test the table key lookup
const tableKey = 'SUPPLIERS';
console.log(`TABLES[${tableKey}]:`, TABLES[tableKey]);

console.log('=== END DEBUG ===');


