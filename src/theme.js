export const theme = {
  colors: {
    primary: '#1D6B35', // Deep rich green
    primaryLight: '#81F2AE', // Mint green (active tab, tags)
    secondary: '#EBF4EC', // Very soft green background (language pills)
    background: '#FDFDF9', // Warm off-white
    surface: '#FFFFFF',
    white: '#FFFFFF',
    black: '#000000',
    text: '#222222',
    textLight: '#777777',
    error: '#D32F2F',
    border: '#EEEEEE',
    accent: '#F2994A' // Orange for 'SALE' or alerts
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40
  },
  roundness: 12,
  roundnessLg: 20,
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
    }
  },
  typography: {
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: '#1D6B35'
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#222222'
    },
    body: {
      fontSize: 14,
      color: '#222222'
    },
    caption: {
      fontSize: 12,
      color: '#777777'
    }
  }
};
