import React from 'react';

interface PageTemplateProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({ 
  title, 
  description, 
  children,
  fullWidth = false 
}) => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div style={{ 
        maxWidth: fullWidth ? '100%' : '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {children}
      </div>
    </div>
  );
};