import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

console.log('App Initialized — 2026-03-08 Build — v1.0.1');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#ffffff',
                        color: '#374151',
                        border: '1px solid rgba(123,143,242,0.2)',
                        borderRadius: '12px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    },
                    success: {
                        iconTheme: { primary: '#7b8ff2', secondary: '#fff' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#fff' },
                    },
                }}
            />
        </BrowserRouter>
    </React.StrictMode>,
)
