'use client';

import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'right';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const positionClasses = position === 'top'
    ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    : position === 'right'
    ? 'left-full top-1/2 -translate-y-1/2 ml-2'
    : 'top-full left-1/2 -translate-x-1/2 mt-2';

  const arrowClasses = position === 'top'
    ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700 border-x-transparent border-b-transparent'
    : position === 'right'
    ? 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-y-transparent border-l-transparent'
    : 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700 border-x-transparent border-t-transparent';

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          className={`absolute ${positionClasses} z-50 pointer-events-none`}
          role="tooltip"
        >
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg animate-in fade-in duration-150">
            {content}
          </div>
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses}`} />
        </div>
      )}
    </div>
  );
}
