import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ImageUploader from '@/components/ImageUploader';
import ManageRelationsModal from '@/components/admin/ManageRelationsModal';

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
}

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    isAlive: boolean;
    role: string;
    phoneNumber?: string;
    address?: string;
    occupation?: string;
    education?: string;
    bloodGroup?: string;
    maritalStatus?: string;
    anniversaryDate?: string;
    deathAnniversaryDate?: string;
    profilePicture?: string;
    notes?: string;
  } | null;
}

export default function EditMemberModal({ isOpen, onClose, onSuccess, member }: EditMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    isAlive: true,
    role: 'member',
    phoneNumber: '',
    address: '',
    occupation: '',
    education: '',
    bloodGroup: '',
    maritalStatus: 'single',
    anniversaryDate: '',
    deathAnniversaryDate: '',
    profilePicture: null as File | null,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRelationsModal, setShowRelationsModal] = useState(false);
  const [memberWithRelations, setMemberWithRelations] = useState<any>(null);

  useEffect(() => {
    if (member && isOpen) {
      // Fetch member details with relationships
      const fetchMemberDetails = async () => {
        try {
          const response = await fetch(`/api/family-members/${member.id}`);
          if (!response.ok) throw new Error('Failed to fetch member details');
          const data = await response.json();
          setMemberWithRelations(data);
        } catch (error) {
          console.error('Error fetching member details:', error);
          toast.error('Failed to fetch member details');
        }
      };
      fetchMemberDetails();
    }
  }, [member, isOpen]);

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        gender: member.gender,
        dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
        isAlive: member.isAlive,
        role: member.role,
        phoneNumber: member.phoneNumber || '',
        address: member.address || '',
        occupation: member.occupation || '',
        education: member.education || '',
        bloodGroup: member.bloodGroup || '',
        maritalStatus: member.maritalStatus || 'single',
        anniversaryDate: member.anniversaryDate ? new Date(member.anniversaryDate).toISOString().split('T')[0] : '',
        deathAnniversaryDate: member.deathAnniversaryDate ? new Date(member.deathAnniversaryDate).toISOString().split('T')[0] : '',
        profilePicture: null,
        notes: member.notes || '',
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setLoading(true);
    setError('');
    try {
      // Use FormData for file upload
      const submitFormData = new FormData();
      const formFields = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        isAlive: formData.isAlive,
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        occupation: formData.occupation,
        education: formData.education,
        bloodGroup: formData.bloodGroup,
        maritalStatus: formData.maritalStatus,
        anniversaryDate: formData.anniversaryDate,
        deathAnniversaryDate: formData.deathAnniversaryDate,
        notes: formData.notes,
      };
      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          submitFormData.append(key, value as string);
        }
      });
      if (formData.profilePicture) {
        submitFormData.append('profilePicture', formData.profilePicture);
      }
      const response = await fetch(`/api/family-members/${member.id}`, {
        method: 'PUT',
        body: submitFormData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update member');
      }
      toast.success('Family member updated successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error(err instanceof Error ? err.message : 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  const renderRelationsSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium text-gray-900">Family Relations</h4>
        <button
          type="button"
          onClick={() => setShowRelationsModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Manage Relations
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Spouse</h5>
          {memberWithRelations?.spouse ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-600">
                  {memberWithRelations.spouse.firstName[0]}{memberWithRelations.spouse.lastName[0]}
                </span>
              </div>
              <span className="text-sm text-gray-900">
                {memberWithRelations.spouse.firstName} {memberWithRelations.spouse.lastName}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No spouse added</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Parents</h5>
          <div className="space-y-2">
            {memberWithRelations?.father ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {memberWithRelations.father.firstName[0]}{memberWithRelations.father.lastName[0]}
                  </span>
                </div>
                <span className="text-sm text-gray-900">
                  {memberWithRelations.father.firstName} {memberWithRelations.father.lastName}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No father added</p>
            )}
            {memberWithRelations?.mother ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-pink-600">
                    {memberWithRelations.mother.firstName[0]}{memberWithRelations.mother.lastName[0]}
                  </span>
                </div>
                <span className="text-sm text-gray-900">
                  {memberWithRelations.mother.firstName} {memberWithRelations.mother.lastName}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No mother added</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Children</h5>
          {(() => {
            const childrenFromFather: FamilyMember[] = memberWithRelations?.children || [];
            const childrenFromMother: FamilyMember[] = memberWithRelations?.childrenOfMother || [];
            const dedupedById = new Map<string, FamilyMember>();
            [...childrenFromFather, ...childrenFromMother].forEach((c) => {
              if (!dedupedById.has(c.id)) dedupedById.set(c.id, c);
            });
            const allChildren = Array.from(dedupedById.values());
            return allChildren.length > 0 ? (
              <div className="space-y-2">
                {allChildren.map((child: FamilyMember) => (
                  <div key={child.id} className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">
                        {child.firstName[0]}{child.lastName[0]}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {child.firstName} {child.lastName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No children added</p>
            );
          })()}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Siblings</h5>
          {memberWithRelations?.siblings && memberWithRelations.siblings.length > 0 ? (
            <div className="space-y-2">
              {memberWithRelations.siblings.map((sibling: FamilyMember) => (
                <div key={sibling.id} className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-600">
                      {sibling.firstName[0]}{sibling.lastName[0]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-900">
                    {sibling.firstName} {sibling.lastName}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No siblings added</p>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen || !member) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">Edit Family Member</h3>
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
              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-md text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    required
                    placeholder="Enter first name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    required
                    placeholder="Enter last name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="Enter email address"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-md border border-gray-200">
                <input
                  type="checkbox"
                  id="isAlive"
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formData.isAlive}
                  onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked })}
                />
                <label htmlFor="isAlive" className="ml-3 block text-base text-gray-900">
                  Living
                </label>
              </div>

              {!formData.isAlive && (
                <div>
                  <label htmlFor="deathAnniversaryDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Death Anniversary Date
                  </label>
                  <input
                    type="date"
                    id="deathAnniversaryDate"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.deathAnniversaryDate}
                    onChange={(e) => setFormData({ ...formData, deathAnniversaryDate: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  placeholder="Enter phone number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  placeholder="Enter address"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    id="occupation"
                    placeholder="Enter occupation"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                    Education
                  </label>
                  <input
                    type="text"
                    id="education"
                    placeholder="Enter education"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    id="bloodGroup"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    id="maritalStatus"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.maritalStatus}
                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>

              {formData.maritalStatus === 'married' && (
                <div>
                  <label htmlFor="anniversaryDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Wedding Anniversary Date
                  </label>
                  <input
                    type="date"
                    id="anniversaryDate"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base py-2 px-3 bg-gray-50"
                    value={formData.anniversaryDate}
                    onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                {member.profilePicture && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Current profile picture:</p>
                    <div className="relative w-24 h-24">
                      <img
                        src={member.profilePicture}
                        alt="Current profile picture"
                        className="w-full h-full object-cover rounded-full border-2 border-gray-200"
                      />
                    </div>
                  </div>
                )}
                <ImageUploader
                  onImageSelect={(file) => setFormData({ ...formData, profilePicture: file })}
                  aspectRatio={1}
                  minWidth={200}
                  minHeight={200}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload a square profile picture (will be cropped to 1:1 ratio)
                </p>
              </div>

              {renderRelationsSection()}

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Enter any additional notes"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2 px-3 bg-gray-50"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </form>
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-base disabled:opacity-50"
                onClick={handleSubmit}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-base"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <ManageRelationsModal
        isOpen={showRelationsModal}
        onClose={() => setShowRelationsModal(false)}
        member={memberWithRelations || member}
        onSuccess={() => {
          // Refresh member data after relations are updated
          if (member) {
            fetch(`/api/family-members/${member.id}`)
              .then(response => response.json())
              .then(data => {
                setMemberWithRelations(data);
                onSuccess?.();
              })
              .catch(error => {
                console.error('Error refreshing member data:', error);
                toast.error('Failed to refresh member data');
              });
          }
          setShowRelationsModal(false);
        }}
      />
    </>
  );
} 