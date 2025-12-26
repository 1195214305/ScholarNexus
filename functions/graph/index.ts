/**
 * ScholarNexus - 知识图谱构建边缘函数
 *
 * 功能：
 * 1. 解析论文数据，提取实体和关系
 * 2. 构建知识图谱节点和边
 * 3. 计算图谱布局
 * 4. 支持增量更新
 */

interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  citations: number;
  abstract: string;
  keywords: string[];
  venue: string;
  references?: string[];
  doi?: string;
}

interface Author {
  id: string;
  name: string;
  affiliation?: string;
  papers: string[];
}

interface GraphNode {
  id: string;
  label: string;
  type: 'paper' | 'author' | 'keyword' | 'institution';
  size: number;
  color: string;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
}

interface GraphLink {
  source: string;
  target: string;
  weight: number;
  type: 'citation' | 'coauthor' | 'keyword' | 'affiliation';
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata: {
    totalNodes: number;
    totalLinks: number;
    buildTime: number;
    query: string;
  };
}

// 节点颜色配置
const NODE_COLORS = {
  paper: '#38b2ac',
  author: '#667eea',
  keyword: '#ed8936',
  institution: '#e53e3e'
};

// 节点大小计算
function calculateNodeSize(type: string, metrics: { citations?: number; papers?: number; count?: number }): number {
  const baseSize = {
    paper: 15,
    author: 12,
    keyword: 20,
    institution: 18
  };

  const base = baseSize[type as keyof typeof baseSize] || 10;

  if (type === 'paper' && metrics.citations) {
    return base + Math.min(20, Math.log10(metrics.citations + 1) * 5);
  }
  if (type === 'author' && metrics.papers) {
    return base + Math.min(15, metrics.papers * 0.5);
  }
  if (type === 'keyword' && metrics.count) {
    return base + Math.min(15, metrics.count * 2);
  }

  return base;
}

// 构建知识图谱
function buildKnowledgeGraph(papers: Paper[], query: string): GraphData {
  const startTime = Date.now();
  const nodes: Map<string, GraphNode> = new Map();
  const links: GraphLink[] = [];
  const authorPapers: Map<string, string[]> = new Map();
  const keywordCounts: Map<string, number> = new Map();

  // 添加中心查询节点
  const centralNodeId = `query-${query.toLowerCase().replace(/\s+/g, '-')}`;
  nodes.set(centralNodeId, {
    id: centralNodeId,
    label: query,
    type: 'keyword',
    size: 35,
    color: NODE_COLORS.keyword,
    data: { isQuery: true }
  });

  // 处理每篇论文
  papers.forEach(paper => {
    // 添加论文节点
    const paperNodeId = `paper-${paper.id}`;
    nodes.set(paperNodeId, {
      id: paperNodeId,
      label: paper.title.length > 40 ? paper.title.substring(0, 40) + '...' : paper.title,
      type: 'paper',
      size: calculateNodeSize('paper', { citations: paper.citations }),
      color: NODE_COLORS.paper,
      data: {
        id: paper.id,
        title: paper.title,
        year: paper.year,
        citations: paper.citations,
        abstract: paper.abstract,
        venue: paper.venue,
        doi: paper.doi
      }
    });

    // 连接到中心查询节点
    links.push({
      source: centralNodeId,
      target: paperNodeId,
      weight: 2,
      type: 'keyword'
    });

    // 处理作者
    paper.authors.forEach(authorName => {
      const authorNodeId = `author-${authorName.toLowerCase().replace(/\s+/g, '-')}`;

      if (!authorPapers.has(authorNodeId)) {
        authorPapers.set(authorNodeId, []);
      }
      authorPapers.get(authorNodeId)!.push(paperNodeId);

      if (!nodes.has(authorNodeId)) {
        nodes.set(authorNodeId, {
          id: authorNodeId,
          label: authorName,
          type: 'author',
          size: 12,
          color: NODE_COLORS.author,
          data: { name: authorName }
        });
      }

      // 作者-论文关系
      links.push({
        source: authorNodeId,
        target: paperNodeId,
        weight: 2,
        type: 'coauthor'
      });
    });

    // 处理关键词
    paper.keywords.forEach(keyword => {
      const keywordNodeId = `keyword-${keyword.toLowerCase().replace(/\s+/g, '-')}`;
      keywordCounts.set(keywordNodeId, (keywordCounts.get(keywordNodeId) || 0) + 1);

      if (!nodes.has(keywordNodeId) && keyword.toLowerCase() !== query.toLowerCase()) {
        nodes.set(keywordNodeId, {
          id: keywordNodeId,
          label: keyword,
          type: 'keyword',
          size: 15,
          color: NODE_COLORS.keyword,
          data: { keyword }
        });
      }

      if (nodes.has(keywordNodeId)) {
        links.push({
          source: keywordNodeId,
          target: paperNodeId,
          weight: 1,
          type: 'keyword'
        });
      }
    });

    // 处理引用关系
    if (paper.references) {
      paper.references.forEach(refId => {
        const refNodeId = `paper-${refId}`;
        if (nodes.has(refNodeId)) {
          links.push({
            source: paperNodeId,
            target: refNodeId,
            weight: 3,
            type: 'citation'
          });
        }
      });
    }
  });

  // 更新作者节点大小
  authorPapers.forEach((paperIds, authorNodeId) => {
    const node = nodes.get(authorNodeId);
    if (node) {
      node.size = calculateNodeSize('author', { papers: paperIds.length });
    }
  });

  // 更新关键词节点大小
  keywordCounts.forEach((count, keywordNodeId) => {
    const node = nodes.get(keywordNodeId);
    if (node) {
      node.size = calculateNodeSize('keyword', { count });
    }
  });

  // 添加合作者关系
  authorPapers.forEach((paperIds, authorNodeId) => {
    if (paperIds.length > 1) {
      // 找到共同作者
      const coauthors = new Set<string>();
      paperIds.forEach(paperId => {
        links.forEach(link => {
          if (link.target === paperId && link.type === 'coauthor') {
            const sourceId = typeof link.source === 'string' ? link.source : link.source;
            if (sourceId !== authorNodeId && sourceId.startsWith('author-')) {
              coauthors.add(sourceId);
            }
          }
        });
      });

      // 添加合作者边
      coauthors.forEach(coauthorId => {
        // 检查是否已存在
        const exists = links.some(l =>
          (l.source === authorNodeId && l.target === coauthorId) ||
          (l.source === coauthorId && l.target === authorNodeId)
        );
        if (!exists) {
          links.push({
            source: authorNodeId,
            target: coauthorId,
            weight: 1,
            type: 'coauthor'
          });
        }
      });
    }
  });

  const buildTime = Date.now() - startTime;

  return {
    nodes: Array.from(nodes.values()),
    links,
    metadata: {
      totalNodes: nodes.size,
      totalLinks: links.length,
      buildTime,
      query
    }
  };
}

// 简单的力导向布局初始化
function initializeLayout(graph: GraphData, width: number, height: number): GraphData {
  const centerX = width / 2;
  const centerY = height / 2;

  graph.nodes.forEach((node, index) => {
    if (node.data?.isQuery) {
      node.x = centerX;
      node.y = centerY;
    } else {
      // 按类型分层布局
      const angle = (index / graph.nodes.length) * 2 * Math.PI;
      const radius = node.type === 'paper' ? 200 : node.type === 'author' ? 350 : 150;
      node.x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50;
      node.y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50;
    }
  });

  return graph;
}

// 边缘函数主处理器
export async function onRequest(context: {
  request: Request;
  env: {
    GRAPH_CACHE: KVNamespace;
    AI_API_KEY?: string;
  };
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const query = url.searchParams.get('q') || '';
    const action = url.searchParams.get('action') || 'build';

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 检查缓存
    const cacheKey = `graph:${query.toLowerCase()}`;
    const cached = await env.GRAPH_CACHE?.get(cacheKey);

    if (cached && action !== 'refresh') {
      return new Response(cached, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Edge-Location': 'aliyun-esa'
        }
      });
    }

    // 模拟从学术API获取数据（实际应用中应调用真实API）
    const papers = await fetchPaperData(query);

    // 构建知识图谱
    const graph = buildKnowledgeGraph(papers, query);

    // 初始化布局
    const layoutGraph = initializeLayout(graph, 800, 600);

    const result = JSON.stringify(layoutGraph);

    // 缓存结果（1小时）
    await env.GRAPH_CACHE?.put(cacheKey, result, { expirationTtl: 3600 });

    return new Response(result, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Build-Time': `${graph.metadata.buildTime}ms`,
        'X-Edge-Location': 'aliyun-esa'
      }
    });

  } catch (error) {
    console.error('Graph build error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to build knowledge graph' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// 模拟论文数据获取（实际应用中应调用Semantic Scholar、OpenAlex等API）
async function fetchPaperData(query: string): Promise<Paper[]> {
  // 模拟数据 - 实际应用中应调用真实学术API
  const mockPapers: Paper[] = [
    {
      id: '1',
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
      year: 2017,
      citations: 89234,
      abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
      keywords: [query, 'Transformer', 'Attention', 'Neural Network'],
      venue: 'NeurIPS',
      doi: '10.5555/3295222.3295349'
    },
    {
      id: '2',
      title: 'BERT: Pre-training of Deep Bidirectional Transformers',
      authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
      year: 2019,
      citations: 67890,
      abstract: 'We introduce a new language representation model called BERT...',
      keywords: [query, 'BERT', 'Pre-training', 'NLP'],
      venue: 'NAACL',
      references: ['1']
    },
    {
      id: '3',
      title: 'Language Models are Few-Shot Learners',
      authors: ['Tom Brown', 'Benjamin Mann', 'Nick Ryder'],
      year: 2020,
      citations: 45678,
      abstract: 'Recent work has demonstrated substantial gains on many NLP tasks...',
      keywords: [query, 'GPT-3', 'Few-shot Learning', 'Language Model'],
      venue: 'NeurIPS',
      references: ['1', '2']
    },
    {
      id: '4',
      title: 'Deep Residual Learning for Image Recognition',
      authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
      year: 2016,
      citations: 123456,
      abstract: 'Deeper neural networks are more difficult to train...',
      keywords: [query, 'ResNet', 'Deep Learning', 'Computer Vision'],
      venue: 'CVPR'
    },
    {
      id: '5',
      title: 'ImageNet Classification with Deep Convolutional Neural Networks',
      authors: ['Alex Krizhevsky', 'Ilya Sutskever', 'Geoffrey Hinton'],
      year: 2012,
      citations: 98765,
      abstract: 'We trained a large, deep convolutional neural network...',
      keywords: [query, 'AlexNet', 'CNN', 'Image Classification'],
      venue: 'NeurIPS'
    },
    {
      id: '6',
      title: 'Generative Adversarial Networks',
      authors: ['Ian Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza'],
      year: 2014,
      citations: 56789,
      abstract: 'We propose a new framework for estimating generative models...',
      keywords: [query, 'GAN', 'Generative Model', 'Deep Learning'],
      venue: 'NeurIPS'
    },
    {
      id: '7',
      title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting',
      authors: ['Nitish Srivastava', 'Geoffrey Hinton', 'Alex Krizhevsky'],
      year: 2014,
      citations: 34567,
      abstract: 'Deep neural nets with a large number of parameters are very powerful...',
      keywords: [query, 'Dropout', 'Regularization', 'Neural Network'],
      venue: 'JMLR',
      references: ['5']
    },
    {
      id: '8',
      title: 'Adam: A Method for Stochastic Optimization',
      authors: ['Diederik Kingma', 'Jimmy Ba'],
      year: 2015,
      citations: 87654,
      abstract: 'We introduce Adam, an algorithm for first-order gradient-based optimization...',
      keywords: [query, 'Adam', 'Optimization', 'Deep Learning'],
      venue: 'ICLR'
    }
  ];

  return mockPapers;
}

// KV Namespace 类型声明
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
