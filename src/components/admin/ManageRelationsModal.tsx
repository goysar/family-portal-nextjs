import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
}

interface ManageRelationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    spouse?: FamilyMember | null;
    father?: FamilyMember | null;
    mother?: FamilyMember | null;
    children?: FamilyMember[];
    childrenOfMother?: FamilyMember[];
    siblings?: FamilyMember[];
  };
  onSuccess?: () => void;
}

export default function ManageRelationsModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: ManageRelationsModalProps) {
  const [loading, setLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<FamilyMember[]>([]);
  const [selectedSpouse, setSelectedSpouse] = useState<string>('');
  const [selectedFather, setSelectedFather] = useState<string>('');
  const [selectedMother, setSelectedMother] = useState<string>('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedSiblings, setSelectedSiblings] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Load available family members
      fetchAvailableMembers();
    }
  }, [isOpen]);

  // Update selected values when member data changes
  useEffect(() => {
    if (member) {
      setSelectedSpouse(member.spouse?.id || '');
      setSelectedFather(member.father?.id || '');
      setSelectedMother(member.mother?.id || '');
      // Include children linked via father as well as via mother
      const childrenFromFather = member.children?.map(child => child.id) || [];
      const childrenFromMother = member.childrenOfMother?.map(child => child.id) || [];
      const combinedChildren = Array.from(new Set([...
        childrenFromFather,
        ...childrenFromMother,
      ]));
      setSelectedChildren(combinedChildren);
      setSelectedSiblings(member.siblings?.map(sibling => sibling.id) || []);
    }
  }, [member]);

  const fetchAvailableMembers = async () => {
    try {
      const response = await fetch('/api/family-members');
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      // Filter out the current member
      setAvailableMembers(data.filter((m: FamilyMember) => m.id !== member.id));
    } catch (error) {
      console.error('Error fetching available members:', error);
      toast.error('Failed to load family members');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/family-members/${member.id}/relations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spouseId: selectedSpouse || null,
          fatherId: selectedFather || null,
          motherId: selectedMother || null,
          childrenIds: selectedChildren,
          siblingsIds: selectedSiblings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update relations');
      }

      toast.success('Family relations updated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating relations:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update family relations');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            Manage Relations for {member.firstName} {member.lastName}
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Spouse Selection */}
            <div>
              <label htmlFor="spouse" className="block text-sm font-medium text-gray-700 mb-1">
                Spouse
              </label>
              <select
                id="spouse"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedSpouse}
                onChange={(e) => setSelectedSpouse(e.target.value)}
              >
                <option value="">Select spouse</option>
                {availableMembers
                  .filter(m => m.gender !== member.gender)
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Parents Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="father" className="block text-sm font-medium text-gray-700 mb-1">
                  Father
                </label>
                <select
                  id="father"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedFather}
                  onChange={(e) => setSelectedFather(e.target.value)}
                >
                  <option value="">Select father</option>
                  {availableMembers
                    .filter(m => m.gender === 'male')
                    .map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="mother" className="block text-sm font-medium text-gray-700 mb-1">
                  Mother
                </label>
                <select
                  id="mother"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedMother}
                  onChange={(e) => setSelectedMother(e.target.value)}
                >
                  <option value="">Select mother</option>
                  {availableMembers
                    .filter(m => m.gender === 'female')
                    .map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Children Selection */}
            <div>
              <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">
                Children
              </label>
              <select
                id="children"
                multiple
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedChildren}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedChildren(values);
                }}
              >
                {availableMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Hold Ctrl/Cmd to select multiple children
              </p>
            </div>

            {/* Siblings Selection */}
            <div>
              <label htmlFor="siblings" className="block text-sm font-medium text-gray-700 mb-1">
                Siblings
              </label>
              <select
                id="siblings"
                multiple
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedSiblings}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedSiblings(values);
                }}
              >
                {availableMembers
                  .filter(m => {
                    // Only show members who could be siblings:
                    // 1. Not the current member
                    // 2. Not already a parent or child
                    // 3. Not the spouse
                    return m.id !== member.id &&
                           m.id !== selectedFather &&
                           m.id !== selectedMother &&
                           m.id !== selectedSpouse &&
                           !selectedChildren.includes(m.id);
                  })
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Hold Ctrl/Cmd to select multiple siblings. Siblings are members who share the same parents.
              </p>
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              onClick={handleSubmit}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 