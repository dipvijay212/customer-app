import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axiosClient';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [appLanguage, setAppLanguage] = useState('en');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedLang = await AsyncStorage.getItem('appLanguage');
        const storedUser = await AsyncStorage.getItem('userData');
        
        if (storedLang) {
          setAppLanguage(storedLang);
        }

        if (storedToken) {
          // Temporarily set token for the validation request
          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          try {
            const res = await authService.validateToken(storedToken);
            
            // Token is valid
            setUserToken(storedToken);
            setUser(res.user);
            setIsOffline(false);
          } catch (apiError) {
            // Check if it's a network error (no response) vs a 401 Unauthorized
            if (!apiError.response) {
              // Network error - keep user logged in locally but set offline flag
              console.log('Network error during startup validation, proceeding offline.');
              setUserToken(storedToken);
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              }
              setIsOffline(true);
            } else if (apiError.response.status === 401) {
              // Token is invalid/expired - force logout
              console.log('Token invalid, clearing storage.');
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              delete axiosClient.defaults.headers.common['Authorization'];
              setUserToken(null);
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStorageData();
  }, []);

  const login = async (token, userData) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUserToken(token);
      setUser(userData);
    } catch (e) {
      console.error('Failed to save login info', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      delete axiosClient.defaults.headers.common['Authorization'];
      setUserToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to clear login info', e);
    }
  };

  const changeLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem('appLanguage', lang);
      setAppLanguage(lang);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const updateUser = async (updatedData) => {
    try {
      const newUser = { ...user, ...updatedData };
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
      setUser(newUser);
    } catch (e) {
      console.error('Failed to update user info', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoading, userToken, user, appLanguage, isOffline, login, logout, changeLanguage, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
