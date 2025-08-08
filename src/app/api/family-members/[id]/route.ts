import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import FamilyMember from '@/models/FamilyMember';
import { uploadFile } from '@/lib/upload';

// GET /api/family-members/[id] - Get a specific family member
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
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
            gender: true,
            dateOfBirth: true,
            profilePicture: true
          }
        },
        father: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            profilePicture: true
          }
        },
        mother: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            profilePicture: true
          }
        },
        children: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            profilePicture: true
          }
        },
        childrenOfMother: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            profilePicture: true
          }
        }
      }
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // Get siblings by finding members with the same parents
    const siblings = await prisma.familyMember.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                fatherId: familyMember.fatherId,
                motherId: familyMember.motherId,
                id: { not: familyMember.id }
              }
            ]
          },
          {
            fatherId: { not: null },
            motherId: { not: null }
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        profilePicture: true
      }
    });

    // Create a clean response object
    const response = {
      ...familyMember,
      siblings
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching family member:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/family-members/[id] - Update a family member
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return new NextResponse('Only administrators can edit family members', { status: 403 });
    }

    // Parse FormData for file upload
    const formData = await request.formData();
    const data: any = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      gender: formData.get('gender') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      isAlive: formData.get('isAlive') === 'true',
      role: formData.get('role') as string,
      phoneNumber: formData.get('phoneNumber') as string || null,
      address: formData.get('address') as string || null,
      occupation: formData.get('occupation') as string || null,
      education: formData.get('education') as string || null,
      bloodGroup: formData.get('bloodGroup') as string || null,
      maritalStatus: formData.get('maritalStatus') as string || null,
      anniversaryDate: formData.get('anniversaryDate') as string || null,
      deathAnniversaryDate: formData.get('deathAnniversaryDate') as string || null,
      notes: formData.get('notes') as string || null,
    };

    // Handle spouse relationship only if spouseId field is explicitly provided in the request
    if (formData.has('spouseId')) {
      const spouseId = formData.get('spouseId') as string | null;
      if (spouseId) {
        // Check if the spouse is already married to someone else
        const existingSpouse = await prisma.familyMember.findUnique({
          where: { spouseId },
        });

        if (existingSpouse && existingSpouse.id !== params.id) {
          return new NextResponse(
            'The selected spouse is already married to another family member',
            { status: 400 }
          );
        }

        // Update both members' spouse relationships
        await prisma.$transaction([
          // Update the current member's spouse
          prisma.familyMember.update({
            where: { id: params.id },
            data: { spouseId },
          }),
          // Update the spouse's spouseId to point to the current member
          prisma.familyMember.update({
            where: { id: spouseId },
            data: { spouseId: params.id },
          }),
        ]);
      } else {
        // If explicitly setting spouseId to null, remove spouse relationship
        const currentMember = await prisma.familyMember.findUnique({
          where: { id: params.id },
          select: { spouseId: true },
        });

        if (currentMember?.spouseId) {
          await prisma.$transaction([
            // Remove spouse from current member
            prisma.familyMember.update({
              where: { id: params.id },
              data: { spouseId: null },
            }),
            // Remove spouse from the other member
            prisma.familyMember.update({
              where: { id: currentMember.spouseId },
              data: { spouseId: null },
            }),
          ]);
        }
      }
    }

    // Convert date fields
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.anniversaryDate) data.anniversaryDate = new Date(data.anniversaryDate);
    if (data.deathAnniversaryDate) data.deathAnniversaryDate = new Date(data.deathAnniversaryDate);

    // Handle profile picture upload if present
    const profilePicture = formData.get('profilePicture') as File | null;
    if (profilePicture && profilePicture.size > 0) {
      try {
        data.profilePicture = await uploadFile(profilePicture);
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
      }
    }

    // Update the member's other fields
    const updatedMember = await prisma.familyMember.update({
      where: { id: params.id },
      data,
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
        phoneNumber: true,
        address: true,
        occupation: true,
        education: true,
        bloodGroup: true,
        maritalStatus: true,
        anniversaryDate: true,
        deathAnniversaryDate: true,
        profilePicture: true,
        notes: true,
        spouseId: true,
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating family member:', error);
    if (error instanceof Error) {
      return new NextResponse(`Failed to update family relations: ${error.message}`, { status: 500 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/family-members/[id] - Delete a family member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only admin users can delete family members
    if (session.user.role !== 'admin') {
      return new NextResponse('Only administrators can delete family members', { status: 403 });
    }

    // Get the member and all their relationships
    const member = await prisma.familyMember.findUnique({
      where: { id: params.id },
      include: {
        spouse: true,
        father: true,
        mother: true,
        children: true,
        childrenOfMother: true,
      },
    });

    if (!member) {
      return new NextResponse('Family member not found', { status: 404 });
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
          where: { fatherId: params.id },
          data: { fatherId: null },
        });
      }

      // Remove mother relationship from children
      if (member.childrenOfMother.length > 0) {
        await tx.familyMember.updateMany({
          where: { motherId: params.id },
          data: { motherId: null },
        });
      }

      // Delete the member
      await tx.familyMember.delete({
        where: { id: params.id },
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
    console.error('Error deleting family member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 