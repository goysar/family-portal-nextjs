export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  // Authentication fields
  email: string;
  password: string;
  role: 'admin' | 'member';
  isActive: boolean;
  
  // Personal Information
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  dateOfBirth: Date;
  placeOfBirth: string;
  currentLocation: string;
  occupation: string;
  hobbies: string[];
  isAlive: boolean;
  dateOfDeath?: Date;
  photoUrl: string;
  
  // Family Relationships
  spouseId?: string;
  parentIds: string[];
  childrenIds: string[];
  
  // Virtual fields
  fullName: string;
  age: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'birthday' | 'wedding' | 'anniversary' | 'other';
  relatedMemberIds: string[];
  createdAt: Date;
  updatedAt: Date;
} 