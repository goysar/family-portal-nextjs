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
          <div className="w-96 p-6 bg-white shadow-lg overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative w-24 h-24">
                  <img
                    src={selectedMember.photoUrl}
                    alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                    className="rounded-full object-cover w-full h-full"
                  />
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