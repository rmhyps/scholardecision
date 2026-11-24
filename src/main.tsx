import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GDSSProvider } from './state/GDSSContext'
import { SelectionProvider } from './state/SelectionContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GDSSProvider>
      <SelectionProvider>
        <App />
      </SelectionProvider>
    </GDSSProvider>
  </StrictMode>,
)
