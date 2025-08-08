import mongoose, { Document } from 'mongoose';

interface IFamilyMember extends Document {
  email: string;
  password: string;
  role: 'admin' | 'member';
  isActive: boolean;
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
  spouseId?: mongoose.Types.ObjectId;
  parentIds: mongoose.Types.ObjectId[];
  childrenIds: mongoose.Types.ObjectId[];
  fullName: string;
  age: number;
}

const familyMemberSchema = new mongoose.Schema({
  // Authentication fields
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Personal Information
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  placeOfBirth: {
    type: String,
    required: true,
  },
  currentLocation: {
    type: String,
    required: true,
  },
  occupation: {
    type: String,
    required: true,
  },
  hobbies: [{
    type: String,
  }],
  isAlive: {
    type: Boolean,
    default: true,
  },
  dateOfDeath: {
    type: Date,
  },
  photoUrl: {
    type: String,
    required: true,
  },

  // Family Relationships
  spouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
  },
  parentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
  }],
  childrenIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
  }],
}, {
  timestamps: true,
});

// Add virtual for full name
familyMemberSchema.virtual('fullName').get(function(this: IFamilyMember) {
  return `${this.firstName} ${this.lastName}`;
});

// Add virtual for age
familyMemberSchema.virtual('age').get(function(this: IFamilyMember) {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtuals are included when converting to JSON
familyMemberSchema.set('toJSON', { virtuals: true });
familyMemberSchema.set('toObject', { virtuals: true });

export default mongoose.models.FamilyMember || mongoose.model<IFamilyMember>('FamilyMember', familyMemberSchema); 