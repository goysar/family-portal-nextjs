import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { uploadFile } from '@/lib/upload';

// Define the type for a family member in the API response
type FamilyMemberResponse = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date;
  isAlive: boolean;
  profilePicture?: string | null;
  address?: string | null;
  occupation?: string | null;
  spouseId?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
};

// GET /api/family-members - Get family members related to the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!session.user?.id) {
      console.error('Session user ID is missing:', session);
      return new NextResponse('User ID not found in session', { status: 400 });
    }

    console.log('Fetching user with ID:', session.user.id);

    // Get the current user
    const currentUser = await prisma.familyMember.findUnique({
      where: { 
        id: session.user.id 
      },
    });

    console.log('Current user found:', currentUser ? 'Yes' : 'No');

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Helper to avoid duplicates
    const memberMap = new Map<string, FamilyMemberResponse>();
    
    function addMember(member: any) {
      if (member && !memberMap.has(member.id)) {
        memberMap.set(member.id, {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          gender: member.gender,
          dateOfBirth: member.dateOfBirth,
          isAlive: member.isAlive,
          profilePicture: member.profilePicture,
          address: member.address,
          occupation: member.occupation,
          spouseId: member.spouseId,
          fatherId: member.fatherId,
          motherId: member.motherId,
        });
      }
    }

    try {
      // Add current user
      addMember(currentUser);

      // Fetch and add spouse
      if (currentUser.spouseId) {
        const spouse = await prisma.familyMember.findUnique({
          where: { id: currentUser.spouseId },
        });
        if (spouse) addMember(spouse);
      }

      // Fetch and add father
      if (currentUser.fatherId) {
        const father = await prisma.familyMember.findUnique({
          where: { id: currentUser.fatherId },
        });
        if (father) addMember(father);
      }

      // Fetch and add mother
      if (currentUser.motherId) {
        const mother = await prisma.familyMember.findUnique({
          where: { id: currentUser.motherId },
        });
        if (mother) addMember(mother);
      }

      // Fetch and add children
      const children = await prisma.familyMember.findMany({
        where: {
          OR: [
            { fatherId: currentUser.id },
            { motherId: currentUser.id },
          ],
        },
      });
      children.forEach(addMember);

      // Fetch and add siblings
      const siblings = await prisma.familyMember.findMany({
        where: {
          AND: [
            {
              OR: [
                { fatherId: currentUser.fatherId },
                { motherId: currentUser.motherId },
              ],
            },
            { id: { not: currentUser.id } },
          ],
        },
      });
      siblings.forEach(addMember);

      // Convert to array
      const relatedMembers = Array.from(memberMap.values());
      console.log('Number of related members found:', relatedMembers.length);

      return NextResponse.json(relatedMembers);
    } catch (error) {
      console.error('Error processing relationships:', error);
      throw error;
    }
  } catch (error) {
    console.error('Detailed error in GET /api/family-members:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/family-members - Create a new family member
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract all form fields
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      gender: formData.get('gender') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      isAlive: formData.get('isAlive') === 'true',
      role: formData.get('role') as string || 'member',
      spouseId: formData.get('spouseId') as string || null,
      fatherId: formData.get('fatherId') as string || null,
      motherId: formData.get('motherId') as string || null,
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

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.password || !data.gender || !data.dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingMember = await prisma.familyMember.findUnique({
      where: { email: data.email },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Convert date strings to DateTime objects
    const dateOfBirth = new Date(data.dateOfBirth);
    const anniversaryDate = data.anniversaryDate ? new Date(data.anniversaryDate) : null;
    const deathAnniversaryDate = data.deathAnniversaryDate ? new Date(data.deathAnniversaryDate) : null;

    // Handle profile picture upload if present
    let profilePictureUrl = null;
    const profilePicture = formData.get('profilePicture') as File | null;
    if (profilePicture) {
      try {
        profilePictureUrl = await uploadFile(profilePicture);
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        return NextResponse.json(
          { error: 'Failed to upload profile picture' },
          { status: 500 }
        );
      }
    }

    // Create the family member
    const member = await prisma.familyMember.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        gender: data.gender,
        dateOfBirth,
        isAlive: data.isAlive,
        role: data.role,
        address: data.address,
        occupation: data.occupation,
        education: data.education,
        bloodGroup: data.bloodGroup,
        maritalStatus: data.maritalStatus,
        anniversaryDate,
        deathAnniversaryDate,
        profilePicture: profilePictureUrl,
        notes: data.notes,
        spouseId: data.spouseId,
        fatherId: data.fatherId,
        motherId: data.motherId,
      },
    });

    // Remove password from response
    const { password, ...memberWithoutPassword } = member;

    return NextResponse.json(memberWithoutPassword);
  } catch (error) {
    console.error('Error creating family member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 