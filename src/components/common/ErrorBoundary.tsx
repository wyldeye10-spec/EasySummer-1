import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-warm-50 p-8">
          <div className="text-6xl mb-4">😥</div>
          <h1 className="text-2xl font-bold text-warm-800 mb-2">出了点问题</h1>
          <p className="text-warm-600 mb-4">应用遇到了一个意外错误，刷新页面试试吧。</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-warm-500 text-white rounded-lg hover:bg-warm-600 transition-colors"
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
