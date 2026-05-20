import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import store from './store/index'
import App from './App.jsx'
import './index.css'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry          : 1,     // retry failed requests once
      staleTime      : 30000, // data stays fresh for 30 seconds
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>              {/* Redux available everywhere */}
      <BrowserRouter>                     {/* Routing available everywhere */}
        <QueryClientProvider client={queryClient}> {/* React Query available everywhere */}
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
)