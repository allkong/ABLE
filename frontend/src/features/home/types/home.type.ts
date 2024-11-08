export interface HistoryItem {
  index: number;
  originDirName: string;
  date: string;
  accuracy: string;
  status: string;
}
export interface HistoryResponse {
  totalTrainLogs: number;
  trainSummaries: HistoryItem[];
}
export interface Project {
  title: string;
  description: string;
  cudaVersion: string;
  pythonKernelPath: string;
  thumbnail: string;
}

export interface ProjectStore {
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  resetProject: () => void;
}
