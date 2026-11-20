/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// Registro do Service Worker (PWA offline) com atualização automática:
//  - updateViaCache: 'none' → o próprio /sw.js nunca é lido do cache HTTP,
//    então cada deploy entrega um worker novo imediatamente.
//  - O SW usa skipWaiting + clients.claim: a versão nova assume o controle
//    logo na primeira navegação após o deploy (basta um F5 normal).
//  - Assim que um worker novo assume, uma mensagem ao cliente pede uma
//    navegação: na próxima carga o usuário já está no bundle novo — sem
//    Ctrl+Shift+R e sem limpar dados do site.
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then(async (registration) => {
        // Procura atualização logo na carga e depois a cada hora.
        try {
          await registration.update()
        } catch {
          /* offline: segue com o worker atual */
        }
        setInterval(
          () => {
            registration.update().catch(() => {})
          },
          60 * 60 * 1000,
        )

        // Se um worker novo já está esperando (caso raro com skipWaiting),
        // ativa-o imediatamente.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        // Quando um worker novo assume o controle, recarrega UMA vez — mas
        // apenas se a carga atual foi atendida pelo worker anterior, para
        // nunca entrar em loop de recarga.
        let refreshed = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshed) return
          refreshed = true
          // Recarrega só se esta página já foi carregada sob controle do
          // worker antigo (navigationLoad timestamp). Caso contrário, a
          // própria carga já é da versão nova.
          const navigationLoad =
            (performance.getEntriesByType('navigation')[0] as
              | PerformanceNavigationTiming
              | undefined) ?? null
          if (navigationLoad && performance.now() > 1000) {
            window.location.reload()
          }
        })
      })
      .catch((err) => {
        console.log('SW registration error:', err)
      })
  })
}

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
