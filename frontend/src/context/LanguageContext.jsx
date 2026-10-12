import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('tamilocr_language') || 'EN';
  });

  const setLanguage = (lang) => {
    const validLang = lang === 'TA' ? 'TA' : 'EN';
    setLanguageState(validLang);
    localStorage.setItem('tamilocr_language', validLang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'TA' : 'EN');
  };

  const t = (key, fallback) => {
    if (!key) return '';
    const currentDict = translations[language] || translations.EN;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    // Fallback to English dictionary if key missing in selected language
    if (translations.EN && translations.EN[key] !== undefined) {
      return translations.EN[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
