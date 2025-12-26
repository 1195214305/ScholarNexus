import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { motion } from 'framer-motion'

interface Node {
  id: string
  label: string
  type: 'paper' | 'author' | 'keyword'
  size: number
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

interface Link {
  source: string | Node
  target: string | Node
  weight: number
}

// Sample data for preview - 学术风格
const sampleNodes: Node[] = [
  { id: '1', label: 'Deep Learning', type: 'keyword', size: 30 },
  { id: '2', label: 'Neural Networks', type: 'keyword', size: 25 },
  { id: '3', label: 'Computer Vision', type: 'keyword', size: 22 },
  { id: '4', label: 'NLP', type: 'keyword', size: 20 },
  { id: '5', label: 'Transformer', type: 'keyword', size: 28 },
  { id: '6', label: 'Attention Mechanism', type: 'paper', size: 18 },
  { id: '7', label: 'BERT', type: 'paper', size: 24 },
  { id: '8', label: 'GPT', type: 'paper', size: 26 },
  { id: '9', label: 'ResNet', type: 'paper', size: 22 },
  { id: '10', label: 'YOLO', type: 'paper', size: 20 },
  { id: '11', label: 'Hinton', type: 'author', size: 20 },
  { id: '12', label: 'LeCun', type: 'author', size: 18 },
  { id: '13', label: 'Bengio', type: 'author', size: 18 },
  { id: '14', label: 'Vaswani', type: 'author', size: 16 },
  { id: '15', label: 'He', type: 'author', size: 16 },
]

const sampleLinks: Link[] = [
  { source: '1', target: '2', weight: 5 },
  { source: '1', target: '3', weight: 4 },
  { source: '1', target: '4', weight: 4 },
  { source: '1', target: '5', weight: 5 },
  { source: '2', target: '6', weight: 3 },
  { source: '5', target: '6', weight: 4 },
  { source: '5', target: '7', weight: 5 },
  { source: '5', target: '8', weight: 5 },
  { source: '4', target: '7', weight: 4 },
  { source: '4', target: '8', weight: 4 },
  { source: '3', target: '9', weight: 4 },
  { source: '3', target: '10', weight: 3 },
  { source: '11', target: '1', weight: 5 },
  { source: '12', target: '1', weight: 5 },
  { source: '13', target: '1', weight: 5 },
  { source: '14', target: '5', weight: 4 },
  { source: '15', target: '9', weight: 4 },
  { source: '11', target: '12', weight: 3 },
  { source: '12', target: '13', weight: 3 },
  { source: '11', target: '13', weight: 3 },
]

// 学术风格配色
const nodeColors = {
  paper: '#1e3a5f',    // 深蓝
  author: '#722f37',   // 酒红
  keyword: '#228b22',  // 森林绿
}

export default function KnowledgeGraphPreview() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect()
      setDimensions({
        width: width,
        height: Math.min(500, width * 0.6)
      })
    }
  }, [])

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [updateDimensions])

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions

    // Create gradient definitions
    const defs = svg.append('defs')

    // Radial gradient for glow effect
    const glowGradient = defs.append('radialGradient')
      .attr('id', 'nodeGlow')
    glowGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1e3a5f')
      .attr('stop-opacity', 0.6)
    glowGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1e3a5f')
      .attr('stop-opacity', 0)

    // Create container group
    const g = svg.append('g')

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create simulation
    const simulation = d3.forceSimulation<Node>(sampleNodes)
      .force('link', d3.forceLink<Node, Link>(sampleLinks)
        .id(d => d.id)
        .distance(80)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<Node>().radius(d => d.size + 10))

    // Draw links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(sampleLinks)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', d => Math.sqrt(d.weight))

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(sampleNodes)
      .join('g')
      .attr('cursor', 'pointer')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(d3.drag<any, Node>()
        .on('start', (event, d: Node) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d: Node) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d: Node) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))

    // Add glow effect
    node.append('circle')
      .attr('r', d => d.size + 8)
      .attr('fill', 'url(#nodeGlow)')
      .attr('opacity', 0)
      .attr('class', 'glow')

    // Add main circle
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => nodeColors[d.type])
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)

    // Add inner circle
    node.append('circle')
      .attr('r', d => d.size * 0.4)
      .attr('fill', '#ffffff')
      .attr('opacity', 0.2)

    // Add labels
    node.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.size + 16)
      .attr('fill', '#374151')
      .attr('font-size', '10px')
      .attr('font-family', 'Georgia, serif')

    // Hover effects
    node.on('mouseenter', function(_, d) {
      setHoveredNode(d)
      d3.select(this).select('.glow')
        .transition()
        .duration(200)
        .attr('opacity', 0.6)
      d3.select(this).select('circle:nth-child(2)')
        .transition()
        .duration(200)
        .attr('r', d.size * 1.2)
    })
    .on('mouseleave', function(_, d) {
      setHoveredNode(null)
      d3.select(this).select('.glow')
        .transition()
        .duration(200)
        .attr('opacity', 0)
      d3.select(this).select('circle:nth-child(2)')
        .transition()
        .duration(200)
        .attr('r', d.size)
    })

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [dimensions])

  return (
    <div ref={containerRef} className="relative bg-gradient-to-br from-primary-50 to-white">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.keyword }} />
          <span className="text-primary-600">关键词</span>
        </div>
        <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.paper }} />
          <span className="text-primary-600">论文</span>
        </div>
        <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.author }} />
          <span className="text-primary-600">作者</span>
        </div>
      </div>

      {/* Hover info */}
      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 px-4 py-3 bg-white rounded-lg shadow-md border border-primary-200"
        >
          <div className="text-sm font-serif text-primary-900">{hoveredNode.label}</div>
          <div className="text-xs text-primary-500 capitalize">
            {hoveredNode.type === 'paper' ? '论文' : hoveredNode.type === 'author' ? '作者' : '关键词'}
          </div>
        </motion.div>
      )}

      {/* Interaction hint */}
      <div className="absolute bottom-4 right-4 text-xs text-primary-400">
        拖拽节点 · 滚轮缩放
      </div>
    </div>
  )
}
