import { useNavigate } from 'react-router-dom';

import { HistoryItem } from '@features/home/types/home.type';
import { useProjectNameStore } from '@entities/project/model/project.model';

import { HistoryListWrapper, HistoryRow, HistoryCell, StatusText } from '@/features/home/ui/content/history-list.style';

interface HistoryListProps {
  trainSummaries: HistoryItem[];
}

const HistoryList = ({ trainSummaries }: HistoryListProps) => {
  const navigate = useNavigate();
  const { setResultName } = useProjectNameStore();

  const handleHistoryClick = (result: string) => {
    setResultName(result);
    navigate('/train');
  };

  return (
    <HistoryListWrapper>
      <thead>
        <tr>
          <HistoryCell as="th" width="10%">
            번호
          </HistoryCell>
          <HistoryCell as="th" width="40%">
            학습일
          </HistoryCell>
          <HistoryCell as="th" width="20%">
            정확도
          </HistoryCell>
          <HistoryCell as="th" width="20%">
            상태
          </HistoryCell>
        </tr>
      </thead>
      <tbody>
        {trainSummaries.map((item, index) => (
          <HistoryRow key={item.index} onClick={() => handleHistoryClick(item.originDirName)}>
            <HistoryCell width='10%'>{item.index}</HistoryCell>
            <HistoryCell width='40%'>{item.date}</HistoryCell>
            <HistoryCell width='20%'>{item.accuracy}</HistoryCell>
            <HistoryCell width='20%'>
              <StatusText status={item.status}>{item.status}</StatusText>
            </HistoryCell>
          </HistoryRow>
        ))}
      </tbody>
    </HistoryListWrapper>
  );
};

export default HistoryList;
