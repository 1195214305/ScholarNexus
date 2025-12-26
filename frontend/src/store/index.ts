import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Paper {
  id: string
  title: string
  authors: string[]
  year: number
  citations: number
  abstract: string
  keywords: string[]
  venue: string
  doi?: string
  url?: string
}

export interface Author {
  id: string
  name: string
  affiliation: string
  hIndex: number
  paperCount: number
  citationCount: number
}

export interface GraphNode {
  id: string
  label: string
  type: 'paper' | 'author' | 'keyword' | 'institution'
  size: number
  color: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
  data?: Paper | Author | Record<string, unknown>
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  weight: number
  type: 'citation' | 'coauthor' | 'keyword' | 'affiliation'
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

interface Settings {
  apiKey: string
  apiProvider: 'qwen' | 'openai'
  theme: 'light' | 'dark'
}

interface AppState {
  // Search state
  searchQuery: string
  searchResults: Paper[]
  isSearching: boolean

  // Papers state
  papers: Paper[]

  // Graph state
  graphData: GraphData | null
  selectedNode: GraphNode | null
  graphLayout: 'force' | 'radial' | 'hierarchical'

  // Filter state
  yearRange: [number, number]
  minCitations: number
  selectedKeywords: string[]

  // UI state
  sidebarOpen: boolean
  activeTab: 'search' | 'filters' | 'details'

  // Settings
  settings: Settings

  // Actions
  setSearchQuery: (query: string) => void
  setSearchResults: (results: Paper[]) => void
  setIsSearching: (isSearching: boolean) => void
  setPapers: (papers: Paper[]) => void
  setGraphData: (data: GraphData | null) => void
  setSelectedNode: (node: GraphNode | null) => void
  setGraphLayout: (layout: 'force' | 'radial' | 'hierarchical') => void
  setYearRange: (range: [number, number]) => void
  setMinCitations: (min: number) => void
  setSelectedKeywords: (keywords: string[]) => void
  toggleSidebar: () => void
  setActiveTab: (tab: 'search' | 'filters' | 'details') => void
  updateSettings: (settings: Partial<Settings>) => void
  reset: () => void
}

const initialSettings: Settings = {
  apiKey: '',
  apiProvider: 'qwen',
  theme: 'light',
}

const initialState = {
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  papers: [],
  graphData: null,
  selectedNode: null,
  graphLayout: 'force' as const,
  yearRange: [2015, 2024] as [number, number],
  minCitations: 0,
  selectedKeywords: [],
  sidebarOpen: true,
  activeTab: 'search' as const,
  settings: initialSettings,
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      setIsSearching: (isSearching) => set({ isSearching }),
      setPapers: (papers) => set({ papers }),
      setGraphData: (data) => set({ graphData: data }),
      setSelectedNode: (node) => set({ selectedNode: node, activeTab: node ? 'details' : 'search' }),
      setGraphLayout: (layout) => set({ graphLayout: layout }),
      setYearRange: (range) => set({ yearRange: range }),
      setMinCitations: (min) => set({ minCitations: min }),
      setSelectedKeywords: (keywords) => set({ selectedKeywords: keywords }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      reset: () => set({ ...initialState, settings: initialState.settings }),
    }),
    {
      name: 'scholarnexus-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
