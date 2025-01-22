import { Toaster } from 'sonner'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import { ThemeProvider } from '@/components/theme-provider'

import App from './App.tsx'
import './index.css'
import { store } from './store/index.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: 'bg-background border',
              error: 'text-red-400',
              success: 'text-green-400',
              warning: 'text-yellow-400',
              info: 'text-blue-400',
            },
          }}
          // richColors
        />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
