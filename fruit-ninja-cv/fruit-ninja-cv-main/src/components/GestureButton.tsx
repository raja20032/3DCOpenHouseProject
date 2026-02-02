/**
 * GestureButton - A button that can be activated by hovering with a tracked finger
 * Shows a progress indicator during dwell time before activation
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface GestureButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onActivate: () => void;
  handPosition: { x: number; y: number; isTracking: boolean };
  dwellTime?: number; // ms to hold before activating (default 600)
}

export function GestureButton({
  children,
  onActivate,
  handPosition,
  dwellTime = 600,
  className,
  disabled = false,
  ...buttonProps
}: GestureButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [progress, setProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasActivatedRef = useRef(false);

  // Reset activation flag when hand leaves
  useEffect(() => {
    if (!isHovering) {
      hasActivatedRef.current = false;
    }
  }, [isHovering]);

  // Check if hand is hovering over button
  useEffect(() => {
    if (disabled || !buttonRef.current) {
      setIsHovering(false);
      return;
    }

    // Check both hand tracking AND mouse position
    if (!handPosition.isTracking) {
      setIsHovering(false);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const padding = 10; // Extra hit area for easier targeting
    
    const hovering = (
      handPosition.x >= rect.left - padding &&
      handPosition.x <= rect.right + padding &&
      handPosition.y >= rect.top - padding &&
      handPosition.y <= rect.bottom + padding
    );

    setIsHovering(hovering);
  }, [handPosition.x, handPosition.y, handPosition.isTracking, disabled]);

  // Handle dwell timer
  useEffect(() => {
    if (isHovering && !disabled && !hasActivatedRef.current) {
      // Start dwell timer
      startTimeRef.current = Date.now();
      
      const updateProgress = () => {
        if (!startTimeRef.current) return;
        
        const elapsed = Date.now() - startTimeRef.current;
        const newProgress = Math.min((elapsed / dwellTime) * 100, 100);
        setProgress(newProgress);

        if (elapsed >= dwellTime && !hasActivatedRef.current) {
          hasActivatedRef.current = true;
          onActivate();
          setProgress(0);
          startTimeRef.current = null;
          return;
        }

        timerRef.current = requestAnimationFrame(updateProgress);
      };

      timerRef.current = requestAnimationFrame(updateProgress);
    } else {
      // Stop timer and reset progress
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
      setProgress(0);
    }

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [isHovering, disabled, dwellTime, onActivate]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      onActivate();
    }
  }, [disabled, onActivate]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      {...buttonProps}
      className={cn(
        'relative overflow-visible transition-all duration-200',
        isHovering && 'scale-110 brightness-125',
        className
      )}
    >
      {/* Progress ring - SVG circle around button */}
      {progress > 0 && (
        <svg
          className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx="12"
            ry="12"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="3"
          />
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx="12"
            ry="12"
            fill="none"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="4"
            strokeDasharray={`${progress * 3.84} 384`}
            className="drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))',
            }}
          />
        </svg>
      )}

      {/* Hover glow effect */}
      {isHovering && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
          style={{
            boxShadow: '0 0 30px rgba(255, 200, 50, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)',
          }}
        />
      )}

      {children}
    </button>
  );
}
