'use client';

import Image from 'next/image';

interface AvatarProps {
  url?: string | null;
  username?: string | null;
  size?: number;
}

export function Avatar({ url, username, size = 40 }: AvatarProps) {
  // If we have a URL, show the image
  if (url) {
    return (
      <div 
        className="rounded-full overflow-hidden border border-outline-variant shrink-0"
        style={{ width: size, height: size }}
      >
        <Image 
          src={url} 
          alt={username || 'Avatar'} 
          width={size} 
          height={size} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback to first two letters capitalized
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div 
      className="rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-primary font-bold tracking-widest" style={{ fontSize: size * 0.4 }}>
        {getInitials(username)}
      </span>
    </div>
  );
}
