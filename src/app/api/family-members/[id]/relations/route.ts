import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
      return new NextResponse('Only administrators can edit family relations', { status: 403 });
    }

    const data = await request.json();
    const {
      spouseId,
      fatherId,
      motherId,
      childrenIds,
      siblingsIds,
    } = data;

    // First, verify that all referenced members exist
    const memberIds = [
      spouseId,
      fatherId,
      motherId,
      ...(childrenIds || []),
      ...(siblingsIds || [])
    ].filter(Boolean);

    if (memberIds.length > 0) {
      const existingMembers = await prisma.familyMember.findMany({
        where: {
          id: {
            in: memberIds
          }
        },
        select: {
          id: true
        }
      });

      const existingIds = existingMembers.map(m => m.id);
      const missingIds = memberIds.filter(id => !existingIds.includes(id));

      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: `Some referenced members do not exist: ${missingIds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update all relations in a single transaction
    const updatedMember = await prisma.$transaction(async (tx) => {
      // Update basic relations
      const member = await tx.familyMember.update({
        where: { id: params.id },
        data: {
          spouseId: spouseId || null,
          fatherId: fatherId || null,
          motherId: motherId || null,
        },
        include: {
          spouse: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
          father: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
          mother: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
          children: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
        },
      });

      // Update children relationships
      if (childrenIds?.length) {
        const memberGender = (member as any).gender?.toLowerCase?.();
        const parentData =
          memberGender === 'male'
            ? { fatherId: params.id }
            : memberGender === 'female'
            ? { motherId: params.id }
            : null;

        if (parentData) {
          await tx.familyMember.updateMany({
            where: {
              id: {
                in: childrenIds,
              },
            },
            data: parentData,
          });
        }
      }

      // Update siblings by setting their parents
      if (siblingsIds?.length) {
        await tx.familyMember.updateMany({
          where: {
            id: {
              in: siblingsIds
            }
          },
          data: {
            fatherId: fatherId || null,
            motherId: motherId || null
          }
        });
      }

      // Fetch final state with siblings
      const finalMember = await tx.familyMember.findUnique({
        where: { id: params.id },
        include: {
          spouse: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
          father: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
          mother: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
          children: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
        },
      });

      // Get siblings by finding members with the same parents
      const siblings = await tx.familyMember.findMany({
        where: {
          OR: [
            {
              fatherId: finalMember?.fatherId,
              id: { not: params.id }
            },
            {
              motherId: finalMember?.motherId,
              id: { not: params.id }
            }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
        },
      });

      return {
        ...finalMember,
        siblings
      };
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating family relations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update family relations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 