import React, { useState } from 'react';

interface FolderProps {
  color?: string;
  size?: number;
  items?: React.ReactNode[];
  hidePapers?: boolean;
  className?: string;
  activeIndex?: number;
  open?: boolean;
}

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const Folder: React.FC<FolderProps> = ({ 
  color = '#5227FF', 
  size = 1, 
  items = [], 
  hidePapers = false, 
  className = '',
  activeIndex = 0,
  open = false
}) => {
  const maxItems = items.length > 0 ? items.length : 5;
  const papers = items;
  
  const [paperOffsets, setPaperOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 }))
  );

  const folderBackColor = darkenColor(color, 0.08);
  const paperColors = [
    '#181818',
    '#1f1f1f',
    '#141414',
    '#2c0d0d',
    '#0c0c0c'
  ];

  const handlePaperMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets(prev => {
      const newOffsets = [...prev];
      if (index < newOffsets.length) {
        newOffsets[index] = { x: offsetX, y: offsetY };
      }
      return newOffsets;
    });
  };

  const handlePaperMouseLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    setPaperOffsets(prev => {
      const newOffsets = [...prev];
      if (index < newOffsets.length) {
        newOffsets[index] = { x: 0, y: 0 };
      }
      return newOffsets;
    });
  };

  const folderStyle: React.CSSProperties = {
    '--folder-color': color,
    '--folder-back-color': folderBackColor,
  } as React.CSSProperties;

  const scaleStyle = { transform: `scale(${size})` };

  const getDynamicTransform = (index: number) => {
    const diff = index - activeIndex;
    const baseRotation = 75; // Upright relative to folder's -75deg rotation
    
    if (index === activeIndex) {
      // Front active card
      return `translate(-50%, -125%) rotate(${baseRotation}deg) scale(1.05)`;
    } else if (index > activeIndex) {
      // Cards behind the front card (stacked deck)
      const offset = index - activeIndex;
      const translateX = -50 + (offset * 8);
      const translateY = -125 - (offset * 10);
      const rotate = baseRotation + (offset * 2);
      const scale = 1.0 - (offset * 0.05);
      return `translate(${translateX}%, ${translateY}%) rotate(${rotate}deg) scale(${scale})`;
    } else {
      // Discarded/swapped out card (slides down-left, rotates and fades)
      const offset = activeIndex - index;
      const translateX = -160 - (offset * 12);
      const translateY = -70 + (offset * 12);
      const rotate = baseRotation - 30 - (offset * 5);
      const scale = 0.85;
      return `translate(${translateX}%, ${translateY}%) rotate(${rotate}deg) scale(${scale})`;
    }
  };

  return (
    <div style={scaleStyle} className={className}>
      <div
        className={`group relative transition-all duration-200 ease-in cursor-pointer ${
          !open ? 'hover:-translate-y-2' : ''
        }`}
        style={{
          ...folderStyle,
          transform: open ? 'translateY(-8px)' : undefined
        }}
      >
        <div
          className="relative w-[180px] h-[135px] rounded-tl-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
          style={{ backgroundColor: folderBackColor, overflow: 'visible' }}
        >
          <span
            className="absolute z-0 bottom-[98%] left-0 w-[35px] h-[12px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-0 rounded-br-0"
            style={{ backgroundColor: folderBackColor }}
          ></span>
          {!hidePapers && papers.map((item, i) => {
            const isActive = i === activeIndex;
            const sizeClasses = open ? 'w-[220px] h-[310px]' : 'w-[80px] h-[80%]'; // Expanded card size

            const transformStyle = open
              ? `${getDynamicTransform(i)} translate(${paperOffsets[i]?.x || 0}px, ${paperOffsets[i]?.y || 0}px)`
              : undefined;

            return (
              <div
                key={i}
                onMouseMove={e => handlePaperMouseMove(e, i)}
                onMouseLeave={e => handlePaperMouseLeave(e, i)}
                className={`absolute left-1/2 transition-all duration-500 ease-out ${
                  !open 
                    ? 'z-20 bottom-[10%] transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0' 
                    : 'shadow-2xl'
                } ${sizeClasses}`}
                style={{
                  zIndex: open ? (isActive ? 40 : 20 - Math.abs(i - activeIndex)) : 20,
                  bottom: open ? 'auto' : '10%',
                  top: open ? '0' : 'auto',
                  ...(!open ? {} : { transform: transformStyle }),
                  backgroundColor: open ? 'transparent' : paperColors[i % paperColors.length],
                  border: open ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: open ? '0' : '10px',
                  boxShadow: open ? 'none' : 'none',
                  opacity: open ? (Math.abs(i - activeIndex) > 2 ? 0 : 1) : 1,
                  pointerEvents: open ? 'auto' : 'none',
                  overflow: 'visible',
                }}
              >
                {item}
              </div>
            );
          })}
          <div
            className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !open ? 'group-hover:transform-[skew(15deg)_scaleY(0.6)]' : ''
            }`}
            style={{
              backgroundColor: color,
              borderRadius: '5px 10px 10px 10px',
              ...(open && { transform: 'skew(15deg) scaleY(0.6)' })
            }}
          ></div>
          <div
            className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !open ? 'group-hover:transform-[skew(-15deg)_scaleY(0.6)]' : ''
            }`}
            style={{
              backgroundColor: color,
              borderRadius: '5px 10px 10px 10px',
              ...(open && { transform: 'skew(-15deg) scaleY(0.6)' })
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
