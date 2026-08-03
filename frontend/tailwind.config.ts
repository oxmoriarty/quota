import type { Config } from 'tailwindcss'

export default {
  darkMode: "class",
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep Slate Backgrounds
        "background": "#020617", // Slate 950
        "surface": "#020617",
        "surface-dim": "#020617",
        "surface-bright": "#0f172a", // Slate 900
        
        "surface-container-lowest": "#020617",
        "surface-container-low": "#0f172a", 
        "surface-container": "#1e293b", // Slate 800
        "surface-container-high": "#1e293b", 
        "surface-container-highest": "#334155", // Slate 700
        
        // Vibrant Indigo Primary
        "primary": "#6366f1", // Indigo 500
        "on-primary": "#ffffff",
        "primary-container": "#4f46e5", // Indigo 600
        "on-primary-container": "#e0e7ff",
        "inverse-primary": "#818cf8",
        
        // Muted Slate Secondary
        "secondary": "#94a3b8", // Slate 400
        "on-secondary": "#0f172a",
        "secondary-container": "#1e293b",
        "on-secondary-container": "#f1f5f9",
        
        // Tertiary (Cyan/Teal accent for variety)
        "tertiary": "#06b6d4", // Cyan 500
        "on-tertiary": "#ffffff",
        "tertiary-container": "#0891b2",
        "on-tertiary-container": "#cffafe",
        
        // Text / On-Surface
        "on-surface": "#f8fafc", // Slate 50
        "on-surface-variant": "#94a3b8", // Slate 400
        "inverse-surface": "#f8fafc",
        "inverse-on-surface": "#020617",
        
        // Borders & Outlines
        "outline": "#475569", // Slate 600
        "outline-variant": "#1e293b", // Slate 800
        "surface-tint": "#6366f1",
        
        // Fixed Colors
        "primary-fixed": "#e0e7ff",
        "on-primary-fixed": "#312e81",
        "primary-fixed-dim": "#c7d2fe",
        "on-primary-fixed-variant": "#3730a3",
        
        "secondary-fixed": "#f1f5f9",
        "on-secondary-fixed": "#0f172a",
        "secondary-fixed-dim": "#e2e8f0",
        "on-secondary-fixed-variant": "#1e293b",
        
        "tertiary-fixed": "#cffafe",
        "on-tertiary-fixed": "#164e63",
        "tertiary-fixed-dim": "#a5f3fc",
        "on-tertiary-fixed-variant": "#155e75",
        
        // Errors
        "error": "#ef4444", // Red 500
        "on-error": "#ffffff",
        "error-container": "#991b1b",
        "on-error-container": "#fee2e2"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Geist", "sans-serif"],
        "display": ["Geist", "sans-serif"],
        "body": ["Geist", "sans-serif"],
        "label": ["Geist", "sans-serif"]
      }
    },
  },
  plugins: [],
} satisfies Config
