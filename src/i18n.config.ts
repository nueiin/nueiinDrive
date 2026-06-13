import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import ko from "./translations/ko.json";

const resources = {
    en: {
        translation: en,
    },
    ko: {
        translation: ko,
    }
};

i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    lng: "ko",
    fallbackLng: 'ko', // fallback language
    interpolation: {
      escapeValue: false, // react already sanitizes inputs
    },
    resources,
});

export default i18n;