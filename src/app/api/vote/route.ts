import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '~/lib/mongodb';
import { ObjectId } from 'mongodb';

// Simple ELO rating calculation
function calculateNewRatings(winnerRating: number, loserRating: number) {
  const K = 32; // K-factor
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
  const newWinnerRating = Math.round(winnerRating + K * (1 - expectedWinner));
  const newLoserRating = Math.round(loserRating + K * (0 - expectedLoser));
  
  return { newWinnerRating, newLoserRating };
}

export async function POST(request: NextRequest) {
  try {
    const { winnerId, loserId, userId } = await request.json();
    
    if (!winnerId || !loserId) {
      return NextResponse.json(
        { error: 'Both winnerId and loserId are required' },
        { status: 400 }
      );
    }
    
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');
    const votesCollection = db.collection('votes');
    
    // Convert string IDs to ObjectIds
    const winnerObjectId = new ObjectId(winnerId);
    const loserObjectId = new ObjectId(loserId);
    
    // Get current ratings
    const winner = await imagesCollection.findOne({ _id: winnerObjectId });
    const loser = await imagesCollection.findOne({ _id: loserObjectId });
    
    if (!winner || !loser) {
      return NextResponse.json(
        { error: 'One or both images not found' },
        { status: 404 }
      );
    }
    
    // Calculate new ELO ratings
    const { newWinnerRating, newLoserRating } = calculateNewRatings(
      winner.elo || 1200,
      loser.elo || 1200
    );
    
    const timestamp = new Date();
    
    // Create opponent objects
    const loserAsOpponent = {
      id: loser._id.toString(),
      modelId: loser.modelId,
      elo: loser.elo,
      result: "win",
      timestamp
    };
    
    const winnerAsOpponent = {
      id: winner._id.toString(),
      modelId: winner.modelId,
      elo: winner.elo,
      result: "loss",
      timestamp
    };
    
    // Update winner
    await imagesCollection.updateOne(
      { _id: winnerObjectId },
      { 
        $inc: { wins: 1, timesRated: 1 },
        $set: { 
          elo: newWinnerRating,
          winRate: (winner.wins + 1) / (winner.wins + winner.losses + 1),
          updatedAt: timestamp
        }
      }
    );
    
    // Try to update lastOpponents separately to handle potential type issues
    try {
      await imagesCollection.updateOne(
        { _id: winnerObjectId },
        { $push: { lastOpponents: loserAsOpponent } }
      );
    } catch (err) {
      console.warn('Could not update lastOpponents for winner:', err);
    }
    
    // Update loser
    await imagesCollection.updateOne(
      { _id: loserObjectId },
      { 
        $inc: { losses: 1, timesRated: 1 },
        $set: { 
          elo: newLoserRating,
          winRate: loser.wins / (loser.wins + loser.losses + 1),
          updatedAt: timestamp
        }
      }
    );
    
    // Try to update lastOpponents separately to handle potential type issues
    try {
      await imagesCollection.updateOne(
        { _id: loserObjectId },
        { $push: { lastOpponents: winnerAsOpponent } }
      );
    } catch (err) {
      console.warn('Could not update lastOpponents for loser:', err);
    }
    
    // Record the vote
    await votesCollection.insertOne({
      userId: userId || 'anonymous',
      winnerId: winner._id.toString(),
      loserId: loser._id.toString(),
      createdAt: timestamp
    });
    
    return NextResponse.json({ 
      success: true,
      winnerNewElo: newWinnerRating,
      loserNewElo: newLoserRating
    });
    
  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
} 