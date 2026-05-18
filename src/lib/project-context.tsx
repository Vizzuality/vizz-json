import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { toast } from 'sonner'
import {
  DEFAULT_EXAMPLE_SLUG,
  EXAMPLE_SLUGS,
  examples,
  getExampleIndexBySlug,
} from '#/examples'
import { buildDefaultParams } from '#/lib/pipeline'
import type { ExampleSlug } from '#/examples'
import type { ResolvedParams } from '#/lib/types'

type ProjectContextValue = {
  jsonString: string
  paramValues: ResolvedParams
  exampleSlug: ExampleSlug
  setJsonString: (json: string) => void
  setParamValues: React.Dispatch<React.SetStateAction<ResolvedParams>>
  setExampleSlug: (slug: ExampleSlug) => void
  loadExample: (index: number) => void
  importJson: (file: File) => Promise<void>
  exportJson: (filename?: string) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

function sanitizeFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'vizz-project'
}

const DEFAULT_EXAMPLE_INDEX = getExampleIndexBySlug(DEFAULT_EXAMPLE_SLUG) ?? 0

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [exampleSlug, setExampleSlug] =
    useState<ExampleSlug>(DEFAULT_EXAMPLE_SLUG)
  const [jsonString, setJsonString] = useState(() =>
    JSON.stringify(examples[DEFAULT_EXAMPLE_INDEX], null, 2),
  )
  const [paramValues, setParamValues] = useState<ResolvedParams>(() =>
    buildDefaultParams(examples[DEFAULT_EXAMPLE_INDEX].params_config),
  )

  const loadExample = useCallback((index: number) => {
    const example = examples[index] as (typeof examples)[number] | undefined
    if (!example) return
    setJsonString(JSON.stringify(example, null, 2))
    setParamValues(buildDefaultParams(example.params_config))
    setExampleSlug(EXAMPLE_SLUGS[index])
  }, [])

  const importJson = useCallback(async (file: File) => {
    const text = await file.text()
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text) as Record<string, unknown>
    } catch {
      toast.error('Invalid JSON file')
      return
    }
    setJsonString(JSON.stringify(parsed, null, 2))
    const paramsConfig = parsed.params_config as
      | Parameters<typeof buildDefaultParams>[0]
      | undefined
    if (paramsConfig) {
      setParamValues(buildDefaultParams(paramsConfig))
    } else {
      setParamValues({})
    }
  }, [])

  const exportJson = useCallback(
    (filename?: string) => {
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${sanitizeFilename(filename ?? 'vizz-project')}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    },
    [jsonString],
  )

  const value = useMemo<ProjectContextValue>(
    () => ({
      jsonString,
      paramValues,
      exampleSlug,
      setJsonString,
      setParamValues,
      setExampleSlug,
      loadExample,
      importJson,
      exportJson,
    }),
    [jsonString, paramValues, exampleSlug, loadExample, importJson, exportJson],
  )

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  )
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) {
    throw new Error('useProject must be used inside <ProjectProvider>')
  }
  return ctx
}
