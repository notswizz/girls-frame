import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '~/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';
    
    const db = await connectToDatabase();
    const votesCollection = db.collection('votes');
    
    // Count total votes by the user
    const totalVotes = await votesCollection.countDocuments({ userId });
    
    // Get user's most recent votes
    const recentVotes = await votesCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Get vote statistics
    const voteStats = await votesCollection.aggregate([
      { $match: { userId } },
      { $group: {
          _id: null,
          totalVotes: { $sum: 1 },
          uniqueWinners: { $addToSet: "$winnerId" },
          uniqueLosers: { $addToSet: "$loserId" }
      }}
    ]).toArray();
    
    const stats = voteStats.length > 0 ? voteStats[0] : { totalVotes: 0, uniqueWinners: [], uniqueLosers: [] };
    
    // Get top voted winners
    const topWinners = await votesCollection.aggregate([
      { $match: { userId } },
      { $group: {
          _id: "$winnerId",
          count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: "images",
          localField: "_id",
          foreignField: "_id",
          as: "winnerDetails"
      }},
      { $unwind: "$winnerDetails" },
      { $project: {
          _id: 1,
          count: 1,
          url: "$winnerDetails.url",
          modelName: "$winnerDetails.modelName",
          modelUsername: "$winnerDetails.modelUsername"
      }}
    ]).toArray();
    
    return NextResponse.json({
      userId,
      totalVotes,
      uniqueModelsVoted: [...new Set([...stats.uniqueWinners, ...stats.uniqueLosers])].length,
      recentVotes,
      topWinners
    });
    
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
} 