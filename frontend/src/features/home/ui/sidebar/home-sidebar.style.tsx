import styled from '@emotion/styled';

import Common from '@shared/styles/common';
import { scrollbarHiddenMixin } from '@shared/styles/mixins.style';

export const SidebarContainer = styled.div`
  width: 15.625rem;
  height: 100%;
  background-color: #f8f9fc;
  padding: 1.25rem 1rem;
  border-right: 0.0625rem solid #ddd;
  display: flex;
  flex-direction: column;
`;

export const Title = styled.h2`
  font-size: ${Common.fontSizes['2xl']};
  font-weight: ${Common.fontWeights.medium};
  margin-bottom: 0.25rem;
`;

export const Subtitle = styled.p`
  font-size: ${Common.fontSizes.xs};
  color: #6c757d;
  margin-bottom: 1rem;
`;

export const Button = styled.button`
  display: block;
  width: 100%;
  padding: 0.625rem;
  background-color: #e7f3ff;
  border: none;
  border-radius: 0.5rem;
  color: #007bff;
  font-weight: bold;
  text-align: left;
  margin-bottom: 1rem;
  cursor: pointer;
`;

export const FolderSection = styled.div`
  margin: 1rem 0;
  flex: 1;
  overflow: auto;
  ${scrollbarHiddenMixin}
`;

export const Folder = styled.div<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  color: #343a40;
  margin-bottom: 0.5rem;
  cursor: pointer;
  gap: 0.625rem;
  width: 100%;
  padding: 0.6875rem 1.25rem;
  font-size: ${Common.fontSizes.sm};
  border-radius: 0.375rem;
  background-color: ${(props) => (props.isSelected ? Common.colors.gray100 : 'transparent')};
  transition-property: background-color;
  transition-duration: 0.6s;

  &:hover {
    background-color: ${Common.colors.gray100};
  }
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  background-color: #eaeeff;
  border-radius: 0.5rem;
  padding: 0.625rem;
  margin-top: auto;
  gap: 0.9375rem;
  min-height: 6.25rem;
  transition-duration: 0.6s;
  cursor: pointer;

  &:hover {
    filter: brightness(0.9) saturate(2);
  }
`;

export const RocketCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ced0ff;
  border-radius: 50%;
  width: 60px;
  height: 60px;
`;

export const FooterIcon = styled.span`
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FooterText = styled.div`
  font-size: ${Common.fontSizes.xl};
  font-weight: bold;
  color: #343a40;
`;

export const FooterStatus = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;
