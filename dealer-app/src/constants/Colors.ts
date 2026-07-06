export const Colors = {
  background: '#0B0E14',      // bg-base-bg
  card: '#181C24',            // bg-base-card
  cardHover: '#1E232D',       // bg-base-card-hover
  panel: '#11141A',           // bg-base-panel
  border: '#262B36',          // border-base-border
  cardBorder: 'rgba(245, 158, 11, 0.3)', // Subtle signal border
  text: '#FFFFFF',            // text-primary
  textSecondary: '#9CA3AF',   // text-secondary
  muted: '#6B7280',           // text-muted
  primary: '#F59E0B',         // signal-500
  gradientStart: '#F59E0B',   // signal-500
  gradientEnd: '#D97706',     // signal-600
  cyan: '#06B6D4',            
  success: '#10B981',         // status-accepted
  error: '#EF4444',           // status-rejected
  warning: '#F59E0B',         // signal-500
  info: '#3B82F6',            // status-info
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Gradients = {
  primary: [Colors.gradientStart, Colors.gradientEnd] as const, // signal-gradient
  success: ['#34D399', Colors.success] as const,
  warning: ['#FBBF24', Colors.warning] as const,
  error: ['#F87171', Colors.error] as const, // danger-gradient
  lightLuxury: [Colors.panel, Colors.background] as const, // bg-app-radial equivalent
  cardLuxury: [Colors.cardHover, Colors.card] as const, 
  glow: ['rgba(245, 158, 11, 0.4)', 'rgba(245, 158, 11, 0.05)'] as const, // shadow-glow-signal
};
