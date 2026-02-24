// components/Icons.js

export const RocketIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M4.5 16.5c-1.5-1.26-2-5-2-5s3.5-1.5 4.5-4c.5-1.5 2-4 3.5-4 1.5 0 3 2.5 3.5 4 1 2.5 4.5 4 4.5 4s.5 3.75-2 5" />
    <path d="M12 12v8" />
    <path d="M8 20h8" />
  </svg>
);

export const WalletIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <path d="M1 10h22" />
    <circle cx="17" cy="15" r="1.5" />
  </svg>
);

export const TrendingUpIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 17" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const LoadingSpinner = ({ size = 20, color = 'currentColor' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 10 10" fill="none" />
  </svg>
);

export const BarChartIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
