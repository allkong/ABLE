import styled from '@emotion/styled';
import Common from '@/shared/styles/common';

export const Container = styled.div<{ blockColor: string; isConnected: boolean; isSelected: boolean }>`
  width: 15.625rem;
  border-radius: 0.25rem;
  background-color: ${({ blockColor }) => blockColor};
  border: 0.0625rem solid ${({ blockColor }) => blockColor};
  overflow: hidden;
  opacity: ${({ isConnected, isSelected }) => (isSelected || isConnected ? 1 : 0.3)};
  box-shadow: ${({ isSelected, blockColor }) => (isSelected ? `0 0 0.4rem ${blockColor}` : '')};
`;

export const Label = styled.div`
  width: 100%;
  padding: 0.625rem 0.75rem;

  font-size: ${Common.fontSizes.sm};
  font-weight: ${Common.fontWeights.semiBold};
  color: ${Common.colors.white};
`;

export const FieldWrapper = styled.div`
  background-color: ${Common.colors.white};
`;

export const InputWrapper = styled.div<{ blockColor: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.75rem;
  border-bottom: 0.0625rem solid ${({ blockColor }) => blockColor};

  &:last-of-type {
    border-bottom: none; /* 마지막 필드에는 선 없음 */
  }
`;

export const Name = styled.label`
  font-size: ${Common.fontSizes.xs};
`;

export const Input = styled.input<{ required: boolean }>`
  width: 40%;
  height: 1.5rem;
  padding: 0 0.5rem;

  font-size: ${Common.fontSizes.xs};
  color: ${Common.colors.gray500};
  text-align: end;

  border: 1px solid ${Common.colors.gray200};
  border-radius: 0.1rem;
  outline: none;

  ::placeholder {
    color: ${Common.colors.gray200};
  }
`;

export const Image = styled.img`
  width: 100%;
  max-height: 9.375rem;
  object-fit: contain;
`;

export const CustomUploadContainer = styled.div`
  border: none;
  padding: 1.5625rem;
  min-height: 9.375rem;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s ease;
  color: #666666;

  &:hover {
    border-color: #666666;
  }
`;

export const HiddenInput = styled.input`
  display: none;
`;
