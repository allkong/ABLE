import { Node as XYFlowNode, Edge as XYFlowEdge } from '@xyflow/react';

import { DATA_BLOCK_ID } from '@features/canvas/costants/block.constant';

export const initialNodes: XYFlowNode[] = [
  {
    id: DATA_BLOCK_ID,
    type: 'custom',
    position: { x: 50, y: 50 },
    data: {
      block: {
        type: 'data',
        name: 'data',
        fields: [
          { name: 'data_path', isRequired: true },
          { name: 'input_shape', isRequired: true },
        ],
      },
    },
  },
];

export const initialEdges: XYFlowEdge[] = [];
