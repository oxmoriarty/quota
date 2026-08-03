import React from 'react';

export function Card({ children, className = '', style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      style={{
        fontSize: '1rem',
        fontWeight: 600,
        margin: 0,
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '', style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: '1.5rem',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
