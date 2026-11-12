import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installTipHover } from './lib/tipHover'

// ホバーの詳細説明は、マウスが動いたらすぐ消す（lib/tipHover.ts）
installTipHover()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
