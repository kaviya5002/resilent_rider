export const theme = {
  colors: {
    primary: '#112250',
    secondary: '#3C5070',
    accent: '#E0B88F',
    background: '#F5F0E9',
    neutral: '#D9CBC2',
    white: '#FFFFFF',
    black: '#000000',
    text: {
      primary: '#112250',
      secondary: '#3C5070',
      light: '#6B7280',
    },
    status: {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(17, 34, 80, 0.05)',
    md: '0 4px 6px -1px rgba(17, 34, 80, 0.1)',
    lg: '0 10px 15px -3px rgba(17, 34, 80, 0.1)',
    xl: '0 20px 25px -5px rgba(17, 34, 80, 0.1)',
    card: '0 4px 12px rgba(17, 34, 80, 0.08)',
  },
  
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Poppins', 'Inter', sans-serif",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
};
