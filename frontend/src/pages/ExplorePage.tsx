import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as d3 from 'd3'
import {
  Search,
  Filter,
  X,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  BookOpen,
  User,
  Tag,
  ExternalLink,
  Calendar,
  Quote,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore, GraphNode, GraphLink, Paper } from '../store'
import { searchPapers, buildKnowledgeGraph, analyzePaperWithAI } from '../utils/api'

// 节点颜色 - 学术风格
const nodeColors = {
  paper: '#1e3a5f',    // 深蓝
  author: '#722f37',   // 酒红
  keyword: '#228b22',  // 森林绿
  institution: '#b8860b' // 金色
}

const nodeIcons = {
  paper: BookOpen,
  author: User,
  keyword: Tag,
  institution: BookOpen
}

export default function ExplorePage() {
  const {
    searchQuery,
    setSearchQuery,
    graphData,
    setGraphData,
    selectedNode,
    setSelectedNode,
    isSearching,
    setIsSearching,
    yearRange,
    setYearRange,
    minCitations,
    setMinCitations,
    papers,
    setPapers,
    settings
  } = useStore()

  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [showFilters, setShowFilters] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)
  const [error, setError] = useState<string>('')

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: isFullscreen ? window.innerHeight - 100 : Math.max(500, rect.width * 0.6)
      })
    }
  }, [isFullscreen])

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [updateDimensions])

  const handleSearch = useCallback(async () => {
    if (!localQuery.trim()) return

    setIsSearching(true)
    setSearchQuery(localQuery)
    setError('')
    setAiAnalysis('')

    try {
      // 调用真实的 Semantic Scholar API
      const searchResults = await searchPapers(localQuery, 20)

      // 根据筛选条件过滤
      const filteredPapers = searchResults.filter(paper => {
        const yearOk = paper.year >= yearRange[0] && paper.year <= yearRange[1]
        const citationsOk = paper.citations >= minCitations
        return yearOk && citationsOk
      })

      setPapers(filteredPapers)

      // 构建知识图谱
      const graphResult = buildKnowledgeGraph(filteredPapers, localQuery)
      setGraphData(graphResult)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : '搜索失败，请稍后重试')
    } finally {
      setIsSearching(false)
    }
  }, [localQuery, setSearchQuery, setGraphData, setIsSearching, setPapers, yearRange, minCitations])

  useEffect(() => {
    if (searchQuery && !graphData) {
      setLocalQuery(searchQuery)
      handleSearch()
    }
  }, [searchQuery, graphData, handleSearch])

  // AI 分析选中的论文
  const handleAnalyzePaper = async (paper: Paper) => {
    if (!settings.apiKey) {
      setError('请先在设置中配置 API Key')
      return
    }

    setIsAnalyzing(true)
    setAiAnalysis('')

    try {
      const analysis = await analyzePaperWithAI(settings.apiKey, paper)
      setAiAnalysis(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 分析失败')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // D3 Graph rendering
  useEffect(() => {
    if (!svgRef.current || !graphData) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions

    // Create container group
    const g = svg.append('g')

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links)
        .id(d => d.id)
        .distance(100)
        .strength(0.3))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => d.size + 15))

    simulationRef.current = simulation

    // Draw links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', d => {
        switch (d.type) {
          case 'citation': return '#94a3b8'
          case 'coauthor': return '#722f37'
          case 'keyword': return '#228b22'
          default: return '#94a3b8'
        }
      })
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', d => Math.sqrt(d.weight))

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(d3.drag<any, GraphNode>()
        .on('start', (event, d: GraphNode) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d: GraphNode) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d: GraphNode) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))

    // Add glow effect
    node.append('circle')
      .attr('r', d => d.size + 10)
      .attr('fill', d => d.color)
      .attr('opacity', 0)
      .attr('class', 'glow')

    // Add main circle
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)

    // Add labels
    node.append('text')
      .text(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.size + 14)
      .attr('fill', '#374151')
      .attr('font-size', '10px')
      .attr('font-family', 'Georgia, serif')

    // Click handler
    node.on('click', (_, d) => {
      setSelectedNode(d)
      setAiAnalysis('')
    })

    // Hover effects
    node.on('mouseenter', function(_, d) {
      d3.select(this).select('.glow')
        .transition()
        .duration(200)
        .attr('opacity', 0.3)

      // Highlight connected links
      link.attr('stroke-opacity', (l: GraphLink) => {
        const sourceId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source
        const targetId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target
        return sourceId === d.id || targetId === d.id ? 0.8 : 0.1
      })
    })
    .on('mouseleave', function() {
      d3.select(this).select('.glow')
        .transition()
        .duration(200)
        .attr('opacity', 0)

      link.attr('stroke-opacity', 0.4)
    })

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [graphData, dimensions, setSelectedNode])

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const zoom = d3.zoom<SVGSVGElement, unknown>()

    if (direction === 'reset') {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
    } else {
      const scale = direction === 'in' ? 1.3 : 0.7
      svg.transition().duration(300).call(zoom.scaleBy, scale)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Search Header */}
      <div className="sticky top-16 md:top-20 z-40 bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索研究主题、作者或关键词..."
                className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-primary-900 placeholder-primary-400 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSearch}
                disabled={isSearching || !localQuery.trim()}
                className="px-6 py-3 bg-primary-900 hover:bg-primary-800 disabled:bg-primary-300 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                搜索
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border transition-colors ${
                  showFilters
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : 'bg-white border-primary-200 text-primary-500 hover:text-primary-700'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* API Key Warning */}
          {!settings.apiKey && (
            <div className="mt-3">
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 text-sm text-yellow-700 hover:text-yellow-800"
              >
                <AlertCircle className="w-4 h-4" />
                配置 API Key 以启用 AI 分析功能
              </Link>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Year Range */}
                  <div>
                    <label className="block text-sm text-primary-600 mb-2">年份范围</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={yearRange[0]}
                        onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                        className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-primary-900 text-sm"
                        min={1990}
                        max={2024}
                      />
                      <span className="text-primary-400">-</span>
                      <input
                        type="number"
                        value={yearRange[1]}
                        onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
                        className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-primary-900 text-sm"
                        min={1990}
                        max={2024}
                      />
                    </div>
                  </div>

                  {/* Min Citations */}
                  <div>
                    <label className="block text-sm text-primary-600 mb-2">最低引用数</label>
                    <input
                      type="number"
                      value={minCitations}
                      onChange={(e) => setMinCitations(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-primary-900 text-sm"
                      min={0}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Graph Container */}
          <div
            ref={containerRef}
            className={`flex-1 relative rounded-2xl overflow-hidden border border-primary-200 bg-gradient-to-br from-primary-50 to-white ${
              isFullscreen ? 'fixed inset-4 z-50' : ''
            }`}
          >
            {/* Graph Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                onClick={() => handleZoom('in')}
                className="p-2 bg-white/90 rounded-lg text-primary-600 hover:text-primary-900 transition-colors shadow-sm"
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom('out')}
                className="p-2 bg-white/90 rounded-lg text-primary-600 hover:text-primary-900 transition-colors shadow-sm"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom('reset')}
                className="p-2 bg-white/90 rounded-lg text-primary-600 hover:text-primary-900 transition-colors shadow-sm"
                title="重置视图"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-primary-200" />
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-white/90 rounded-lg text-primary-600 hover:text-primary-900 transition-colors shadow-sm"
                title={isFullscreen ? '退出全屏' : '全屏'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 text-xs">
              {Object.entries(nodeColors).map(([type, color]) => {
                const Icon = nodeIcons[type as keyof typeof nodeIcons]
                return (
                  <div key={type} className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <Icon className="w-3 h-3 text-primary-500" />
                    <span className="text-primary-600">
                      {type === 'paper' ? '论文' : type === 'author' ? '作者' : type === 'keyword' ? '关键词' : '机构'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Graph SVG */}
            {graphData ? (
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <Layers className="w-16 h-16 text-primary-300 mx-auto mb-4" />
                  <p className="text-primary-500 font-serif">输入搜索词开始探索知识图谱</p>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isSearching && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-primary-600 font-serif">正在构建知识图谱...</p>
                </div>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full lg:w-96 bg-white rounded-2xl p-6 border border-primary-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: selectedNode.color + '20' }}
                    >
                      {(() => {
                        const Icon = nodeIcons[selectedNode.type]
                        return <Icon className="w-5 h-5" style={{ color: selectedNode.color }} />
                      })()}
                    </div>
                    <div>
                      <span className="text-xs text-primary-500 capitalize font-serif">
                        {selectedNode.type === 'paper' ? '论文' : selectedNode.type === 'author' ? '作者' : '关键词'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 text-primary-400 hover:text-primary-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-serif text-primary-900 mb-4">{selectedNode.label}</h3>

                {selectedNode.type === 'paper' && selectedNode.data && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-primary-500">
                      <Calendar className="w-4 h-4" />
                      <span>{(selectedNode.data as Paper).year}</span>
                      <span className="mx-2">·</span>
                      <Quote className="w-4 h-4" />
                      <span>{(selectedNode.data as Paper).citations.toLocaleString()} 引用</span>
                    </div>

                    {(selectedNode.data as Paper).authors.length > 0 && (
                      <div className="text-sm text-primary-600">
                        <span className="font-medium">作者：</span>
                        {(selectedNode.data as Paper).authors.slice(0, 3).join(', ')}
                        {(selectedNode.data as Paper).authors.length > 3 && ' 等'}
                      </div>
                    )}

                    {(selectedNode.data as Paper).abstract && (
                      <p className="text-sm text-primary-600 leading-relaxed line-clamp-4">
                        {(selectedNode.data as Paper).abstract}
                      </p>
                    )}

                    {/* AI Analysis */}
                    {settings.apiKey && (
                      <div className="pt-4 border-t border-primary-100">
                        <button
                          onClick={() => handleAnalyzePaper(selectedNode.data as Paper)}
                          disabled={isAnalyzing}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm"
                        >
                          {isAnalyzing ? (
                            <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          AI 分析论文
                        </button>

                        {aiAnalysis && (
                          <div className="mt-3 p-3 bg-primary-50 rounded-lg text-sm text-primary-700 leading-relaxed">
                            {aiAnalysis}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-primary-100">
                      <a
                        href={(selectedNode.data as Paper).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-scholarly-navy hover:text-primary-900 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        查看完整论文
                      </a>
                    </div>
                  </div>
                )}

                {selectedNode.type === 'author' && selectedNode.data && (
                  <div className="space-y-4">
                    <div className="text-sm text-primary-600">
                      {(selectedNode.data as { name: string }).name}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm">
                    展开关联
                  </button>
                  <button className="p-2 bg-primary-50 text-primary-500 rounded-lg hover:text-primary-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-primary-50 text-primary-500 rounded-lg hover:text-primary-700 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Papers List */}
        {papers.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl text-primary-900 mb-4">搜索结果 ({papers.length} 篇论文)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {papers.slice(0, 10).map((paper: Paper) => (
                <div
                  key={paper.id}
                  className="p-4 bg-white border border-primary-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => {
                    const node = graphData?.nodes.find(n => n.id === `paper-${paper.id}`)
                    if (node) setSelectedNode(node)
                  }}
                >
                  <h3 className="font-serif text-primary-900 mb-2 line-clamp-2">{paper.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-primary-500">
                    <span>{paper.year}</span>
                    <span>·</span>
                    <span>{paper.citations} 引用</span>
                  </div>
                  <p className="mt-2 text-sm text-primary-600 line-clamp-2">{paper.authors.slice(0, 3).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
