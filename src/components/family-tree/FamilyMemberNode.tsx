import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FamilyTreeNode } from '@/types/family-tree';
import Image from 'next/image';

interface FamilyMemberNodeData {
  member: FamilyTreeNode;
  isHighlighted: boolean;
}

const FamilyMemberNode = memo(({ data }: NodeProps<FamilyMemberNodeData>) => {
  const { member, isHighlighted } = data;
  const { firstName, lastName, gender, photoUrl, isAlive } = member;

  return (
    <div
      className={`relative p-2 rounded-lg shadow-lg ${
        isHighlighted ? 'ring-4 ring-indigo-500' : ''
      } ${gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'} ${
        !isAlive ? 'opacity-50' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-2">
          <Image
            src={photoUrl}
            alt={`${firstName} ${lastName}`}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div className="text-center">
          <p className="font-semibold">{firstName}</p>
          <p className="text-sm text-gray-600">{lastName}</p>
          {!isAlive && (
            <p className="text-xs text-red-500 mt-1">Deceased</p>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
});

FamilyMemberNode.displayName = 'FamilyMemberNode';

export default FamilyMemberNode; 