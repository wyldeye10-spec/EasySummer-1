import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { BrowserCheck } from './components/common/BrowserCheck'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserCheck>
      <App />
    </BrowserCheck>
  </StrictMode>,
)
