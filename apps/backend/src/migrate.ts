import { openDatabase } from './db';

const db = openDatabase();
db.close();
console.log('[db] migrations complete');
