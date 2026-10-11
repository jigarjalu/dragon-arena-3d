import React from 'react';

interface DragonIconProps {
  size?: number | string;
  className?: string;
  withBadge?: boolean;
  withGlow?: boolean;
  animate?: boolean;
  alt?: string;
}

export const DragonIcon: React.FC<DragonIconProps> = ({
  size = 48,
  className = '',
  withBadge = true,
  withGlow = true,
  animate = false,
  alt = 'Dragon Icon',
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${
        animate ? 'animate-bounce-gentle' : ''
      } ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-emerald-500/30 blur-md pointer-events-none scale-110"
          aria-hidden="true"
        />
      )}
      <img
        src="/dragon-icon.svg"
        alt={alt}
        className="w-full h-full object-contain relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
        draggable={false}
      />
    </div>
  );
};
