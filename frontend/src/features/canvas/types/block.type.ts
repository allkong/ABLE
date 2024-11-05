import { Response } from '@shared/types/response.type';
import { BLOCK_MENU } from '@features/canvas/costants/block-types.constant';

export type BlockType = (typeof BLOCK_MENU)[number]['name'] | 'data';

// 블록 노드의 정보를 전달하는 Item
export interface BlockItem {
  type: BlockType;
  name: string;
  fields: BlockField[];
}

export interface BlockField {
  name: string;
  value: string;
  isRequired: boolean;
}

export interface Block {
  name: string;
  type: BlockType;
  args: BlockField[];
}

export interface BlocksResponse extends Response {
  data: { blocks: Block[] };
}
