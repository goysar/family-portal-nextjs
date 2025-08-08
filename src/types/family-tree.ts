import { Node, Edge } from 'reactflow';

export interface FamilyTreeNode {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  photoUrl: string;
  isAlive: boolean;
  dateOfBirth: Date;
  dateOfDeath?: Date;
  placeOfBirth: string;
  currentLocation: string;
  occupation: string;
  hobbies: string[];
  spouseId?: string;
  parentIds: string[];
  childrenIds: string[];
}

export interface FamilyTreeData {
  nodes: Node[];
  edges: Edge[];
}

export interface FamilyMemberNode extends Node {
  data: {
    member: FamilyTreeNode;
    isHighlighted: boolean;
  };
} 