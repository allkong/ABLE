import { useEffect, useState, useCallback } from 'react';
import {
   ReactFlow,
   MarkerType,
   useReactFlow,
   useNodesState,
   useEdgesState,
   ReactFlowProvider,
   Background,
   BackgroundVariant,
   type Node as XYFlowNode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import toast from 'react-hot-toast';

import BlockNodeFeature from '@entities/block-node/block-node-feature';
import useAutoLayout, { type LayoutOptions } from '@features/train/model/use-auto-layout.model';
import { useHeatMap, useModel } from '@features/train/api/use-analyze.query';
import { useProjectNameStore } from '@entities/project/model/project.model';
import { useImageStore } from '@entities/train/model/train.model';
import { useFetchFeatureMap, useCreateFeatureMap } from '@features/train/api/use-analyze.mutation';
import { useFeatureNodeChangeHandler } from '@features/canvas/model/use-node-change-handler.modle';
import {
   initialNodes,
   initialEdges,
} from '@/features/canvas/model/initial-data';

import { PositionedButton } from '@features/train/ui/analyze/canvas-result.style'
import BasicButton from '@shared/ui/button/basic-button'
import PlayIcon from '@icons/play.svg?react'

const proOptions = {
   account: 'paid-pro',
   hideAttribution: true,
};

const defaultEdgeOptions = {
   type: 'smoothstep',
   markerEnd: { type: MarkerType.ArrowClosed },
   pathOptions: { offset: 15 },
   animated: true,
};

const CanvasResult = () => {
   const [nodes, setNodes] = useNodesState(initialNodes);
   const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
   const [direction, setDirection] = useState<LayoutOptions['direction']>('TB');
   const [selectedNode, setSelectedNode] = useState<XYFlowNode | null>(null);
   const { fitView } = useReactFlow();

   const { projectName, resultName, epochName } = useProjectNameStore();
   const { uploadedImage, heatMapImage, classScores, lastConv2dId, setLastConv2dId, setHeatMapImage, setAllImage } = useImageStore();
   const [autoFit, setAutoFit] = useState(false);
   const [hasSetInitialImages, setHasSetInitialImages] = useState(false);

   const { data: canvas } = useModel(projectName, resultName);
   const { data: heatMap } = useHeatMap(projectName, resultName, epochName);
   const { mutate: fetchCreateModel } = useCreateFeatureMap();
   const { mutate: fetchFeatureMap } = useFetchFeatureMap();

   const { handleNodesChange } = useFeatureNodeChangeHandler({
      nodes,
      setNodes,
      selectedNode,
      setSelectedNode,
   });

   useAutoLayout({ direction });

   const handleCreateModel = () => {

      fetchCreateModel(
         {
            projectName,
            resultName,
            epochName,
            deviceIndex: -1,
            image: uploadedImage,
         },
         {
            onSuccess: (data) => {
               setHeatMapImage({
                  heatMapImage: data.image,
                  classScores: data.classScores,
               });
               toast.success("추론에 성공했습니다.");
            },
            onError: () => {
               toast.error("추론에 실패했습니다.");
            }
         }
      );
   };

   const handleNodeClick = (blockId: string) => {
      setAutoFit(false);
      if (blockId == "0") {
         return;
      }
      fetchFeatureMap(
         {
            projectName,
            resultName,
            epochName,
            blockIds: blockId,
         },
         {
            onSuccess: (data) => {
               handleFieldChange(blockId, data);
            },
         }
      );
   };

   const handleFieldChange = useCallback(
      (nodeId: string, image: string) => {
         setNodes((nds) =>
            nds.map((node) =>
               node.id === nodeId
                  ? {
                     ...node,
                     data: {
                        ...node.data,
                        featureMap: image,
                     },
                  }
                  : node
            )
         );
      },
      [setNodes]
   );

   const handleLayoutChange = (newDirection) => {
      setAutoFit(true);
      setDirection(newDirection);
   };

   useEffect(() => {
      if (canvas) {
         const { blocks, edges } = canvas.canvas;

         const newNodes = blocks.map((block) => {
            if (block.name === 'Conv2d') {
               setLastConv2dId(block.id);
            }
            return {
               id: block.id,
               type: 'custom',
               position: { x: 0, y: 0 },
               data: { block, featureMap: '' },
            };
         });

         const newEdges = edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            ...defaultEdgeOptions,
         }));

         setNodes(newNodes);
         setEdges(newEdges);
      }
   }, [canvas, setNodes, setEdges]);

   useEffect(() => {
      if (heatMap && nodes.length > 0 && !hasSetInitialImages) {
         const firstNodeId = nodes[0].id;

         setAllImage({
            uploadedImage: heatMap.originalImg,
            heatMapImage: heatMap.heatMapImg,
            classScores: heatMap.classScores,
         });

         console.log(lastConv2dId);
         handleFieldChange(firstNodeId, heatMap.originalImg);
         handleFieldChange(lastConv2dId, heatMap.heatMapImg);

         // 최초 설정이 완료되었음을 표시하여 재실행 방지
         setHasSetInitialImages(true);
      }
   }, [heatMap, nodes, hasSetInitialImages, lastConv2dId, setAllImage, handleFieldChange]);

   useEffect(() => {
      if (autoFit) {
         fitView();
      }
   }, [fitView, direction, nodes, autoFit]);

   return (
      <ReactFlow
         nodes={nodes.map((node) => ({
            ...node,
            data: {
               ...node.data,
               onFieldChange: (img: string) => handleFieldChange(node.id, img),
            },
         }))}
         edges={edges}
         onNodesChange={handleNodesChange}
         onEdgesChange={onEdgesChange}
         onNodeClick={(_, node) => {
            setSelectedNode(node);
            handleNodeClick(node.id);
         }}
         nodesDraggable={false}
         nodesConnectable={false}
         fitView
         attributionPosition="bottom-left"
         nodeTypes={{ custom: BlockNodeFeature }}
         proOptions={proOptions}
         zoomOnDoubleClick={false}
      >
         <Background variant={BackgroundVariant.Dots} />
         <PositionedButton>
            <BasicButton
               text="추론하기"
               icon={<PlayIcon width={13} height={15} />}
               width='10rem'
               onClick={handleCreateModel}
            />
         </PositionedButton>
         <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
            <button onClick={() => handleLayoutChange('TB')}>Down (TB)</button>
            <button onClick={() => handleLayoutChange('LR')}>Right (LR)</button>
         </div>
      </ReactFlow>
   );
};

const WrappedCanvasResult = () => (
   <ReactFlowProvider>
      <CanvasResult />
   </ReactFlowProvider>
);

export default WrappedCanvasResult;
