import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="p-4 text-sm">vizz-figma-map</div>
  </StrictMode>,
)
