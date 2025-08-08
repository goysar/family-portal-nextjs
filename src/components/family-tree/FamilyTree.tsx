import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FamilyMemberNode from './FamilyMemberNode';
import { FamilyTreeNode } from '@/types/family-tree';
import { useSession } from 'next-auth/react';

const nodeTypes = {
  familyMember: (props: NodeProps) => <FamilyMemberNode {...props} />,
};

interface FamilyTreeProps {
  onNodeClick?: (member: FamilyTreeNode) => void;
}

export default function FamilyTree({ onNodeClick }: FamilyTreeProps) {
  const { data: session } = useSession();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const transformFamilyData = useCallback((members: any[]) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();
    const levelWidth = 300;
    const levelHeight = 200;

    // Find the current user
    const currentUser = members.find(member => member.id === session?.user?.id);
    if (!currentUser) return { nodes, edges };

    // Organize members by levels
    const levels = new Map<number, any[]>();
    
    // Level 0: Parents
    const parents = [
      ...(currentUser.fatherId ? [members.find(m => m.id === currentUser.fatherId)] : []),
      ...(currentUser.motherId ? [members.find(m => m.id === currentUser.motherId)] : [])
    ].filter(Boolean);
    levels.set(0, parents);

    // Level 1: Current user, spouse, and siblings
    const siblings = members.filter(m => 
      (m.fatherId === currentUser.fatherId || m.motherId === currentUser.motherId) && 
      m.id !== currentUser.id
    );
    
    // Add spouse to the same level if exists
    const spouse = currentUser.spouseId ? members.find(m => m.id === currentUser.spouseId) : null;
    const level1Members = [currentUser, ...(spouse ? [spouse] : []), ...siblings];
    levels.set(1, level1Members);

    // Level 2: Children
    const children = members.filter(m => 
      m.fatherId === currentUser.id || m.motherId === currentUser.id
    );
    if (children.length > 0) {
      levels.set(2, children);
    }

    // Position nodes by level
    levels.forEach((members, level) => {
      const y = level * levelHeight;
      members.forEach((member, index) => {
        const x = (index - (members.length - 1) / 2) * levelWidth;
        nodePositions.set(member.id, { x, y });
      });
    });

    // Create nodes
    members.forEach(member => {
      const position = nodePositions.get(member.id);
      if (position) {
        nodes.push({
          id: member.id,
          type: 'familyMember',
          position,
          data: {
            member: {
              id: member.id,
              firstName: member.firstName,
              lastName: member.lastName,
              gender: member.gender,
              photoUrl: member.profilePicture || '',
              isAlive: member.isAlive,
              dateOfBirth: new Date(member.dateOfBirth),
              placeOfBirth: member.placeOfBirth || '',
              currentLocation: member.address || '',
              occupation: member.occupation || '',
              hobbies: [],
              spouseId: member.spouseId,
              parentIds: [
                ...(member.fatherId ? [member.fatherId] : []),
                ...(member.motherId ? [member.motherId] : [])
              ],
              childrenIds: members
                .filter(m => m.fatherId === member.id || m.motherId === member.id)
                .map(m => m.id)
            },
            isHighlighted: member.id === session?.user?.id,
          },
        });
      }
    });

    // Create edges for relationships
    members.forEach(member => {
      // Parent-child relationships (blue)
      if (member.fatherId) {
        edges.push({
          id: `${member.fatherId}-${member.id}`,
          source: member.fatherId,
          target: member.id,
          type: 'smoothstep',
          label: 'Father',
          className: 'parent-child',
        });
      }
      if (member.motherId) {
        edges.push({
          id: `${member.motherId}-${member.id}`,
          source: member.motherId,
          target: member.id,
          type: 'smoothstep',
          label: 'Mother',
          className: 'parent-child',
        });
      }

      // Spouse relationship (green)
      if (member.spouseId) {
        edges.push({
          id: `${member.id}-${member.spouseId}`,
          source: member.id,
          target: member.spouseId,
          type: 'smoothstep',
          label: 'Spouse',
          className: 'spouse',
        });
      }

      // Sibling relationships (orange)
      const siblings = members.filter(m => 
        (m.fatherId === member.fatherId || m.motherId === member.motherId) && 
        m.id !== member.id
      );
      siblings.forEach(sibling => {
        if (member.id < sibling.id) { // Only create edge once per sibling pair
          edges.push({
            id: `${member.id}-${sibling.id}`,
            source: member.id,
            target: sibling.id,
            type: 'smoothstep',
            label: 'Sibling',
            className: 'sibling',
          });
        }
      });
    });

    return { nodes, edges };
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const response = await fetch('/api/family-members');
        if (!response.ok) throw new Error('Failed to fetch family members');
        
        const members = await response.json();
        console.log('Fetched members:', members);
        const { nodes, edges } = transformFamilyData(members);
        
        setNodes(nodes);
        setEdges(edges);
      } catch (error) {
        console.error('Error fetching family members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [transformFamilyData, setNodes, setEdges]);

  const onNodeClickHandler = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick && node.data?.member) {
        onNodeClick(node.data.member);
      }
    },
    [onNodeClick]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
} 