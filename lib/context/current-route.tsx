import React, { FC, useState, createContext, useEffect } from 'react';

interface CurrentRouteContextProps {
  currentRoute: string;
}

export const CurrentRouteContext = createContext<CurrentRouteContextProps>({
  currentRoute: '',
});

/**
 * Context Provider component for the current route change. For navigation animation purposes.
 *
 * Instantiates with route being an empty string (falsey) then updates route after load thereby
 * persisting previous url on load for when you wish to maintain initial state on route change
 */
const CurrentRouteProvider: FC = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState('');

  if (!process.browser) return <>{children}</>;

  const pathName = window?.location?.pathname;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (pathName !== currentRoute) setCurrentRoute(pathName);
  }, [currentRoute, pathName]);

  return (
    <CurrentRouteContext.Provider value={{ currentRoute }}>
      {children}
    </CurrentRouteContext.Provider>
  );
};

export default CurrentRouteProvider;
