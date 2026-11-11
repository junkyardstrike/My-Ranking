import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'

// iOS Safari は、ページに touchstart のリスナーが1つも無いと :active（押している間の見た目）を表示しない。
// これが無いとボタンを押しても見た目が一切変わらず「反応していない」ように感じるため、空のリスナーを登録する。
document.addEventListener('touchstart', () => {}, { passive: true })

// ホーム画面に追加したアプリが古い版のまま動き続けないよう、
// 新しい版を見つけたらすぐ切り替える（autoUpdate）。アプリに戻ってきた時にも更新を確認する。
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => { registration.update().catch(() => {}) }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    setInterval(check, 60 * 60 * 1000)
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
