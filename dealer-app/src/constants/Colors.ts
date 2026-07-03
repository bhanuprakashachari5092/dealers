export const Colors = {
  background: '#0B0E14',      // Midnight Black / Deep Charcoal
  card: 'rgba(25, 28, 36, 0.85)', // Dark frosted glass
  cardBorder: 'rgba(212, 175, 55, 0.3)', // Subtle Gold border
  text: '#FFFFFF',            // Pristine White
  textSecondary: '#A0AEC0',   // Muted Silver/Gray
  primary: '#D4AF37',         // Metallic Gold
  gradientStart: '#D4AF37',   // Gold
  gradientEnd: '#F3E5AB',     // Champagne
  cyan: '#06B6D4',            
  success: '#10B981',         
  error: '#EF4444',           
  warning: '#F59E0B',         
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Gradients = {
  primary: [Colors.gradientStart, Colors.gradientEnd] as const,
  success: ['#34D399', '#10B981'] as const,
  warning: ['#FBBF24', '#F59E0B'] as const,
  error: ['#F87171', '#EF4444'] as const,
  lightLuxury: ['#1A202C', '#2D3748'] as const, // Dark luxury background
  cardLuxury: ['rgba(30, 34, 45, 0.95)', 'rgba(20, 24, 33, 0.7)'] as const, 
  glow: ['rgba(212, 175, 55, 0.4)', 'rgba(243, 229, 171, 0.1)'] as const, // Gold glow
};
