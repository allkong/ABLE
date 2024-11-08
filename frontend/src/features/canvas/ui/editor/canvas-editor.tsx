import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getOutgoers,
  type OnConnect,
  type Node as XYFlowNode,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import * as S from '@features/canvas/ui/editor/canvas-editor.style';
import Common from '@shared/styles/common';
import { DATA_BLOCK_ID } from '@features/canvas/costants/block.constant';
import { initialNodes, initialEdges } from '@features/canvas/model/initial-data';
import { TOAST_MESSAGE } from '@features/canvas/costants/message.constant';
import type { BlockItem } from '@features/canvas/types/block.type';
import type { TrainConfig, TrainRequest } from '@features/canvas/types/train.type';
import {
  transformCanvasResponse,
  transformEdgesToEdgeSchema,
  transformNodesToBlockSchema,
} from '@features/canvas/utils/canvas-transformer.util';
import { isValidConnection } from '@features/canvas/utils/cycle-validator.util';
import { useProjectNameStore } from '@/entities/project/model/project.model';
import { useFetchCanvas } from '@features/canvas/api/use-canvas.query';
import { useSaveCanvas } from '@features/canvas/api/use-canvas.mutation';
import { useStartTrain } from '@features/canvas/api/use-train.mutation';
import { useNodeDropHandler } from '@features/canvas/model/use-node-drop-handler.model';
import { useNodeChangeHandler } from '@features/canvas/model/use-node-change-handler.modle';
import { useEdgeChangeHandler } from '@features/canvas/model/use-edge-change-handler.model';

import BlockNode from '@entities/block-node/block-node';
import BasicButton from '@shared/ui/button/basic-button';
import PlayIcon from '@icons/play.svg?react';
import SaveIcon from '@icons/save.svg?react';
import TrainModal from '@features/canvas/ui/modal/train-modal';

const CanvasEditor = () => {
  const { projectName } = useProjectNameStore();
  const { data } = useFetchCanvas(projectName || '');
  const { mutateAsync: saveCanvas } = useSaveCanvas();
  const { mutate: startTrain } = useStartTrain();

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<XYFlowNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { handleNodesChange } = useNodeChangeHandler({
    nodes,
    setNodes,
    selectedNode,
    setSelectedNode,
  });
  const { handleEdgesChange } = useEdgeChangeHandler({
    edges,
    setEdges,
    nodes,
    selectedNode,
  });

  const { screenToFlowPosition } = useReactFlow();
  const { dropRef } = useNodeDropHandler({ setNodes, screenToFlowPosition });

  // 백엔드에서 캔버스 정보를 받아오면 노드와 엣지 상태를 업데이트
  useEffect(() => {
    if (data) {
      const transformedData = transformCanvasResponse(data);
      setNodes(transformedData.nodes);
      setEdges(transformedData.edges);
    }
  }, [data, setNodes, setEdges]);

  // 노드를 연결할 때 호출
  const onConnect: OnConnect = (connection) => {
    if (!isValidConnection(nodes, edges)(connection)) {
      toast.error(TOAST_MESSAGE.cycle);
      return;
    }

    // 사이클이 발생하지 않으면 엣지 추가
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, width: 30, height: 30 },
        },
        eds
      )
    );
  };

  // 특정 노드의 블록 필드 변경
  const handleFieldChange = useCallback(
    (nodeId: string, fieldName: string, value: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  block: {
                    ...(node.data.block as BlockItem),
                    fields: (node.data.block as BlockItem).fields.map((field) =>
                      field.name === fieldName ? { ...field, value } : field
                    ),
                  },
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleRunButtonClick = () => {
    if (!isDataBlockConnected()) {
      toast.error(TOAST_MESSAGE.data);
      return;
    }
    setIsModalOpen(true);
  };

  const isDataBlockConnected = () => {
    const dataBlock = nodes.find((node) => (node.data.block as BlockItem).name === 'data');
    if (!dataBlock) return false;

    return edges.some((edge) => edge.source === dataBlock.id || edge.target === dataBlock.id);
  };

  // 데이터 블록이거나 그 자식인지 확인
  const getDataBlockDescendants = (dataBlockId: string): Set<string> => {
    const visited = new Set<string>([dataBlockId]);

    // 데이터 블록의 모든 자식 노드를 탐색하는 재귀 함수
    const traverse = (currentId: string) => {
      const currentNode = nodes.find((node) => node.id === currentId);
      if (!currentNode) return;

      const outgoers = getOutgoers(currentNode, nodes, edges);
      outgoers.forEach((outgoer) => {
        if (!visited.has(outgoer.id)) {
          visited.add(outgoer.id);
          traverse(outgoer.id);
        }
      });
    };

    traverse(dataBlockId);
    return visited;
  };

  const getConnectedStatus = (nodeId: string) => {
    const dataDescendants = getDataBlockDescendants(DATA_BLOCK_ID);
    return dataDescendants.has(nodeId);
  };

  const handleTrain = (trainConfig: TrainConfig) => {
    const transformedBlocks = transformNodesToBlockSchema(nodes);
    const transformedEdges = transformEdgesToEdgeSchema(edges);

    const trainRequest: TrainRequest = {
      projectName: projectName || '',
      epoch: trainConfig.epoch ?? 0,
      batchSize: trainConfig.batchSize ?? 0,
      device: trainConfig.device,
      canvas: { blocks: transformedBlocks, edges: transformedEdges },
    };

    startTrain(trainRequest);
  };

  const handleSavaButtonClick = async () => {
    const transformedBlocks = transformNodesToBlockSchema(nodes);
    const transformedEdges = transformEdgesToEdgeSchema(edges);

    toast.promise(
      saveCanvas({
        projectName: projectName || '',
        canvas: { blocks: transformedBlocks, edges: transformedEdges },
      }),
      {
        loading: TOAST_MESSAGE.loading,
        success: TOAST_MESSAGE.success,
        error: TOAST_MESSAGE.error,
      }
    );
  };

  return (
    <>
      {isModalOpen && <TrainModal onClose={handleModalClose} onSubmit={handleTrain} />}
      <S.Canvas ref={dropRef}>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              onFieldChange: (fieldName: string, value: string) => handleFieldChange(node.id, fieldName, value),
              isConnected: getConnectedStatus(node.id),
              isSelected: node.id === selectedNode?.id,
            },
          }))}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={{ custom: BlockNode }}
        >
          <Controls position="bottom-center" orientation="horizontal" />
          <Background variant={BackgroundVariant.Dots} />
        </ReactFlow>
        <S.OverlayButton>
          <BasicButton
            text="실행"
            icon={<PlayIcon width={13} height={16} />}
            width="5.5rem"
            onClick={handleRunButtonClick}
          />
          <BasicButton
            text="저장"
            color={Common.colors.primary}
            backgroundColor={Common.colors.secondary}
            icon={<SaveIcon />}
            width="5.5rem"
            onClick={handleSavaButtonClick}
          />
        </S.OverlayButton>
      </S.Canvas>
    </>
  );
};

export default CanvasEditor;
