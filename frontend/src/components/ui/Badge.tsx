import React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
};

export function Badge({ children, variant = 'default', className, style, ...props }: BadgeProps) {
  let bgColor = 'var(--surface-active)';
  let color = 'var(--foreground)';
  let border = '1px solid transparent';

  switch (variant) {
    case 'success':
      bgColor = 'var(--success-subtle)';
      color = 'var(--success)';
      break;
    case 'warning':
      bgColor = 'var(--warning-subtle)';
      color = 'var(--warning)';
      break;
    case 'danger':
      bgColor = 'var(--danger-subtle)';
      color = 'var(--danger)';
      break;
    case 'outline':
      bgColor = 'transparent';
      border = '1px solid var(--border-strong)';
      break;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.125rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: bgColor,
        color: color,
        border: border,
        whiteSpace: 'nowrap',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
}
