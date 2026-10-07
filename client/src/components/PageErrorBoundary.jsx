import { Component } from 'react'
import LoadError from './LoadError'

// If a page crashes while rendering, show the normal error card inside the layout
// (navigation keeps working) instead of a blank white screen.
// The error is still printed in the browser console so it can be fixed.
export default class PageErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <LoadError
          title="This page couldn't be displayed."
          detail="Something went wrong while showing this page. Please reload and try again."
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
