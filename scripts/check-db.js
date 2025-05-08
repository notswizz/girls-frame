import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;

async function checkDb() {
  if (!uri) {
    console.error('MONGODB_URI not configured in .env.local');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('hotornot');
    const modelsCollection = db.collection('models');
    
    // Check total count
    const totalCount = await modelsCollection.countDocuments();
    console.log(`Total models in database: ${totalCount}`);
    
    // Check fields
    if (totalCount > 0) {
      const sampleModel = await modelsCollection.findOne({});
      console.log('Sample model structure:');
      console.log(JSON.stringify(sampleModel, null, 2));
      
      // Check if field names might be different from what our app expects
      console.log('\nChecking for field name mismatches...');
      const modelKeys = Object.keys(sampleModel || {});
      console.log('Available fields:', modelKeys);
    }
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await client.close();
  }
}

checkDb(); 