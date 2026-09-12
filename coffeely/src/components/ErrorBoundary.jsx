import { Component } from 'react'
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, message: '' } }
  static getDerivedStateFromError(error) { return { hasError: true, message: error?.message ?? 'Error' } }
  componentDidCatch(error, info) { console.error('[Coffeely]', error, info) }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-border shadow-soft p-8 max-w-md text-center">
          <p className="text-4xl mb-4">☕</p>
          <h1 className="text-lg font-bold text-red-700">Algo salió mal</h1>
          <p className="mt-2 text-sm text-text-muted font-mono break-words">{this.state.message}</p>
          <button className="btn-primary mt-6" onClick={() => this.setState({ hasError: false })}>Reintentar</button>
        </div>
      </div>
    )
    return this.props.children
  }
}
