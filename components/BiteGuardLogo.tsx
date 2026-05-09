import React from 'react';

interface Props {
  size?: number;
  className?: string;
}

export const BiteGuardLogo: React.FC<Props> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={Math.round(size * 1.14)}
    viewBox="0 0 28 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    className={className}
  >
    {/* Left vertical bar */}
    <path d="M3 2 L9 2 L9 30 L3 30 Z" fill="currentColor" />
    {/* Top arm — right-pointing triangle, upper counter of B */}
    <path d="M9 2 L22 9 L9 16 Z" fill="currentColor" />
    {/* Bottom arm — right-pointing triangle, lower counter, slightly wider */}
    <path d="M9 16 L25 23 L9 30 Z" fill="currentColor" />
  </svg>
);
