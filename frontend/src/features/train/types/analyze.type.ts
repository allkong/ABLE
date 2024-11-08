export interface FeatureMapProps {
  projectName: string;
  resultName: string;
  epochName: string;
  blockIds: string;
}

export interface EpochResponse {
  epochs: string[];
  hasNext: boolean;
}

export interface FeatureMapResponse {
  image: string;
  classScores: ClassScore[];
}

export interface CreateFeatureMapProps {
  projectName: string;
  resultName: string;
  epochName: string;
  deviceIndex: number;
  image: string | null;
}

export interface HeatMapResponse {
  originalImg: string;
  heatMapImg: string;
  classScores: ClassScore[];
}

export interface ClassScore {
  className: string;
  classScore: number;
}

export interface ImageStore {
  uploadedImage: string | null;
  heatMapImage: string | null;
  classScores: ClassScore[];
  lastConv2dId: string;

  setUploadedImage: (image: string | null) => void;
  setLastConv2dId: (id: string) => void;
  setHeatMapImage: (data: { heatMapImage: string; classScores: ClassScore[] }) => void;
  setAllImage: (data: { uploadedImage: string; heatMapImage: string; classScores: ClassScore[] }) => void;
}
