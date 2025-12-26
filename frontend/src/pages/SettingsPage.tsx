import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Key,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Info
} from 'lucide-react'
import { useStore } from '../store'

export default function SettingsPage() {
  const { settings, updateSettings } = useStore()
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const handleSaveApiKey = () => {
    updateSettings({ apiKey })
    setTestStatus('idle')
  }

  const handleTestApiKey = async () => {
    if (!apiKey) {
      setTestStatus('error')
      setTestMessage('请先输入 API Key')
      return
    }

    setTestStatus('testing')
    setTestMessage('正在测试连接...')

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          messages: [{ role: 'user', content: '你好' }],
          max_tokens: 10,
        }),
      })

      if (response.ok) {
        setTestStatus('success')
        setTestMessage('API Key 验证成功！')
        updateSettings({ apiKey })
      } else {
        const error = await response.json().catch(() => ({}))
        setTestStatus('error')
        setTestMessage(error.error?.message || `验证失败: ${response.status}`)
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage('网络错误，请检查网络连接')
    }
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-6">
            <Settings className="w-8 h-8 text-primary-800" />
          </div>
          <h1 className="font-display text-4xl text-primary-900 mb-3">设置</h1>
          <p className="text-primary-500">配置您的 API 密钥以启用 AI 分析功能</p>
        </motion.div>

        {/* API Key Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-primary-700" />
            <h2 className="font-serif text-xl text-primary-900">通义千问 API Key</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="input w-full pr-12"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {testStatus !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testStatus === 'success' ? 'bg-green-50 text-green-700' :
                testStatus === 'error' ? 'bg-red-50 text-red-700' :
                'bg-primary-50 text-primary-700'
              }`}>
                {testStatus === 'success' && <Check className="w-5 h-5" />}
                {testStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                {testStatus === 'testing' && (
                  <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
                )}
                <span className="text-sm">{testMessage}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleTestApiKey}
                disabled={testStatus === 'testing'}
                className="btn-secondary flex-1"
              >
                测试连接
              </button>
              <button
                onClick={handleSaveApiKey}
                className="btn-primary flex-1"
              >
                保存
              </button>
            </div>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-5 h-5 text-primary-700" />
            <h2 className="font-serif text-xl text-primary-900">如何获取 API Key</h2>
          </div>

          <div className="space-y-4 text-primary-600">
            <p>
              ScholarNexus 使用通义千问大模型提供 AI 分析功能。您需要在阿里云百炼平台获取 API Key。
            </p>

            <ol className="list-decimal list-inside space-y-3 ml-2">
              <li>
                访问{' '}
                <a
                  href="https://bailian.console.aliyun.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-600 hover:text-accent-700 inline-flex items-center gap-1"
                >
                  阿里云百炼平台
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>登录或注册阿里云账号</li>
              <li>在控制台中创建 API Key</li>
              <li>复制 API Key 并粘贴到上方输入框</li>
            </ol>

            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-700">
                <strong>注意：</strong>您的 API Key 仅存储在本地浏览器中，不会上传到任何服务器。
                请妥善保管您的 API Key，不要分享给他人。
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            settings.apiKey ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            {settings.apiKey ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm">API Key 已配置</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">API Key 未配置</span>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
