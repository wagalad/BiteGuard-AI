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
    {/* Organic leaf body */}
    <path
      d="M14 2C7.8 2 2.5 8 2.5 15C2.5 21.8 7.8 29 14 31C20.2 29 25.5 21.8 25.5 15C25.5 8 20.2 2 14 2Z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Midrib */}
    <line x1="14" y1="5.5" x2="14" y2="27.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    {/* Lateral veins */}
    <path d="M14 12.5L9.5 10"  stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
    <path d="M14 12.5L18.5 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
    <path d="M14 17.5L9.5 15"  stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
    <path d="M14 17.5L18.5 15" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
    {/* Identification circle — the scan point */}
    <circle cx="14" cy="15" r="3.25" stroke="currentColor" strokeWidth="1.25" />
  </svg>
);
