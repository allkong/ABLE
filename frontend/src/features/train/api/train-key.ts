const trainKey = {
  default: ['train'],
  list: (projectName: string, resultName: string, index: number, size: number) => [
    ...trainKey.default,
    'list',
    projectName,
    resultName,
    index,
    size,
  ],
  model: (projectName: string, resultName: string) => [...trainKey.default, 'model', projectName, resultName],
  featureMap: (projectName: string, resultName: string, epochName: string, deviceIndex: number) => [
    ...trainKey.default,
    'featureMap',
    projectName,
    resultName,
    epochName,
    deviceIndex,
  ],
  heatMap: (projectName: string, resultName: string, epochName: string) => [
    ...trainKey.default,
    'heatMap',
    projectName,
    resultName,
    epochName,
  ],
  select: (projectName: string, resultName: string, epochName: string, blockIds: string) => [
    ...trainKey.default,
    'select',
    projectName,
    resultName,
    epochName,
    blockIds,
  ],
};

export default trainKey;
