import React, { createContext, useContext, useState, useEffect } from 'react';
import { createApi } from '../../api';
import { ApiAdapter } from '../../shared/interfaces';

const ApiContext = createContext<ApiAdapter | null>(null);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [api, setApi] = useState<ApiAdapter | null>(null);
  
  useEffect(() => {
    createApi().then(setApi);
  }, []);
  
  if (!api) {
    return <div>Loading API...</div>;
  }
  
  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
};