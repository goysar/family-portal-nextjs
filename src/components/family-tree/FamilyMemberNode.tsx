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
  const { id, firstName, lastName, gender, photoUrl, isAlive } = member;

  const initials = getInitials(firstName, lastName);
  const bgColor = getColorFromId(id);
  const textColor = getReadableTextColor(bgColor, id);

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
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${firstName} ${lastName}`}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold select-none"
              style={{ backgroundColor: bgColor, color: textColor }}
              aria-label={`${firstName} ${lastName} initials`}
            >
              {initials}
            </div>
          )}
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

function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.trim()?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.trim()?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '?';
}

function getColorFromId(id: string): string {
  const palette = [
    '#F87171', // red-400
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#22C55E', // green-500
    '#EAB308', // yellow-500
    '#F97316', // orange-500
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const index = hash % palette.length;
  return palette[index];
}

function getReadableTextColor(bgHex: string, seed: string): string {
  // Try a seeded pick from a palette, then ensure contrast; fallback to white/near-black
  const textPalette = ['#FFFFFF', '#F8FAFC', '#0F172A', '#111827', '#1F2937', '#FAFAF9'];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }
  const candidate = textPalette[hash % textPalette.length];
  if (contrastRatio(bgHex, candidate) >= 4.5) return candidate;
  // Fallback to black/white based on luminance
  return relativeLuminance(bgHex) > 0.5 ? '#0F172A' : '#FFFFFF';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hex1: string, hex2: string): number {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}