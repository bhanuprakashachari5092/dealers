export const Colors = {
  background: '#F8FAFC',      // Soft white / slate-50
  card: 'rgba(255, 255, 255, 0.85)', // Frosted glassmorphism base
  cardBorder: 'rgba(255, 255, 255, 0.5)', 
  text: '#0F172A',            // Slate-900 for high contrast reading
  textSecondary: '#64748B',   // Slate-500
  primary: '#3B82F6',         // Sky Blue
  gradientStart: '#3B82F6',   // Sky Blue
  gradientEnd: '#6366F1',     // Indigo
  cyan: '#06B6D4',            // Cyan
  success: '#10B981',         // Emerald Green
  error: '#EF4444',           // Red
  warning: '#F59E0B',         // Amber
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Gradients = {
  primary: [Colors.gradientStart, Colors.gradientEnd] as const,
  success: ['#34D399', '#10B981'] as const,
  warning: ['#FBBF24', '#F59E0B'] as const,
  error: ['#F87171', '#EF4444'] as const,
  lightLuxury: ['#F1F5F9', '#E2E8F0'] as const,
  cardLuxury: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.7)'] as const, 
  glow: ['rgba(59, 130, 246, 0.3)', 'rgba(99, 102, 241, 0.3)'] as const,
};
