import React from 'react'
import ReactDOM from 'react-dom/client'
import Wavely from './App.jsx'
import Admin from './Admin.jsx'

const isAdmin = window.location.pathname === '/admin' || new URLSearchParams(window.location.search).get('admin') === 'true';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <Admin /> : <Wavely />}
  </React.StrictMode>
)
