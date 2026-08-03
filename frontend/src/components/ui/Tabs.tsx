import React, { useState } from 'react';

type TabsProps = {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function Tabs({ defaultValue, children, className, style }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className} style={style}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            setActiveTab,
          });
        }
        return child;
      })}
    </div>
  );
}

type TabsListProps = {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function TabsList({ children, activeTab, setActiveTab, className, style }: TabsListProps) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '2rem',
        marginBottom: '2rem',
        ...style
      }}
      className={className}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            setActiveTab,
          });
        }
        return child;
      })}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function TabsTrigger({ value, children, activeTab, setActiveTab, className, style }: TabsTriggerProps) {
  const isActive = activeTab === value;
  
  return (
    <button
      onClick={() => setActiveTab && setActiveTab(value)}
      style={{
        background: 'transparent',
        border: 'none',
        padding: '0 0 0.75rem 0',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
        borderBottom: isActive ? '2px solid var(--foreground)' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: 'translateY(1px)', // to overlap the border
        ...style
      }}
      className={className}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = 'var(--foreground)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.color = 'var(--muted-foreground)';
      }}
    >
      {children}
    </button>
  );
}

type TabsContentProps = {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function TabsContent({ value, children, activeTab, className, style }: TabsContentProps) {
  if (activeTab !== value) return null;
  
  return (
    <div className={className} style={{ animation: 'fadeIn 0.3s ease', ...style }}>
      {children}
    </div>
  );
}
