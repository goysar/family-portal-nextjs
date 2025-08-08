import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/members - Get all family members (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await prisma.familyMember.findMany({
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        dateOfBirth: true,
        isAlive: true,
        role: true,
        lastLoginAt: true,
        placeOfBirth: true,
        createdAt: true,
        updatedAt: true,
        spouseId: true,
        fatherId: true,
        motherId: true,
        address: true,
        anniversaryDate: true,
        bloodGroup: true,
        education: true,
        maritalStatus: true,
        notes: true,
        occupation: true,
        phoneNumber: true,
        deathAnniversaryDate: true,
        profilePicture: true,
        spouse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true
          }
        },
        father: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true
          }
        },
        mother: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true
          }
        },
        children: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true
          }
        }
      },
    });

    // Get siblings for each member
    const membersWithSiblings = await Promise.all(members.map(async (member) => {
      const siblings = await prisma.familyMember.findMany({
        where: {
          OR: [
            {
              fatherId: member.fatherId,
              id: { not: member.id }
            },
            {
              motherId: member.motherId,
              id: { not: member.id }
            }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true
        }
      });

      return {
        ...member,
        siblings
      };
    }));

    // Remove sensitive information
    const sanitizedMembers = membersWithSiblings.map(({ password, ...member }) => member);

    return NextResponse.json(sanitizedMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      gender,
      dateOfBirth,
      placeOfBirth,
      role = 'member',
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !gender || !dateOfBirth || !placeOfBirth) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if email already exists
    const existingMember = await prisma.familyMember.findUnique({
      where: { email },
    });

    if (existingMember) {
      return new NextResponse('Email already exists', { status: 400 });
    }

    // Create new member
    const member = await prisma.familyMember.create({
      data: {
        firstName,
        lastName,
        email,
        password, // Note: Password should be hashed before saving
        gender,
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth,
        role,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'member_added',
        description: `New family member added: ${firstName} ${lastName}`,
        memberId: session.user.id,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Member ID is required', { status: 400 });
    }

    // First, get the member and their relationships
    const member = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        spouse: true,
        father: true,
        mother: true,
        children: true,
        childrenOfMother: true,
      },
    });

    if (!member) {
      return new NextResponse('Member not found', { status: 404 });
    }

    // Use a transaction to ensure all operations are atomic
    await prisma.$transaction(async (tx) => {
      // Remove spouse relationship if exists
      if (member.spouseId) {
        await tx.familyMember.update({
          where: { id: member.spouseId },
          data: { spouseId: null },
        });
      }

      // Remove father relationship from children
      if (member.children.length > 0) {
        await tx.familyMember.updateMany({
          where: { fatherId: id },
          data: { fatherId: null },
        });
      }

      // Remove mother relationship from children
      if (member.childrenOfMother.length > 0) {
        await tx.familyMember.updateMany({
          where: { motherId: id },
          data: { motherId: null },
        });
      }

      // Delete the member
      await tx.familyMember.delete({
        where: { id },
      });
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'member_deleted',
        description: `Family member deleted: ${member.firstName} ${member.lastName}`,
        memberId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new NextResponse('Member ID is required', { status: 400 });
    }

    // Update member
    const member = await prisma.familyMember.update({
      where: { id },
      data: updateData,
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'member_updated',
        description: `Family member updated: ${member.firstName} ${member.lastName}`,
        memberId: session.user.id,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 