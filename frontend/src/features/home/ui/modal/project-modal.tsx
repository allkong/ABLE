import { useState, useEffect } from 'react';

import * as S from '@features/home/ui/modal/project-modal.style';
import { useProjectStore } from '@entities/project/model/project.model';

import Modal from '@shared/ui/modal/modal';
import Input from '@shared/ui/input/input';
import DropDown from '@shared/ui/dropdown/dropdown';

interface ProjectModalProps {
  onClose: () => void;
  isClosing: boolean;
  onAnimationEnd: () => void;
  type: 'create' | 'modify';
}
interface Option {
  value: string;
  label: string;
}

const ProjectModal = ({ onClose, isClosing, onAnimationEnd, type }: ProjectModalProps) => {
  const isReadOnly = type === 'modify';
  const { currentProject } = useProjectStore();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState(currentProject?.title || '');
  const [projectDescription, setProjectDescription] = useState(currentProject?.description || '');
  const [pythonKernelPath, setPythonKernelPath] = useState(currentProject?.pythonKernelPath || '');

  const options = [
    { value: 'string', label: 'string' },
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4' },
    { value: 'option5', label: 'Option 5' },
  ];

  useEffect(() => {
    if (isReadOnly && currentProject) {
      setProjectTitle(currentProject.title || '');
      setProjectDescription(currentProject.description || '');
    } else {
      // isReadOnly가 false일 때는 빈 문자열로 초기화
      setProjectTitle('');
      setProjectDescription('');
    }
  }, [isReadOnly, currentProject]);

  const defaultOption = options.find((option) => option.label === currentProject?.cudaVersion) || null;

  const handleSelect = (option: Option) => {
    setSelectedOption(option.label); // 선택된 옵션을 저장
    console.log('선택된 옵션:', option);
  };

  return (
    <Modal
      onClose={onClose}
      isClosing={isClosing}
      onAnimationEnd={onAnimationEnd}
      title="프로젝트 정보를 입력하세요"
      confirmText={isReadOnly ? '수정' : '확인'}
    >
      <Input
        label="프로젝트 이름"
        value={projectTitle}
        placeholder={isReadOnly ? '' : '2-50자 이내로 입력해주세요.'}
        onChange={(e) => setProjectTitle(e.target.value)}
      />
      <Input
        label="프로젝트 설명 (선택)"
        value={projectDescription}
        placeholder={isReadOnly ? '' : '2-50자 이내로 입력해주세요.'}
        onChange={(e) => setProjectDescription(e.target.value)}
      />
      <Input
        label="파이썬 커널 경로"
        defaultValue={isReadOnly ? currentProject?.pythonKernelPath : ''}
        readOnly={isReadOnly}
        className={isReadOnly ? 'readonly' : ''}
        placeholder=".exe"
        onChange={(e) => setPythonKernelPath(e.target.value)}
      />
      <DropDown
        label="쿠다 버전"
        options={options}
        onSelect={handleSelect}
        defaultValue={isReadOnly ? defaultOption : ''}
      />
    </Modal>
  );
};

export default ProjectModal;
