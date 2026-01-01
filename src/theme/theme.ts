export const theme = {
  colors: {
    primary: '#667eea',
    primaryDark: '#764ba2',
    primaryLight: '#f093fb',
    
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    
    background: '#f8f9fa',
    surface: '#ffffff',
    
    text: '#1a1a1a',
    textSecondary: '#666666',
    textLight: '#999999',
    
    border: '#e9ecef',
    borderLight: '#f1f3f5',
    
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  gradients: {
    primary: ['#667eea', '#764ba2'],
    primaryFull: ['#667eea', '#764ba2', '#f093fb'],
    success: ['#10b981', '#059669'],
    danger: ['#ef4444', '#dc2626'],
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 42,
  },
};
