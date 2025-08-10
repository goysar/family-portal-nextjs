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
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (!session.user?.id) {
      return new NextResponse('User ID not found in session', { status: 400 });
    }

    // Get the current user
    const currentUser = await prisma.familyMember.findUnique({
      where: { id: session.user.id },
    });
    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Helper to avoid duplicates
    const memberMap = new Map<string, FamilyMemberResponse>();
    const visited = new Set<string>();
    const queue: string[] = [];

    function addMember(member: any) {
      if (!member) return;
      if (!memberMap.has(member.id)) {
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
      if (!visited.has(member.id)) {
        queue.push(member.id);
      }
    }

    // Seed with current user
    addMember(currentUser);

    while (queue.length > 0) {
      const memberId = queue.shift() as string;
      if (visited.has(memberId)) continue;
      visited.add(memberId);

      // Use data we already have when possible
      const base = memberMap.get(memberId);
      let fatherId: string | null | undefined = base?.fatherId;
      let motherId: string | null | undefined = base?.motherId;
      let spouseId: string | null | undefined = base?.spouseId;

      // Ensure we have up-to-date relation IDs
      if (fatherId === undefined || motherId === undefined || spouseId === undefined) {
        const reloaded = await prisma.familyMember.findUnique({ where: { id: memberId } });
        fatherId = fatherId ?? reloaded?.fatherId ?? null;
        motherId = motherId ?? reloaded?.motherId ?? null;
        spouseId = spouseId ?? reloaded?.spouseId ?? null;
      }

      // Parents
      if (fatherId) {
        const father = await prisma.familyMember.findUnique({ where: { id: fatherId } });
        addMember(father);
      }
      if (motherId) {
        const mother = await prisma.familyMember.findUnique({ where: { id: motherId } });
        addMember(mother);
      }

      // Spouse
      if (spouseId) {
        const spouse = await prisma.familyMember.findUnique({ where: { id: spouseId } });
        addMember(spouse);
      }

      // Children
      const children = await prisma.familyMember.findMany({
        where: {
          OR: [
            { fatherId: memberId },
            { motherId: memberId },
          ],
        },
      });
      children.forEach(addMember);

      // Siblings (share at least one parent)
      if (fatherId || motherId) {
        const siblings = await prisma.familyMember.findMany({
          where: {
            AND: [
              {
                OR: [
                  fatherId ? { fatherId } : undefined as any,
                  motherId ? { motherId } : undefined as any,
                ].filter(Boolean) as any,
              },
              { id: { not: memberId } },
            ],
          },
        });
        siblings.forEach(addMember);
      }

      // In-laws: Spouse's parents
      if (spouseId) {
        const spouse = await prisma.familyMember.findUnique({ where: { id: spouseId } });
        if (spouse) {
          // Spouse's father (father-in-law)
          if (spouse.fatherId) {
            const fatherInLaw = await prisma.familyMember.findUnique({ where: { id: spouse.fatherId } });
            addMember(fatherInLaw);
          }
          // Spouse's mother (mother-in-law)
          if (spouse.motherId) {
            const motherInLaw = await prisma.familyMember.findUnique({ where: { id: spouse.motherId } });
            addMember(motherInLaw);
          }
        }
      }

      // In-laws: Siblings' spouses
      if (fatherId || motherId) {
        const siblings = await prisma.familyMember.findMany({
          where: {
            AND: [
              {
                OR: [
                  fatherId ? { fatherId } : undefined as any,
                  motherId ? { motherId } : undefined as any,
                ].filter(Boolean) as any,
              },
              { id: { not: memberId } },
            ],
          },
        });
        for (const sibling of siblings) {
          if (sibling.spouseId) {
            const siblingSpouse = await prisma.familyMember.findUnique({ where: { id: sibling.spouseId } });
            addMember(siblingSpouse);
          }
        }
      }

      // In-laws: Children's spouses
      const childrenForInLaws = await prisma.familyMember.findMany({
        where: {
          OR: [
            { fatherId: memberId },
            { motherId: memberId },
          ],
        },
      });
      for (const child of childrenForInLaws) {
        if (child.spouseId) {
          const childSpouse = await prisma.familyMember.findUnique({ where: { id: child.spouseId } });
          addMember(childSpouse);
        }
      }
    }

    // Convert to array
    const relatedMembers = Array.from(memberMap.values());
    return NextResponse.json(relatedMembers);
  } catch (error) {
    console.error('Error in GET /api/family-members:', error);
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
        phoneNumber: data.phoneNumber,
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