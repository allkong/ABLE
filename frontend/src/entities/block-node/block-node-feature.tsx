import { Handle, Position } from '@xyflow/react';
import React, { useMemo } from 'react';

import * as S from '@entities/block-node/block-node.style';
import Common from '@shared/styles/common';
import { blockColors } from '@shared/constants/block';
import { capitalizeFirstLetter } from '@shared/utils/formatters.util';
import { BlockItem } from '@/features/canvas/types/block.type';
import { useImageStore } from '@entities/train/model/train.model';

import UploadImageIcon from '@icons/uploadImage.svg?react';

interface BlockNodeFeatureProps {
  data: {
    block: BlockItem;
    onFieldChange: (fieldName: string, value: string) => void;
    featureMap?: string;
  };
  sourcePosition?: Position;
  targetPosition?: Position;
}

const BlockNodeFeature = ({
  data,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
}: BlockNodeFeatureProps) => {
  const { uploadedImage, setUploadedImage, heatMapImage, classScores, lastConv2dId } = useImageStore();

  const blockColor = useMemo(
    () => (data?.block?.type ? blockColors[data.block.type] : Common.colors.gray200),
    [data?.block?.type]
  );

  const blockImage = useMemo(
    () => (data.featureMap ? `data:image/jpeg;base64,${data.featureMap}` : null),
    [data.featureMap]
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const displayUploadedImage = useMemo(() => {
    return uploadedImage && !uploadedImage.startsWith('data:image/jpeg;base64,')
      ? `data:image/jpeg;base64,${uploadedImage}`
      : uploadedImage;
  }, [uploadedImage]);

  const handleClickUpload = () => {
    document.getElementById('fileUpload')?.click();
  };

  return (
    <S.Container blockColor={blockColor} isConnected isSelected={false}>
      <Handle type="target" position={targetPosition} />
      <S.Label>{capitalizeFirstLetter(data?.block?.name || 'Unknown')}</S.Label>
      <S.FieldWrapper>
        {data.block.type === 'data' ? (
          <>
            {displayUploadedImage ? (
              <S.Image
                src={displayUploadedImage}
                alt={data.block.name}
                onClick={handleClickUpload}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <S.CustomUploadContainer onClick={handleClickUpload}>
                <UploadImageIcon width={28} height={28} />
                <span>Drag files to upload</span>
              </S.CustomUploadContainer>
            )}
            <S.HiddenInput type="file" id="fileUpload" accept="image/jpeg" onChange={handleImageUpload} />
          </>
        ) : data.block.id === lastConv2dId && heatMapImage ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <S.Image src={`data:image/jpeg;base64,${heatMapImage}`} alt={data.block.name} />
            <div style={{ marginLeft: '1rem', display: 'flex', flexDirection: 'column' }}>
              {classScores.map((score, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>{score.class_name}</span>
                  <div style={{ backgroundColor: '#ccc', width: '50px', height: '8px', position: 'relative' }}>
                    <div
                      style={{
                        backgroundColor: '#4A90E2',
                        width: `${score.classScore}%`,
                        height: '100%',
                      }}
                    />
                  </div>
                  <span style={{ marginLeft: '0.5rem' }}>{score.classScore}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          blockImage && <S.Image src={blockImage} alt={data.block.name} />
        )}
      </S.FieldWrapper>
      <Handle type="source" position={sourcePosition} />
    </S.Container>
  );
};

export default BlockNodeFeature;
