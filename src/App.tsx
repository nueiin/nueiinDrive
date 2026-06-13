import React from 'react';
import logo from './logo.svg';
import './App.css';
import { HashRouter } from "react-router-dom";
import Navigations from './navigations';
import { ThemeProvider } from "styled-components";
import { theme } from './theme';
import { LoginStatusProvider, VirtualDriveStatusProvider, SyncStatusProvider } from './contexts';
import { I18nextProvider } from 'react-i18next';
import i18n from "./i18n.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        refetchIntervalInBackground: true,
        refetchInterval: 1000, // 1초마다 데이터 업데이트
      },
    },
  });

  return (
      // <HashRouter>
          <ThemeProvider theme={theme}>
            <I18nextProvider i18n={i18n}>
              <LoginStatusProvider>
                <VirtualDriveStatusProvider>
                    <SyncStatusProvider>
                    <QueryClientProvider client={queryClient}>
                      <Navigations />
                      </QueryClientProvider>
                    </SyncStatusProvider>
                </VirtualDriveStatusProvider>
              </LoginStatusProvider>
            </I18nextProvider>
          </ThemeProvider>
      // </HashRouter>
  );
}

export default App;
