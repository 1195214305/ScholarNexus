import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Network,
  BarChart3,
  TrendingUp,
  Settings,
  Menu,
  X,
  Github,
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react'
import { useStore } from '../store'

const navItems = [
  { path: '/', label: '首页', icon: Search },
  { path: '/explore', label: '图谱探索', icon: Network },
  { path: '/analysis', label: '深度分析', icon: BarChart3 },
  { path: '/trends', label: '研究趋势', icon: TrendingUp },
  { path: '/settings', label: '设置', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  const { settings } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-primary-100' : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-primary-900 flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl text-primary-900 tracking-tight">
                  Scholar<span className="font-elegant text-scholarly-navy">Nexus</span>
                </h1>
                <p className="text-xs text-primary-400 -mt-0.5 font-serif italic">科研知识图谱</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'text-primary-900'
                        : 'text-primary-500 hover:text-primary-900 hover:bg-primary-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.path === '/settings' && (
                      <span className={`w-2 h-2 rounded-full ${settings.apiKey ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-primary-100 rounded-lg -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* API Status */}
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
                settings.apiKey ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {settings.apiKey ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {settings.apiKey ? 'AI 已启用' : 'AI 未配置'}
              </div>

              <a
                href="https://github.com/1195214305/ScholarNexus"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-primary-500 hover:text-primary-900 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-primary-500 hover:text-primary-900 hover:bg-primary-50 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-primary-100"
            >
              <nav className="px-4 py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-primary-500 hover:text-primary-900 hover:bg-primary-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                      {item.path === '/settings' && (
                        <span className={`ml-auto w-2 h-2 rounded-full ${settings.apiKey ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-900 flex items-center justify-center">
                  <Network className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-lg text-primary-900">
                  Scholar<span className="font-elegant text-scholarly-navy">Nexus</span>
                </span>
              </div>
              <p className="text-sm text-primary-500 leading-relaxed">
                基于边缘计算的科研知识图谱发现平台，帮助研究人员探索学术网络、发现研究热点。
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold text-primary-900 mb-4">快速链接</h3>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-sm text-primary-500 hover:text-primary-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ESA Badge */}
            <div>
              <h3 className="text-sm font-semibold text-primary-900 mb-4">技术支持</h3>
              <a
                href="https://www.aliyun.com/product/esa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-primary-200 hover:border-primary-300 transition-colors group"
              >
                <img
                  src="https://img.alicdn.com/imgextra/i3/O1CN01H1UU3i1Cti9lYtFrs_!!6000000000139-2-tps-7534-844.png"
                  alt="阿里云ESA"
                  className="h-5 object-contain"
                />
                <ExternalLink className="w-3 h-3 text-primary-400 group-hover:text-primary-600 transition-colors" />
              </a>
              <p className="mt-3 text-xs text-primary-400">
                本项目由阿里云ESA提供加速、计算和保护
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-primary-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-primary-400">
              © 2024 ScholarNexus. 基于阿里云ESA边缘计算构建
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-primary-400 hover:text-primary-600 transition-colors">
                隐私政策
              </a>
              <a href="#" className="text-xs text-primary-400 hover:text-primary-600 transition-colors">
                使用条款
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
