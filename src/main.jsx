import React from 'react'
import ReactDOM from 'react-dom/client'
import Wavely from './App.jsx'
import HrAgent from './HrAgent.jsx'

const params = new URLSearchParams(window.location.search)
const isDrh = params.get('app') === 'drh' || window.location.pathname.startsWith('/drh')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isDrh ? <HrAgent /> : <Wavely />}
  </React.StrictMode>
)
