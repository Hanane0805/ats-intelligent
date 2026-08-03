'use client';

import React, { createContext, useContext, useState } from 'react';

const JobContext = createContext<any>(null);

export const JobProvider = ({ children }: { children: React.ReactNode }) => {
  // ... (keep your existing state and functions)
  const [jobs, setJobs] = useState([]); 
  return (
    <JobContext.Provider value={{ jobs, setJobs /* ...other values */ }}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobContext must be used within a JobProvider');
  }
  return context;
};