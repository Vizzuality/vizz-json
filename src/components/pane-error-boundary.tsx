import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface Props {
  readonly children: ReactNode
  readonly label: string
  readonly resetKey?: string | number | null
}

interface State {
  readonly error: Error | null
}

export class PaneErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}] crashed:`, error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  private handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="size-6 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{this.props.label} broke</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {this.state.error.message || 'Unknown error'}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={this.handleReset}>
            <RotateCcw className="size-3" />
            Retry
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
