import React, { createContext, useContext, useRef } from 'react';

const LoadingContext = createContext();

const useLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const setLoading = (loading) => {
    setIsLoading(loading);
  };

  const disableAllInputs = () => {
    const inputElements = document.querySelectorAll('input, button, select, textarea');
    inputElements.forEach((element) => {
      element.disabled = true;
    });
  };

  const enableAllInputs = () => {
    const inputElements = document.querySelectorAll('input, button, select, textarea');
    inputElements.forEach((element) => {
      element.disabled = false;
    });
  };

  return {
    isLoading,
    setLoading,
    disableAllInputs,
    enableAllInputs,
  };
};

export const LoadingProvider = ({ children }) => {
  const loading = useLoading();

  return (
    <LoadingContext.Provider value={loading}>{children}</LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  return useContext(LoadingContext);
};
