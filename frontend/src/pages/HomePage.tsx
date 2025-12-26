import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  ArrowRight,
  Network,
  Users,
  BookOpen,
  TrendingUp,
  Zap,
  Globe,
  Database,
  Cpu,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store'
import KnowledgeGraphPreview from '../components/KnowledgeGraphPreview'

const features = [
  {
    icon: Network,
    title: '知识图谱可视化',
    description: '交互式图谱展示论文、作者、机构之间的复杂关系网络',
  },
  {
    icon: Users,
    title: '合作者发现',
    description: '基于研究方向和引用网络，智能推荐潜在合作者',
  },
  {
    icon: TrendingUp,
    title: '研究趋势追踪',
    description: '实时分析学术热点，预测研究方向发展趋势',
  },
  {
    icon: BookOpen,
    title: '文献深度分析',
    description: 'AI驱动的论文摘要、关键词提取和引用分析',
  }
]

const edgeFeatures = [
  {
    icon: Zap,
    title: '边缘计算加速',
    description: '图谱计算在边缘节点完成，响应延迟低于50ms',
    stat: '<50ms'
  },
  {
    icon: Globe,
    title: '全球边缘网络',
    description: '阿里云ESA全球节点，就近访问学术数据',
    stat: '2800+'
  },
  {
    icon: Database,
    title: '边缘数据缓存',
    description: '热门图谱数据边缘缓存，秒级加载',
    stat: '99.9%'
  },
  {
    icon: Cpu,
    title: '智能图谱构建',
    description: '边缘函数实时构建知识图谱，无需等待',
    stat: '实时'
  }
]

const sampleQueries = [
  'Deep Learning',
  'Transformer',
  'Graph Neural Networks',
  'Large Language Models',
  'Computer Vision'
]

export default function HomePage() {
  const navigate = useNavigate()
  const { setSearchQuery, settings } = useStore()
  const [query, setQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      setSearchQuery(query.trim())
      navigate('/explore')
    }
  }, [query, setSearchQuery, navigate])

  const handleSampleClick = (sample: string) => {
    setQuery(sample)
    setSearchQuery(sample)
    navigate('/explore')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isTyping) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTyping])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-white" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Decorative element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="ornament" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl text-primary-900 mb-6 leading-tight"
            >
              探索科研的
              <br />
              <span className="font-elegant italic text-scholarly-navy">知识图谱宇宙</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-primary-500 max-w-2xl mx-auto mb-10 leading-relaxed font-serif"
            >
              可视化学术网络，发现研究热点，追踪引用关系
              <br className="hidden sm:block" />
              让科研探索更高效、更直观
            </motion.p>

            {/* API Key Warning */}
            {!settings.apiKey && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mb-6"
              >
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">请先配置 API Key 以启用 AI 分析功能</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="relative group">
                <div className="relative flex items-center bg-white rounded-xl border border-primary-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <Search className="w-5 h-5 text-primary-400 ml-5" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="输入研究主题、作者或关键词..."
                    className="flex-1 px-4 py-4 bg-transparent text-primary-900 placeholder-primary-400 focus:outline-none text-lg"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!query.trim()}
                    className="m-2 px-6 py-2.5 bg-primary-900 text-white font-medium rounded-lg hover:bg-primary-800 disabled:bg-primary-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    探索
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Keyboard hint */}
              <p className="mt-3 text-sm text-primary-400">
                按 <kbd className="px-2 py-0.5 bg-primary-100 rounded text-primary-600 font-mono text-xs">/</kbd> 快速搜索
              </p>
            </motion.div>

            {/* Sample queries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2"
            >
              <span className="text-sm text-primary-400 mr-2">热门搜索:</span>
              {sampleQueries.map((sample) => (
                <button
                  key={sample}
                  onClick={() => handleSampleClick(sample)}
                  className="px-3 py-1.5 text-sm text-primary-600 bg-white hover:bg-primary-50 rounded-lg border border-primary-200 hover:border-primary-300 transition-all duration-200"
                >
                  {sample}
                </button>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-primary-300 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-primary-400 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Graph Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <span className="ornament mb-4" />
            <h2 className="font-display text-3xl sm:text-4xl text-primary-900 mb-4">
              交互式知识图谱
            </h2>
            <p className="text-primary-500 max-w-2xl mx-auto font-serif">
              实时可视化论文引用网络、作者合作关系、研究主题聚类
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden border border-primary-200 shadow-lg"
          >
            <KnowledgeGraphPreview />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="ornament mb-4" />
            <h2 className="font-display text-3xl sm:text-4xl text-primary-900 mb-4">
              为科研人员打造
            </h2>
            <p className="text-primary-500 max-w-2xl mx-auto font-serif">
              从文献检索到合作发现，全方位助力学术研究
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative p-8 rounded-2xl bg-white border border-primary-200 hover:border-primary-300 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 group-hover:bg-primary-900 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-primary-700 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-serif text-xl text-primary-900 mb-2">{feature.title}</h3>
                <p className="text-primary-500 leading-relaxed">{feature.description}</p>
                <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-primary-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Edge Computing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 mb-6">
              <Cpu className="w-4 h-4 text-primary-700" />
              <span className="text-sm text-primary-700 font-medium">How We Use Edge</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-primary-900 mb-4">
              边缘计算驱动的学术探索
            </h2>
            <p className="text-primary-500 max-w-2xl mx-auto font-serif">
              利用阿里云ESA边缘网络，实现毫秒级图谱计算和全球加速访问
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {edgeFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative p-6 rounded-2xl bg-primary-50 border border-primary-100 text-center group hover:bg-white hover:border-primary-200 hover:shadow-md transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-white flex items-center justify-center mb-4 group-hover:bg-primary-900 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary-700 group-hover:text-white transition-colors" />
                </div>
                <div className="text-2xl font-display text-primary-900 mb-2">{feature.stat}</div>
                <h3 className="font-serif text-lg text-primary-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-primary-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-6">
              开始探索学术宇宙
            </h2>
            <p className="text-lg text-primary-300 mb-8 max-w-2xl mx-auto font-serif">
              配置您的 API Key，即刻体验知识图谱的强大功能
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/explore')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200"
              >
                <Network className="w-5 h-5" />
                进入图谱探索
              </button>
              <Link
                to="/settings"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-xl border border-white/30 hover:bg-white/10 transition-all duration-200"
              >
                配置 API Key
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
