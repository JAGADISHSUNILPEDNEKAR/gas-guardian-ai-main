// Format numbers with commas
export const formatNumber = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Format percentage
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Format date
export const formatDate = (date: Date | string | number): string => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date and time
export const formatDateTime = (date: Date | string | number): string => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: Date | string | number): string => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(d);
};

// Format gas price with color coding
export const formatGasPriceWithStatus = (gwei: number): { text: string; status: 'low' | 'medium' | 'high' } => {
  if (gwei < 20) return { text: `${gwei.toFixed(2)} Gwei`, status: 'low' };
  if (gwei < 40) return { text: `${gwei.toFixed(2)} Gwei`, status: 'medium' };
  return { text: `${gwei.toFixed(2)} Gwei`, status: 'high' };
};

// Format savings with emoji
export const formatSavings = (amount: number): string => {
  if (amount >= 100) return `💰 $${amount.toFixed(2)}`;
  if (amount >= 10) return `💵 $${amount.toFixed(2)}`;
  return `💸 $${amount.toFixed(2)}`;
};

// Truncate text
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

