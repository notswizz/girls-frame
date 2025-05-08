import { NextResponse } from 'next/server';
import { connectToDatabase } from '~/lib/mongodb';

export async function GET() {
  try {
    const db = await connectToDatabase();
    // Use the images collection
    const imagesCollection = db.collection('images');
    
    console.log("Fetching images from the girls.images collection");
    
    // Get two random images
    const images = await imagesCollection
      .aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 2 } }
      ])
      .toArray();
    
    console.log(`Found ${images.length} images with isActive=true`);
    
    // If we don't have enough images, try to find any images
    if (images.length < 2) {
      console.log('Not enough images with isActive=true, trying any images');
      const anyImages = await imagesCollection
        .find({})
        .limit(10)
        .toArray();
      
      console.log(`Found ${anyImages.length} images in total`);
      console.log("First image example:", JSON.stringify(anyImages[0] || {}, null, 2));
      
      // Map the images to the format our frontend expects
      const mappedImages = anyImages.map(img => ({
        _id: img._id,
        url: img.url,
        modelName: img.modelName || "Unknown",
        modelUsername: img.modelUsername || "unknown",
        wins: img.wins || 0,
        losses: img.losses || 0,
        winRate: img.winRate || 0,
        elo: img.elo || 1200
      }));
      
      return NextResponse.json({ models: mappedImages });
    }
    
    // Map the images to match our frontend structure
    const mappedImages = images.map(img => ({
      _id: img._id,
      url: img.url,
      modelName: img.modelName || "Unknown",
      modelUsername: img.modelUsername || "unknown",
      wins: img.wins || 0,
      losses: img.losses || 0,
      winRate: img.winRate || 0,
      elo: img.elo || 1200
    }));
    
    return NextResponse.json({ models: mappedImages });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
} 