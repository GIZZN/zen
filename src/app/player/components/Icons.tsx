import React from 'react';
import { ICONS } from '../constants/playerConstants';

interface IconProps {
  width?: number;
  height?: number;
  fill?: string;
  className?: string;
}

// Базовый компонент для SVG иконок
const SvgIcon: React.FC<IconProps & { path: string }> = ({ 
  width = 16, 
  height = 16, 
  fill = "currentColor", 
  className = "",
  path 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill={fill} 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={path} />
  </svg>
);

// Компоненты иконок
export const PlayIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.PLAY} />
);

export const PauseIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.PAUSE} />
);

export const PreviousIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.PREVIOUS} />
);

export const NextIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.NEXT} />
);

export const RepeatIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.REPEAT} />
);

export const AddIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.ADD} />
);

export const CloseIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.CLOSE} />
);

export const DeleteIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.DELETE} />
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.CHECK} />
);

export const StarIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.STAR} />
);

export const MenuIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.MENU} />
);

export const CopyIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.COPY} />
);

export const ShareIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.SHARE} />
);

export const VolumeIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.VOLUME} />
);

export const VolumeMutedIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.VOLUME_MUTED} />
);

export const LyricsIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.LYRICS} />
);

export const DragHandleIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.DRAG_HANDLE} />
);

export const DragLinesIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.DRAG_LINES} />
);

export const ArrowDownIcon: React.FC<IconProps> = (props) => (
  <SvgIcon {...props} path={ICONS.ARROW_DOWN} />
);

// Компонент для воспроизведения/паузы с автоматическим переключением
export const PlayPauseIcon: React.FC<IconProps & { isPlaying: boolean }> = ({ 
  isPlaying, 
  ...props 
}) => {
  return isPlaying ? <PauseIcon {...props} /> : <PlayIcon {...props} />;
};

// Компонент для громкости с автоматическим переключением
export const VolumeToggleIcon: React.FC<IconProps & { isMuted: boolean }> = ({ 
  isMuted, 
  ...props 
}) => {
  return isMuted ? <VolumeMutedIcon {...props} /> : <VolumeIcon {...props} />;
};

// Компонент для добавления/удаления с автоматическим переключением
export const AddRemoveIcon: React.FC<IconProps & { isAdded: boolean }> = ({ 
  isAdded, 
  ...props 
}) => {
  return isAdded ? <CheckIcon {...props} /> : <AddIcon {...props} />;
};
