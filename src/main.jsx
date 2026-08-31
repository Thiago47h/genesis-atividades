import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Landing from './Landing.jsx'
import './landing.css'

const isCreator = window.location.pathname === '/app' || window.location.pathname.startsWith('/app/')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isCreator ? <App /> : <Landing />}
  </React.StrictMode>,
)
