import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installResizeObserverShim } from './lab/resizeObserverShim'
import './styles/fonts'
import './styles/ink-tokens.css'
import './styles/ink.css'

if (import.meta.env.DEV) installResizeObserverShim()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
