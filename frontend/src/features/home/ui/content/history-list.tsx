import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { HistoryItem } from '@features/home/types/home.type';
import { useProjectNameStore } from '@entities/project/model/project.model';

import { HistoryListWrapper, HistoryRow, HistoryCell, StatusText } from '@/features/home/ui/content/history-list.style';

interface HistoryListProps {
  trainSummaries: HistoryItem[];
}

const HistoryList = ({ trainSummaries }: HistoryListProps) => {
  const navigate = useNavigate();
  const { setResultName } = useProjectNameStore();

  const handleHistoryClick = (result: string, status: string) => {
    if (status === "완료") {
      setResultName(result);
      navigate('/train');
    } else {
      toast.error("빌드에 실패한 모델입니다.");
    }
  };

  return (
    <HistoryListWrapper>
      <thead>
        <tr>
          <HistoryCell as="th" width="10%">번호</HistoryCell>
          <HistoryCell as="th" width="40%">학습일</HistoryCell>
          <HistoryCell as="th" width="20%">정확도</HistoryCell>
          <HistoryCell as="th" width="20%">상태</HistoryCell>
        </tr>
      </thead>
      <tbody>
        {trainSummaries.length === 0 ? (
          <HistoryRow>
            <HistoryCell colSpan={4} style={{ height: '15.6rem', textAlign: 'center', verticalAlign: 'middle' }}>
              데이터가 없습니다
            </HistoryCell>
          </HistoryRow>
        ) : (
          Array.from({ length: 5 }).map((_, index) => (
            trainSummaries[index] ? (
              <HistoryRow key={trainSummaries[index].index} onClick={() => handleHistoryClick(trainSummaries[index].originDirName, trainSummaries[index].status)}>
                <HistoryCell width="10%">{trainSummaries[index].index}</HistoryCell>
                <HistoryCell width="40%">{trainSummaries[index].date}</HistoryCell>
                <HistoryCell width="20%">{trainSummaries[index].accuracy}</HistoryCell>
                <HistoryCell width="20%">
                  <StatusText status={trainSummaries[index].status}>{trainSummaries[index].status}</StatusText>
                </HistoryCell>
              </HistoryRow>
            ) : (
              <HistoryRow key={`empty-${index}`} style={{ height: '2.6rem', borderTop: 'none' }}>
                <HistoryCell width="10%"></HistoryCell>
                <HistoryCell width="40%"></HistoryCell>
                <HistoryCell width="20%"></HistoryCell>
                <HistoryCell width="20%"></HistoryCell>
              </HistoryRow>
            )
          ))
        )}
      </tbody>
    </HistoryListWrapper>
  );
};

export default HistoryList;
