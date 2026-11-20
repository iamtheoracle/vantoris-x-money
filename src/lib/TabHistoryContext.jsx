import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const TabHistoryContext = createContext({ getTabPath: (p) => p });

const TAB_PREFIXES = [
  { path: '/', exact: true },
  { path: '/accounts', exact: false },
  { path: '/services', exact: false },
  { path: '/advisor', exact: false },
  { path: '/messages', exact: false },
  { path: '/profile', exact: false },
];

export function TabHistoryProvider({ children }) {
  const [tabPaths, setTabPaths] = useState({});
  const location = useLocation();

  useEffect(() => {
    const match = TAB_PREFIXES.find(t =>
      t.exact ? location.pathname === t.path : location.pathname.startsWith(t.path)
    );
    if (match) {
      setTabPaths(prev => ({ ...prev, [match.path]: location.pathname }));
    }
  }, [location.pathname]);

  const getTabPath = (tabPath) => tabPaths[tabPath] || tabPath;

  return (
    <TabHistoryContext.Provider value={{ getTabPath }}>
      {children}
    </TabHistoryContext.Provider>
  );
}

export function useTabHistory() {
  return useContext(TabHistoryContext);
}