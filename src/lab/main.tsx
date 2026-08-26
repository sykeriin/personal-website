import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installResizeObserverShim } from './resizeObserverShim'
import { InkLab } from './InkLab'
import '../styles/tokens.css'

installResizeObserverShim()

createRoot(document.getElementById('lab')!).render(
  <StrictMode>
    <InkLab />
  </StrictMode>,
)
