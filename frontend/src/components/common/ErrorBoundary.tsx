import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from './ErrorState'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

/** Catches render-time errors in a subtree and shows a graceful fallback. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorState
            title="Something went wrong"
            message="An unexpected error occurred while rendering this view. Please reload the page."
            onRetry={() => window.location.reload()}
          />
        )
      )
    }
    return this.props.children
  }
}
