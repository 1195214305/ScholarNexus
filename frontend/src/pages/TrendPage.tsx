import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Flame,
  Sparkles,
  Clock,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Users,
  AlertCircle
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore, Paper } from '../store'
import { searchPapers, getResearchRecommendations } from '../utils/api'

// 热门研究方向（基于真实搜索）
const trendingTopics = [
  {
    id: 1,
    name: 'Large Language Models',
    query: 'large language model',
    description: '大型语言模型在自然语言处理领域的突破性进展',
    relatedKeywords: ['GPT-4', 'LLaMA', 'Claude', 'Prompt Engineering'],
    trend: 'hot'
  },
  {
    id: 2,
    name: 'Multimodal Learning',
    query: 'multimodal learning',
    description: '多模态学习融合视觉、语言和音频信息',
    relatedKeywords: ['Vision-Language', 'CLIP', 'Flamingo', 'GPT-4V'],
    trend: 'rising'
  },
  {
    id: 3,
    name: 'AI for Science',
    query: 'AI for science',
    description: 'AI在科学发现中的应用，包括蛋白质结构预测、药物发现',
    relatedKeywords: ['AlphaFold', 'Drug Discovery', 'Materials Science'],
    trend: 'rising'
  },
  {
    id: 4,
    name: 'Efficient AI',
    query: 'efficient deep learning',
    description: '模型压缩、量化和高效推理技术',
    relatedKeywords: ['Quantization', 'Pruning', 'Knowledge Distillation'],
    trend: 'stable'
  },
  {
    id: 5,
    name: 'AI Safety & Alignment',
    query: 'AI safety alignment',
    description: 'AI安全性、可解释性和价值对齐研究',
    relatedKeywords: ['RLHF', 'Constitutional AI', 'Interpretability'],
    trend: 'hot'
  },
]

const emergingFields = [
  { name: 'Embodied AI', query: 'embodied AI robotics', description: '具身智能与机器人学习' },
  { name: 'World Models', query: 'world models prediction', description: '世界模型与预测学习' },
  { name: 'Neuro-Symbolic AI', query: 'neuro-symbolic AI', description: '神经符号融合方法' },
  { name: 'Federated Learning', query: 'federated learning privacy', description: '联邦学习与隐私保护' },
]

const trendIcons = {
  hot: Flame,
  rising: TrendingUp,
  stable: Minus,
  declining: TrendingDown
}

const trendColors = {
  hot: 'text-orange-600 bg-orange-50',
  rising: 'text-green-600 bg-green-50',
  stable: 'text-primary-500 bg-primary-50',
  declining: 'text-red-600 bg-red-50'
}

export default function TrendPage() {
  const navigate = useNavigate()
  const { settings, setSearchQuery } = useStore()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [topicPapers, setTopicPapers] = useState<Record<number, Paper[]>>({})
  const [loadingTopics, setLoadingTopics] = useState<Set<number>>(new Set())
  const [aiRecommendation, setAiRecommendation] = useState('')
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false)
  const [error, setError] = useState('')

  // 加载热门话题的论文数据
  const loadTopicPapers = async (topicId: number, query: string) => {
    if (topicPapers[topicId] || loadingTopics.has(topicId)) return

    setLoadingTopics(prev => new Set(prev).add(topicId))

    try {
      const papers = await searchPapers(query, 5)
      setTopicPapers(prev => ({ ...prev, [topicId]: papers }))
    } catch (err) {
      console.error('Failed to load topic papers:', err)
    } finally {
      setLoadingTopics(prev => {
        const next = new Set(prev)
        next.delete(topicId)
        return next
      })
    }
  }

  // 获取 AI 研究建议
  const getAIRecommendation = async () => {
    if (!settings.apiKey) {
      setError('请先在设置中配置 API Key')
      return
    }

    setIsLoadingRecommendation(true)
    setAiRecommendation('')
    setError('')

    try {
      // 收集所有已加载的论文
      const allPapers = Object.values(topicPapers).flat()
      if (allPapers.length === 0) {
        // 先加载一些论文
        const papers = await searchPapers('deep learning', 10)
        const recommendation = await getResearchRecommendations(settings.apiKey, 'AI research trends', papers)
        setAiRecommendation(recommendation)
      } else {
        const recommendation = await getResearchRecommendations(settings.apiKey, 'AI research trends', allPapers)
        setAiRecommendation(recommendation)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 分析失败')
    } finally {
      setIsLoadingRecommendation(false)
    }
  }

  const handleExplore = (query: string) => {
    setSearchQuery(query)
    navigate('/explore')
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary-900 mb-2">研究趋势</h1>
            <p className="text-primary-500 font-serif">追踪学术热点，发现新兴研究方向</p>
          </div>
          <div className="flex items-center gap-2 bg-primary-50 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-600 hover:text-primary-900'
                }`}
              >
                {period === 'week' ? '本周' : period === 'month' ? '本月' : '本年'}
              </button>
            ))}
          </div>
        </div>

        {/* API Key Warning */}
        {!settings.apiKey && (
          <div className="mb-6">
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">配置 API Key 以启用 AI 研究建议</span>
            </Link>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* AI Recommendation */}
        {settings.apiKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={getAIRecommendation}
              disabled={isLoadingRecommendation}
              className="w-full p-4 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingRecommendation ? (
                <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary-700" />
              )}
              <span className="text-primary-700 font-medium">获取 AI 研究方向建议</span>
            </button>

            {aiRecommendation && (
              <div className="mt-4 p-6 bg-white border border-primary-200 rounded-xl">
                <h3 className="font-serif text-lg text-primary-900 mb-3">AI 研究建议</h3>
                <p className="text-primary-600 leading-relaxed whitespace-pre-wrap">{aiRecommendation}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Trending Topics */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="font-serif text-xl text-primary-900">热门研究方向</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTopics.map((topic, index) => {
              const TrendIcon = trendIcons[topic.trend as keyof typeof trendIcons]
              const trendColor = trendColors[topic.trend as keyof typeof trendColors]
              const papers = topicPapers[topic.id] || []
              const isLoading = loadingTopics.has(topic.id)

              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-primary-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group"
                  onMouseEnter={() => loadTopicPapers(topic.id, topic.query)}
                  onClick={() => handleExplore(topic.query)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${trendColor}`}>
                      <TrendIcon className="w-3.5 h-3.5" />
                      {topic.trend === 'hot' ? '热门' : topic.trend === 'rising' ? '上升' : '稳定'}
                    </div>
                    {papers.length > 0 && (
                      <span className="text-sm text-primary-500">{papers.length} 篇相关</span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg text-primary-900 mb-2 group-hover:text-scholarly-navy transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-primary-500 mb-4 line-clamp-2">
                    {topic.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {topic.relatedKeywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-1 text-xs bg-primary-50 text-primary-600 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                    {topic.relatedKeywords.length > 3 && (
                      <span className="px-2 py-1 text-xs text-primary-400">
                        +{topic.relatedKeywords.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-primary-100 flex items-center justify-between">
                    <span className="text-sm text-scholarly-navy group-hover:text-primary-900 transition-colors flex items-center gap-1">
                      探索图谱
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Papers from Topics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border border-primary-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-scholarly-navy" />
                <h2 className="font-serif text-lg text-primary-900">热门话题论文</h2>
              </div>
              <button
                onClick={() => handleExplore('deep learning')}
                className="text-sm text-scholarly-navy hover:text-primary-900 transition-colors flex items-center gap-1"
              >
                查看更多
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.values(topicPapers).flat().slice(0, 5).map((paper) => (
                <div
                  key={paper.id}
                  className="p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer group"
                  onClick={() => window.open(paper.url, '_blank')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-scholarly-navy/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-scholarly-navy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-primary-900 group-hover:text-scholarly-navy transition-colors line-clamp-1">
                        {paper.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-primary-500">
                        <span>{paper.authors.slice(0, 2).join(', ')}</span>
                        <span>·</span>
                        <span>{paper.year}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-primary-900">{paper.citations} 引用</div>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(topicPapers).length === 0 && (
                <div className="text-center py-8 text-primary-400">
                  将鼠标悬停在热门话题上以加载相关论文
                </div>
              )}
            </div>
          </motion.div>

          {/* Emerging Fields */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-primary-200"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-scholarly-burgundy" />
              <h2 className="font-serif text-lg text-primary-900">新兴领域</h2>
            </div>

            <div className="space-y-4">
              {emergingFields.map((field) => (
                <div
                  key={field.name}
                  className="p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer group"
                  onClick={() => handleExplore(field.query)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-primary-900 group-hover:text-scholarly-navy transition-colors">
                      {field.name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-primary-500">{field.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleExplore('emerging AI research')}
              className="w-full mt-4 py-3 text-sm text-scholarly-navy hover:text-primary-900 transition-colors flex items-center justify-center gap-2 border border-primary-200 rounded-xl hover:border-primary-300"
            >
              发现更多新兴领域
              <ExternalLink className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Edge Computing Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-primary-900 rounded-2xl p-8"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl text-white mb-2">边缘计算驱动的趋势分析</h2>
            <p className="text-primary-300 font-serif">利用阿里云ESA边缘网络，实现实时学术趋势追踪</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-white/10">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-serif text-white mb-2">实时更新</h3>
              <p className="text-sm text-primary-300">边缘函数实时抓取最新论文数据，趋势分析即时更新</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/10">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-serif text-white mb-2">智能预测</h3>
              <p className="text-sm text-primary-300">基于历史数据和引用网络，预测研究方向发展趋势</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/10">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-serif text-white mb-2">个性化推荐</h3>
              <p className="text-sm text-primary-300">根据研究兴趣，边缘节点智能推荐相关热点</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
