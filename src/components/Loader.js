import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import '../css/loader.css';

const LoadingContext = createContext();

const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const previousElementsRef = useRef([]);

  const setLoading = (loading, message = '') => {
    setIsLoading(loading);
    setLoaderMessage(message);
  };

  const disableAllInputs = () => {
    const inputElements = document.querySelectorAll('input, button, select, textarea');
    previousElementsRef.current = Array.from(inputElements).map(element => ({
      element,
      wasDisabled: element.disabled
    }));
    inputElements.forEach((element) => {
      element.disabled = true;
    });
  };

  const enableAllInputs = () => {
    previousElementsRef.current.forEach(({ element, wasDisabled }) => {
      element.disabled = wasDisabled;
    });
    previousElementsRef.current = [];
  };

  return {
    isLoading,
    setLoading,
    loaderMessage,
    setLoaderMessage,
    disableAllInputs,
    enableAllInputs,
  };
};

export const LoadingProvider = ({ children }) => {
  const loading = useLoading();
  return (
    <LoadingContext.Provider value={loading}>
      {children}
      {loading.isLoading && (
        <div className='loaderContainer'>
          <div className='loader'>
            <div className='bubble'></div>
            <div className='bubble'></div>
            <div className='bubble'></div>
          </div>
          <div className='loaderMessage'>{loading.loaderMessage}</div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  return useContext(LoadingContext);
};