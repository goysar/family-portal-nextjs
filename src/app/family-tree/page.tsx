'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import FamilyTree from '@/components/family-tree/FamilyTree';
import { FamilyTreeNode } from '@/types/family-tree';

export default function FamilyTreePage() {
  const [selectedMember, setSelectedMember] = useState<FamilyTreeNode | null>(null);

  const handleNodeClick = (member: FamilyTreeNode) => {
    setSelectedMember(member);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="h-[calc(100vh-4rem)] flex">
        <div className="flex-1 h-full">
          <FamilyTree onNodeClick={handleNodeClick} />
        </div>
        
        {selectedMember && (
          <div className="w-96 p-6 bg-white shadow-lg overflow-y-auto relative">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close member details"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative w-24 h-24">
                  {selectedMember.photoUrl ? (
                    <img
                      src={selectedMember.photoUrl}
                      alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                      className="rounded-full object-cover w-full h-full"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white select-none"
                      style={{
                        backgroundColor: getColorFromId(selectedMember.id),
                      }}
                      aria-label={`${selectedMember.firstName} ${selectedMember.lastName} initials`}
                    >
                      {getInitials(selectedMember.firstName, selectedMember.lastName)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h2>
                  <p className="text-gray-600">
                    {selectedMember.gender === 'male' ? 'Male' : 'Female'}
                  </p>
                  <p className="text-gray-600">
                    {selectedMember.isAlive ? 'Living' : 'Deceased'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Birth Information</h3>
                  <p>Date: {format(new Date(selectedMember.dateOfBirth), 'MMMM d, yyyy')}</p>
                  {selectedMember.placeOfBirth && (
                    <p>Place: {selectedMember.placeOfBirth}</p>
                  )}
                </div>

                {!selectedMember.isAlive && selectedMember.dateOfDeath && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Death Information</h3>
                    <p>Date: {format(new Date(selectedMember.dateOfDeath), 'MMMM d, yyyy')}</p>
                  </div>
                )}

                {selectedMember.currentLocation && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Current Location</h3>
                    <p>{selectedMember.currentLocation}</p>
                  </div>
                )}

                {selectedMember.occupation && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Occupation</h3>
                    <p>{selectedMember.occupation}</p>
                  </div>
                )}

                {selectedMember.hobbies.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Hobbies</h3>
                    <ul className="list-disc list-inside">
                      {selectedMember.hobbies.map((hobby: string, index: number) => (
                        <li key={index}>{hobby}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 

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