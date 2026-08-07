'use client';

import { useEffect } from 'react';

export function ThemeInit() {
  useEffect(() => {
    // Read saved preferences or fallback to defaults
    const savedColor = localStorage.getItem('quota-color-theme') || 'indigo';
    const savedSize = localStorage.getItem('quota-font-size') || 'md';
    const savedFont = localStorage.getItem('quota-font-family') || 'geist';
    
    // Apply them to the document root globally
    document.documentElement.setAttribute('data-color-theme', savedColor);
    document.documentElement.setAttribute('data-font-size', savedSize);
    document.documentElement.setAttribute('data-font-family', savedFont);
  }, []);

  return null; // This component doesn't render anything visually
}
