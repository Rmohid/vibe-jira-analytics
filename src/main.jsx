import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Error boundary component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('React Error Boundary caught an error:', error, errorInfo)
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
        
        // Log to our logging system if available
        if (typeof Logger !== 'undefined') {
            Logger.error('REACT', 'Component error boundary triggered', {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                errorInfo: errorInfo
            })
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-50 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white border border-red-200 rounded-lg p-6">
                            <h1 className="text-2xl font-bold text-red-800 mb-4">
                                🚨 Dashboard Error
                            </h1>
                            <p className="text-red-700 mb-4">
                                The dashboard encountered an unexpected error and couldn't render properly.
                            </p>
                            
                            <div className="bg-red-100 border border-red-300 rounded p-4 mb-4">
                                <h3 className="font-bold text-red-800 mb-2">Error Details:</h3>
                                <pre className="text-xs text-red-900 overflow-auto">
                                    {this.state.error && this.state.error.toString()}
                                </pre>
                            </div>
                            
                            <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4">
                                <h3 className="font-bold text-gray-800 mb-2">Stack Trace:</h3>
                                <pre className="text-xs text-gray-900 overflow-auto">
                                    {this.state.error && this.state.error.stack}
                                </pre>
                            </div>
                            
                            <div className="space-y-2">
                                <button 
                                    onClick={() => window.location.reload()} 
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Reload Dashboard
                                </button>
                                <button 
                                    onClick={() => {
                                        sessionStorage.clear()
                                        localStorage.clear()
                                        window.location.reload()
                                    }} 
                                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-2"
                                >
                                    Clear All Data & Reload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

// Simple React app initialization
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
)