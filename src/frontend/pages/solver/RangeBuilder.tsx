import React, { useState } from 'react';
import { RangeBuilder as RangeBuilderComponent, SavedRange, TableConfig } from '../../components/range/RangeBuilder';

export const RangeBuilder: React.FC = () => {
  const [savedRanges, setSavedRanges] = useState<SavedRange[]>([]);
  
  const handleSaveRange = (range: SavedRange) => {
    setSavedRanges(prev => [...prev, range]);
    console.log('Range saved:', range);
    // TODO: Save to localStorage or IndexedDB
    localStorage.setItem(`range_${range.id}`, JSON.stringify(range));
  };
  
  const handleUseInSolver = (range: SavedRange, config: TableConfig) => {
    console.log('Using range in solver:', range);
    console.log('Table config:', config);
    // TODO: Send to solver via IPC with table configuration
  };
  
  return (
    <RangeBuilderComponent
      onSave={handleSaveRange}
      onUseInSolver={handleUseInSolver}
    />
  );
};