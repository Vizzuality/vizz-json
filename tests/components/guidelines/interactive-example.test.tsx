import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InteractiveExample } from '#/components/guidelines/interactive-example'

// Mock ParamControl to avoid @base-ui/react hook issues in jsdom
vi.mock('#/components/playground/param-control', () => ({
  ParamControl: ({ inferred }: { inferred: { key: string } }) => (
    <div data-testid={`param-control-${inferred.key}`} />
  ),
}))

// Mock the converter module to avoid WebGL issues in jsdom
vi.mock('#/lib/converter', () => ({
  resolveConfig: (
    config: Record<string, unknown>,
    params: Record<string, unknown>,
  ) => {
    // Simple param substitution: replace @@#params.X with params[X]
    function substitute(value: unknown): unknown {
      if (typeof value === 'string' && value.startsWith('@@#params.')) {
        const key = value.slice('@@#params.'.length)
        return params[key] ?? value
      }
      if (Array.isArray(value)) return value.map(substitute)
      if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([k, v]) => [
            k,
            substitute(v),
          ]),
        )
      }
      return value
    }
    return substitute(config)
  },
}))

describe('InteractiveExample', () => {
  const simpleConfig = {
    paint: {
      'raster-opacity': '@@#params.opacity',
    },
  }
  const simpleParams = [
    { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
  ]

  it('renders three columns: input, controls, output', () => {
    render(
      <InteractiveExample
        title="Test"
        config={simpleConfig}
        paramsConfig={simpleParams}
      />,
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText(/Input/i)).toBeInTheDocument()
    expect(screen.getByText(/Controls/i)).toBeInTheDocument()
    expect(screen.getByText(/Output/i)).toBeInTheDocument()
  })

  it('displays the config JSON in the input pane', () => {
    render(
      <InteractiveExample
        title="Test"
        config={simpleConfig}
        paramsConfig={simpleParams}
      />,
    )
    expect(screen.getByText(/"@@#params.opacity"/)).toBeInTheDocument()
  })

  it('resolves params and shows output with default values', () => {
    render(
      <InteractiveExample
        title="Test"
        config={simpleConfig}
        paramsConfig={simpleParams}
      />,
    )
    expect(screen.getByTestId('output-pane')).toHaveTextContent('0.8')
  })

  it('renders param controls for each param', () => {
    const multiParams = [
      { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
      {
        key: 'visibility',
        default: 'visible',
        options: ['visible', 'none'],
      },
    ]
    render(
      <InteractiveExample
        title="Multi"
        config={{
          opacity: '@@#params.opacity',
          visibility: '@@#params.visibility',
        }}
        paramsConfig={multiParams}
      />,
    )
    expect(screen.getByText('opacity')).toBeInTheDocument()
    expect(screen.getByText('visibility')).toBeInTheDocument()
  })

  it('renders optional description', () => {
    render(
      <InteractiveExample
        title="Test"
        config={simpleConfig}
        paramsConfig={simpleParams}
        description="A helpful description"
      />,
    )
    expect(screen.getByText('A helpful description')).toBeInTheDocument()
  })
})
