import { createRoot } from 'react-dom/client'
import App from './App'
import { CookiesProvider } from 'react-cookie';

createRoot(document.getElementById('root')!).render(
  <CookiesProvider>
    <App />
  </CookiesProvider>
  
)
