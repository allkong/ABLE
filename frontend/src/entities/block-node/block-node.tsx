import { Handle, Position } from '@xyflow/react';
import { useMemo } from 'react';

import * as S from '@entities/block-node/block-node.style';
import Common from '@shared/styles/common';
import { blockColors } from '@shared/constants/block';
import { capitalizeFirstLetter } from '@/shared/utils/formatters.util';
import { BlockItem } from '@/features/canvas/types/block.type';

interface BlockNodeProps {
  data: {
    block: BlockItem;
    onFieldChange: (fieldName: string, value: string) => void;
    isConnected?: boolean;
    isSelected?: boolean;
  };
  sourcePosition?: Position;
  targetPosition?: Position;
}

const BlockNode = ({
  data: { block, onFieldChange, isConnected = false, isSelected = false },
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
}: BlockNodeProps) => {
  const blockColor = useMemo(() => (block?.type ? blockColors[block.type] : Common.colors.gray200), [block.type]);

  return (
    <S.Container blockColor={blockColor} isConnected={isConnected} isSelected={isSelected}>
      <Handle type="target" position={targetPosition} />
      <S.Label>{capitalizeFirstLetter(block?.name || 'Unknown')}</S.Label>
      <S.FieldWrapper>
        {block?.fields?.map((field) => (
          <S.InputWrapper key={field.name} blockColor={blockColor}>
            <S.Name>
              {field.name} {field.isRequired ? '*' : ''}
            </S.Name>
            <S.Input
              type="text"
              placeholder={field.isRequired ? 'required' : ''}
              required={field.isRequired}
              value={field.value || ''}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
            />
          </S.InputWrapper>
        ))}
      </S.FieldWrapper>
      <Handle type="source" position={sourcePosition} />
    </S.Container>
  );
};

export default BlockNode;
