
import React from 'react';

export function ToothIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.34 4.25a2.5 2.5 0 0 1 5.32 0" />
      <path d="M9.34 4.25a2.5 2.5 0 0 0-2.5 2.5V13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.75a2.5 2.5 0 0 0-2.5-2.5" />
      <path d="M12 15v5" />
      <path d="M9 19h6" />
    </svg>
  );
}
