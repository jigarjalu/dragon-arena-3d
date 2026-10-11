import React from 'react';

interface MobileFrameWrapperProps {
  isMobileSimulator?: boolean;
  onToggleSimulator?: () => void;
  children: React.ReactNode;
}

export const MobileFrameWrapper: React.FC<MobileFrameWrapperProps> = ({
  children,
}) => {
  return (
    <div className="fixed inset-0 w-full h-full min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 flex flex-col select-none touch-none">
      {children}
    </div>
  );
};
