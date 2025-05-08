import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;

async function findModelImages() {
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
    const imagesCollection = db.collection('images');
    
    // Check if images collection exists
    const collections = await db.listCollections({ name: 'images' }).toArray();
    console.log('Does images collection exist?', collections.length > 0);
    
    // Check total count of models
    const totalModels = await modelsCollection.countDocuments();
    console.log(`Total models in database: ${totalModels}`);
    
    // Get sample models
    const models = await modelsCollection.find({}).limit(5).toArray();
    
    if (models.length > 0) {
      console.log('\nAnalyzing models for image information:');
      
      for (const model of models) {
        console.log(`\nModel: ${model.name || 'Unknown'} (${model._id})`);
        
        // Check if model has direct image URL
        if (model.url) {
          console.log('Model has direct URL:', model.url);
        } else {
          console.log('Model does not have a direct URL');
        }
        
        // Check for related images in the images collection if it exists
        if (collections.length > 0) {
          const relatedImages = await imagesCollection.find({ 
            $or: [
              { modelId: model._id },
              { modelId: model._id.toString() }
            ]
          }).limit(3).toArray();
          
          if (relatedImages.length > 0) {
            console.log('Found related images:');
            relatedImages.forEach((img, i) => {
              console.log(`  ${i + 1}. ${img.url || 'No URL'}`);
            });
          } else {
            console.log('No related images found in images collection');
          }
        }
        
        // Look for any image-related fields
        const possibleImageFields = Object.keys(model).filter(key => 
          key.includes('image') || 
          key.includes('photo') || 
          key.includes('picture') || 
          key.includes('url')
        );
        
        if (possibleImageFields.length > 0) {
          console.log('Possible image-related fields:', possibleImageFields);
          possibleImageFields.forEach(field => {
            console.log(`  ${field}: `, model[field]);
          });
        } else {
          console.log('No image-related fields found in model');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

findModelImages(); 