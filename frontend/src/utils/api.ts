import { Paper, GraphNode, GraphLink, GraphData } from '../store'

const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1'

// 调用通义千问API进行AI分析
export async function callQwenAPI(
  apiKey: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('请先在设置中配置通义千问 API Key')
  }

  const response = await fetch(QWEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API请求失败: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// 搜索学术论文 - 使用Semantic Scholar API (免费)
export async function searchPapers(query: string, limit: number = 20): Promise<Paper[]> {
  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=paperId,title,authors,year,citationCount,abstract,fieldsOfStudy,venue,externalIds`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`搜索失败: ${response.status}`)
    }

    const data = await response.json()

    return (data.data || []).map((paper: {
      paperId: string
      title: string
      authors?: Array<{ name: string }>
      year?: number
      citationCount?: number
      abstract?: string
      fieldsOfStudy?: string[]
      venue?: string
      externalIds?: { DOI?: string }
    }) => ({
      id: paper.paperId,
      title: paper.title || 'Untitled',
      authors: paper.authors?.map((a) => a.name) || [],
      year: paper.year || 0,
      citations: paper.citationCount || 0,
      abstract: paper.abstract || '',
      keywords: paper.fieldsOfStudy || [],
      venue: paper.venue || '',
      doi: paper.externalIds?.DOI,
      url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
    }))
  } catch (error) {
    console.error('Search error:', error)
    throw error
  }
}

// 获取论文详情
export async function getPaperDetails(paperId: string): Promise<Paper | null> {
  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/${paperId}?fields=paperId,title,authors,year,citationCount,abstract,fieldsOfStudy,venue,externalIds,references,citations`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const paper = await response.json()

    return {
      id: paper.paperId,
      title: paper.title || 'Untitled',
      authors: paper.authors?.map((a: { name: string }) => a.name) || [],
      year: paper.year || 0,
      citations: paper.citationCount || 0,
      abstract: paper.abstract || '',
      keywords: paper.fieldsOfStudy || [],
      venue: paper.venue || '',
      doi: paper.externalIds?.DOI,
      url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
    }
  } catch (error) {
    console.error('Get paper details error:', error)
    return null
  }
}

// 节点颜色配置 - 学术风格
const NODE_COLORS = {
  paper: '#1e3a5f',    // 深蓝
  author: '#722f37',   // 酒红
  keyword: '#228b22',  // 森林绿
  institution: '#b8860b', // 金色
}

// 构建知识图谱
export function buildKnowledgeGraph(papers: Paper[], query: string): GraphData {
  const nodes: Map<string, GraphNode> = new Map()
  const links: GraphLink[] = []
  const authorPapers: Map<string, string[]> = new Map()
  const keywordCounts: Map<string, number> = new Map()

  // 添加中心查询节点
  const centralNodeId = `query-${query.toLowerCase().replace(/\s+/g, '-')}`
  nodes.set(centralNodeId, {
    id: centralNodeId,
    label: query,
    type: 'keyword',
    size: 35,
    color: NODE_COLORS.keyword,
    data: { isQuery: true }
  })

  // 处理每篇论文
  papers.forEach(paper => {
    // 添加论文节点
    const paperNodeId = `paper-${paper.id}`
    const citationSize = Math.min(30, 12 + Math.log10(paper.citations + 1) * 5)

    nodes.set(paperNodeId, {
      id: paperNodeId,
      label: paper.title.length > 40 ? paper.title.substring(0, 40) + '...' : paper.title,
      type: 'paper',
      size: citationSize,
      color: NODE_COLORS.paper,
      data: paper
    })

    // 连接到中心查询节点
    links.push({
      source: centralNodeId,
      target: paperNodeId,
      weight: 2,
      type: 'keyword'
    })

    // 处理作者
    paper.authors.slice(0, 3).forEach(authorName => {
      const authorNodeId = `author-${authorName.toLowerCase().replace(/\s+/g, '-')}`

      if (!authorPapers.has(authorNodeId)) {
        authorPapers.set(authorNodeId, [])
      }
      authorPapers.get(authorNodeId)!.push(paperNodeId)

      if (!nodes.has(authorNodeId)) {
        nodes.set(authorNodeId, {
          id: authorNodeId,
          label: authorName,
          type: 'author',
          size: 12,
          color: NODE_COLORS.author,
          data: { name: authorName }
        })
      }

      // 作者-论文关系
      links.push({
        source: authorNodeId,
        target: paperNodeId,
        weight: 2,
        type: 'coauthor'
      })
    })

    // 处理关键词
    paper.keywords.slice(0, 3).forEach(keyword => {
      const keywordNodeId = `keyword-${keyword.toLowerCase().replace(/\s+/g, '-')}`
      keywordCounts.set(keywordNodeId, (keywordCounts.get(keywordNodeId) || 0) + 1)

      if (!nodes.has(keywordNodeId) && keyword.toLowerCase() !== query.toLowerCase()) {
        nodes.set(keywordNodeId, {
          id: keywordNodeId,
          label: keyword,
          type: 'keyword',
          size: 15,
          color: NODE_COLORS.keyword,
          data: { keyword }
        })

        links.push({
          source: keywordNodeId,
          target: paperNodeId,
          weight: 1,
          type: 'keyword'
        })
      }
    })
  })

  // 更新作者节点大小
  authorPapers.forEach((paperIds, authorNodeId) => {
    const node = nodes.get(authorNodeId)
    if (node) {
      node.size = Math.min(25, 12 + paperIds.length * 3)
    }
  })

  // 更新关键词节点大小
  keywordCounts.forEach((count, keywordNodeId) => {
    const node = nodes.get(keywordNodeId)
    if (node) {
      node.size = Math.min(25, 15 + count * 2)
    }
  })

  return {
    nodes: Array.from(nodes.values()),
    links,
  }
}

// AI分析论文
export async function analyzePaperWithAI(
  apiKey: string,
  paper: Paper
): Promise<string> {
  const systemPrompt = `你是一位专业的学术研究助手。请用简洁专业的中文分析论文，包括：
1. 研究主题和贡献
2. 主要方法或技术
3. 研究意义和影响
请控制在200字以内。`

  const prompt = `请分析这篇论文：
标题：${paper.title}
作者：${paper.authors.join(', ')}
年份：${paper.year}
引用数：${paper.citations}
摘要：${paper.abstract || '无摘要'}
关键词：${paper.keywords.join(', ') || '无'}`

  return callQwenAPI(apiKey, prompt, systemPrompt)
}

// AI分析研究趋势
export async function analyzeTrendsWithAI(
  apiKey: string,
  papers: Paper[]
): Promise<string> {
  const systemPrompt = `你是一位专业的学术研究分析师。请基于提供的论文数据，分析研究趋势，包括：
1. 主要研究方向
2. 热门话题
3. 发展趋势预测
请用简洁专业的中文回答，控制在300字以内。`

  const paperSummary = papers.slice(0, 10).map(p =>
    `- ${p.title} (${p.year}, 引用:${p.citations})`
  ).join('\n')

  const prompt = `请分析以下论文的研究趋势：\n${paperSummary}`

  return callQwenAPI(apiKey, prompt, systemPrompt)
}

// AI推荐相关研究
export async function getResearchRecommendations(
  apiKey: string,
  query: string,
  papers: Paper[]
): Promise<string> {
  const systemPrompt = `你是一位专业的学术研究顾问。请基于用户的研究兴趣和相关论文，提供研究建议，包括：
1. 可能的研究方向
2. 值得关注的问题
3. 潜在的合作领域
请用简洁专业的中文回答，控制在250字以内。`

  const paperSummary = papers.slice(0, 5).map(p =>
    `- ${p.title} (${p.year})`
  ).join('\n')

  const prompt = `用户研究兴趣：${query}\n\n相关论文：\n${paperSummary}\n\n请提供研究建议。`

  return callQwenAPI(apiKey, prompt, systemPrompt)
}
