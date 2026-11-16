import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SesionProvider } from './context/SesionProvider.jsx'
import ProveedorUI from './components/ui/ProveedorUI.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProveedorUI>
      <SesionProvider>
        <App />
      </SesionProvider>
    </ProveedorUI>
  </StrictMode>,
)
