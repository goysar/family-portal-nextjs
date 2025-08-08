import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get total members count
    const totalMembers = await prisma.familyMember.count();

    // Get active members count (members who have logged in within the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeMembers = await prisma.familyMember.count({
      where: {
        lastLoginAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get upcoming events count
    const upcomingEvents = await prisma.event.count({
      where: {
        date: {
          gte: new Date(),
        },
      },
    });

    // Get recent activities
    const recentActivities = await prisma.activity.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        type: true,
        description: true,
        timestamp: true,
      },
    });

    return NextResponse.json({
      totalMembers,
      activeMembers,
      upcomingEvents,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 