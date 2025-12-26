import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Globe,
  Search,
  Filter,
  Download,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore, Paper } from '../store'
import { searchPapers, analyzeTrendsWithAI } from '../utils/api'

export default function AnalysisPage() {
  const { papers, settings } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMetric, setSelectedMetric] = useState<'papers' | 'citations'>('papers')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Paper[]>([])
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  // 使用搜索结果或已有论文
  const analysisData = searchResults.length > 0 ? searchResults : papers

  // 计算统计数据
  const stats = {
    totalPapers: analysisData.length,
    totalCitations: analysisData.reduce((sum: number, p: Paper) => sum + p.citations, 0),
    avgCitationsPerPaper: analysisData.length > 0
      ? (analysisData.reduce((sum: number, p: Paper) => sum + p.citations, 0) / analysisData.length).toFixed(1)
      : '0',
    maxCitations: analysisData.length > 0 ? Math.max(...analysisData.map((p: Paper) => p.citations)) : 0,
    yearRange: analysisData.length > 0
      ? `${Math.min(...analysisData.map((p: Paper) => p.year))}-${Math.max(...analysisData.map((p: Paper) => p.year))}`
      : '-'
  }

  // 按年份分组
  const yearlyData = analysisData.reduce((acc: Record<number, { papers: number; citations: number }>, paper: Paper) => {
    const year = paper.year
    if (!acc[year]) {
      acc[year] = { papers: 0, citations: 0 }
    }
    acc[year].papers++
    acc[year].citations += paper.citations
    return acc
  }, {} as Record<number, { papers: number; citations: number }>)

  const yearlyTrend = Object.entries(yearlyData)
    .map(([year, data]) => ({ year: parseInt(year), papers: data.papers, citations: data.citations }))
    .sort((a, b) => a.year - b.year)

  // 提取关键词统计
  const keywordStats = analysisData.reduce((acc: Record<string, number>, paper: Paper) => {
    paper.keywords.forEach((keyword: string) => {
      if (!acc[keyword]) {
        acc[keyword] = 0
      }
      acc[keyword]++
    })
    return acc
  }, {} as Record<string, number>)

  const topKeywords = Object.entries(keywordStats)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count: count as number }))

  // 提取作者统计
  const authorStats = analysisData.reduce((acc: Record<string, { papers: number; citations: number }>, paper: Paper) => {
    paper.authors.forEach((author: string) => {
      if (!acc[author]) {
        acc[author] = { papers: 0, citations: 0 }
      }
      acc[author].papers++
      acc[author].citations += paper.citations
    })
    return acc
  }, {} as Record<string, { papers: number; citations: number }>)

  const topAuthors = Object.entries(authorStats)
    .sort((a, b) => (b[1] as { papers: number; citations: number }).citations - (a[1] as { papers: number; citations: number }).citations)
    .slice(0, 5)
    .map(([name, data]) => ({ name, papers: (data as { papers: number; citations: number }).papers, citations: (data as { papers: number; citations: number }).citations }))

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError('')

    try {
      const results = await searchPapers(searchQuery, 30)
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAIAnalysis = async () => {
    if (!settings.apiKey) {
      setError('请先在设置中配置 API Key')
      return
    }

    if (analysisData.length === 0) {
      setError('请先搜索论文数据')
      return
    }

    setIsAnalyzing(true)
    setAiAnalysis('')

    try {
      const analysis = await analyzeTrendsWithAI(settings.apiKey, analysisData)
      setAiAnalysis(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 分析失败')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const maxYearlyValue = yearlyTrend.length > 0
    ? Math.max(...yearlyTrend.map(d => selectedMetric === 'papers' ? d.papers : d.citations))
    : 1

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-primary-900 mb-2">深度分析</h1>
          <p className="text-primary-500 font-serif">探索学术领域的统计数据和趋势洞察</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索研究领域进行分析..."
              className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-primary-900 placeholder-primary-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-primary-900 text-white rounded-xl hover:bg-primary-800 disabled:bg-primary-300 transition-colors flex items-center gap-2"
          >
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            分析
          </button>
          <button className="px-4 py-3 bg-white border border-primary-200 rounded-xl text-primary-600 hover:text-primary-900 transition-colors flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选
          </button>
          <button className="px-4 py-3 bg-white border border-primary-200 rounded-xl text-primary-600 hover:text-primary-900 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            导出
          </button>
        </div>

        {/* API Key Warning */}
        {!settings.apiKey && (
          <div className="mb-6">
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">配置 API Key 以启用 AI 趋势分析</span>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: '总论文数', value: stats.totalPapers.toLocaleString(), icon: BookOpen, color: 'scholarly-navy' },
            { label: '总引用数', value: stats.totalCitations.toLocaleString(), icon: TrendingUp, color: 'scholarly-forest' },
            { label: '平均引用', value: stats.avgCitationsPerPaper, icon: BarChart3, color: 'scholarly-burgundy' },
            { label: '最高引用', value: stats.maxCitations.toLocaleString(), icon: Users, color: 'scholarly-gold' },
            { label: '年份范围', value: stats.yearRange, icon: Globe, color: 'scholarly-navy' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white rounded-xl border border-primary-200 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-primary-700" />
                </div>
              </div>
              <div className="text-2xl font-display text-primary-900">{stat.value}</div>
              <div className="text-sm text-primary-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* AI Analysis Button */}
        {settings.apiKey && analysisData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="w-full p-4 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary-700" />
              )}
              <span className="text-primary-700 font-medium">AI 智能分析研究趋势</span>
            </button>

            {aiAnalysis && (
              <div className="mt-4 p-6 bg-white border border-primary-200 rounded-xl">
                <h3 className="font-serif text-lg text-primary-900 mb-3">AI 分析结果</h3>
                <p className="text-primary-600 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Yearly Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-primary-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg text-primary-900">年度趋势</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMetric('papers')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedMetric === 'papers'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-primary-500 hover:text-primary-700'
                  }`}
                >
                  论文数
                </button>
                <button
                  onClick={() => setSelectedMetric('citations')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedMetric === 'citations'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-primary-500 hover:text-primary-700'
                  }`}
                >
                  引用数
                </button>
              </div>
            </div>

            {yearlyTrend.length > 0 ? (
              <div className="h-64 flex items-end gap-2">
                {yearlyTrend.map((data, index) => {
                  const value = selectedMetric === 'papers' ? data.papers : data.citations
                  const height = (value / maxYearlyValue) * 100
                  return (
                    <div key={data.year} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        className="w-full bg-gradient-to-t from-scholarly-navy to-scholarly-navy/70 rounded-t-lg relative group cursor-pointer"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary-900 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {value.toLocaleString()}
                        </div>
                      </motion.div>
                      <span className="text-xs text-primary-500">{data.year}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-primary-400">
                搜索论文以查看年度趋势
              </div>
            )}
          </motion.div>

          {/* Keyword Cloud */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-primary-200"
          >
            <h2 className="font-serif text-lg text-primary-900 mb-6">热门关键词</h2>
            {topKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topKeywords.map((item, index) => {
                  const size = Math.max(12, Math.min(20, 12 + (item.count * 2)))
                  return (
                    <motion.div
                      key={item.keyword}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer group"
                    >
                      <span className="text-primary-700 group-hover:text-primary-900 transition-colors" style={{ fontSize: `${size}px` }}>
                        {item.keyword}
                      </span>
                      <span className="ml-2 text-xs text-primary-400">
                        {item.count}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-primary-400">
                搜索论文以查看关键词分布
              </div>
            )}
          </motion.div>
        </div>

        {/* Top Authors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-primary-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-lg text-primary-900">高产作者</h2>
            <Users className="w-5 h-5 text-primary-400" />
          </div>
          {topAuthors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {topAuthors.map((author, index) => (
                <div
                  key={author.name}
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-scholarly-burgundy flex items-center justify-center text-white font-display text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-primary-900 truncate">{author.name}</div>
                    <div className="text-sm text-primary-500">
                      {author.papers} 论文 · {author.citations.toLocaleString()} 引用
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-primary-400">
              搜索论文以查看作者统计
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
