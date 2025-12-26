/**
 * ScholarNexus - 学术搜索边缘函数
 *
 * 功能：
 * 1. 接收搜索查询
 * 2. 调用学术API（Semantic Scholar、OpenAlex等）
 * 3. 聚合和排序结果
 * 4. 边缘缓存热门查询
 */

interface SearchResult {
  papers: Paper[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  searchTime: number;
}

interface Paper {
  id: string;
  title: string;
  authors: Author[];
  year: number;
  citations: number;
  abstract: string;
  keywords: string[];
  venue: string;
  doi?: string;
  url?: string;
  openAccess?: boolean;
}

interface Author {
  id: string;
  name: string;
  affiliation?: string;
}

interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  minCitations?: number;
  venues?: string[];
  openAccessOnly?: boolean;
}

// 搜索结果排序
function sortResults(papers: Paper[], sortBy: string): Paper[] {
  switch (sortBy) {
    case 'citations':
      return papers.sort((a, b) => b.citations - a.citations);
    case 'year':
      return papers.sort((a, b) => b.year - a.year);
    case 'relevance':
    default:
      // 综合相关性评分
      return papers.sort((a, b) => {
        const scoreA = a.citations * 0.3 + (a.year - 2000) * 10;
        const scoreB = b.citations * 0.3 + (b.year - 2000) * 10;
        return scoreB - scoreA;
      });
  }
}

// 应用过滤器
function applyFilters(papers: Paper[], filters: SearchFilters): Paper[] {
  return papers.filter(paper => {
    if (filters.yearFrom && paper.year < filters.yearFrom) return false;
    if (filters.yearTo && paper.year > filters.yearTo) return false;
    if (filters.minCitations && paper.citations < filters.minCitations) return false;
    if (filters.venues?.length && !filters.venues.includes(paper.venue)) return false;
    if (filters.openAccessOnly && !paper.openAccess) return false;
    return true;
  });
}

// 模拟学术API调用
async function searchAcademicAPI(query: string, page: number, pageSize: number): Promise<Paper[]> {
  // 实际应用中应调用真实API，如：
  // - Semantic Scholar API: https://api.semanticscholar.org/
  // - OpenAlex API: https://api.openalex.org/
  // - CrossRef API: https://api.crossref.org/

  const mockPapers: Paper[] = [
    {
      id: 'ss-1',
      title: 'Attention Is All You Need',
      authors: [
        { id: 'a1', name: 'Ashish Vaswani', affiliation: 'Google Brain' },
        { id: 'a2', name: 'Noam Shazeer', affiliation: 'Google Brain' },
        { id: 'a3', name: 'Niki Parmar', affiliation: 'Google Research' }
      ],
      year: 2017,
      citations: 89234,
      abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
      keywords: ['Transformer', 'Attention', 'Neural Network', 'NLP', 'Deep Learning'],
      venue: 'NeurIPS 2017',
      doi: '10.5555/3295222.3295349',
      url: 'https://arxiv.org/abs/1706.03762',
      openAccess: true
    },
    {
      id: 'ss-2',
      title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
      authors: [
        { id: 'a4', name: 'Jacob Devlin', affiliation: 'Google AI Language' },
        { id: 'a5', name: 'Ming-Wei Chang', affiliation: 'Google AI Language' }
      ],
      year: 2019,
      citations: 67890,
      abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
      keywords: ['BERT', 'Pre-training', 'NLP', 'Language Model', 'Transformer'],
      venue: 'NAACL 2019',
      doi: '10.18653/v1/N19-1423',
      url: 'https://arxiv.org/abs/1810.04805',
      openAccess: true
    },
    {
      id: 'ss-3',
      title: 'Language Models are Few-Shot Learners',
      authors: [
        { id: 'a6', name: 'Tom Brown', affiliation: 'OpenAI' },
        { id: 'a7', name: 'Benjamin Mann', affiliation: 'OpenAI' }
      ],
      year: 2020,
      citations: 45678,
      abstract: 'Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task. We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance.',
      keywords: ['GPT-3', 'Few-shot Learning', 'Language Model', 'NLP', 'Large Language Model'],
      venue: 'NeurIPS 2020',
      url: 'https://arxiv.org/abs/2005.14165',
      openAccess: true
    },
    {
      id: 'ss-4',
      title: 'Deep Residual Learning for Image Recognition',
      authors: [
        { id: 'a8', name: 'Kaiming He', affiliation: 'Microsoft Research' },
        { id: 'a9', name: 'Xiangyu Zhang', affiliation: 'Microsoft Research' }
      ],
      year: 2016,
      citations: 123456,
      abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
      keywords: ['ResNet', 'Deep Learning', 'Computer Vision', 'Image Recognition', 'CNN'],
      venue: 'CVPR 2016',
      doi: '10.1109/CVPR.2016.90',
      url: 'https://arxiv.org/abs/1512.03385',
      openAccess: true
    },
    {
      id: 'ss-5',
      title: 'Generative Adversarial Networks',
      authors: [
        { id: 'a10', name: 'Ian Goodfellow', affiliation: 'Google Brain' },
        { id: 'a11', name: 'Jean Pouget-Abadie', affiliation: 'Université de Montréal' }
      ],
      year: 2014,
      citations: 56789,
      abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.',
      keywords: ['GAN', 'Generative Model', 'Deep Learning', 'Neural Network', 'Adversarial'],
      venue: 'NeurIPS 2014',
      url: 'https://arxiv.org/abs/1406.2661',
      openAccess: true
    },
    {
      id: 'ss-6',
      title: 'ImageNet Classification with Deep Convolutional Neural Networks',
      authors: [
        { id: 'a12', name: 'Alex Krizhevsky', affiliation: 'University of Toronto' },
        { id: 'a13', name: 'Ilya Sutskever', affiliation: 'University of Toronto' },
        { id: 'a14', name: 'Geoffrey Hinton', affiliation: 'University of Toronto' }
      ],
      year: 2012,
      citations: 98765,
      abstract: 'We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes.',
      keywords: ['AlexNet', 'CNN', 'Image Classification', 'Deep Learning', 'Computer Vision'],
      venue: 'NeurIPS 2012',
      doi: '10.1145/3065386',
      openAccess: true
    },
    {
      id: 'ss-7',
      title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting',
      authors: [
        { id: 'a15', name: 'Nitish Srivastava', affiliation: 'University of Toronto' },
        { id: 'a14', name: 'Geoffrey Hinton', affiliation: 'University of Toronto' }
      ],
      year: 2014,
      citations: 34567,
      abstract: 'Deep neural nets with a large number of parameters are very powerful machine learning systems. However, overfitting is a serious problem in such networks. Dropout is a technique for addressing this problem.',
      keywords: ['Dropout', 'Regularization', 'Neural Network', 'Deep Learning', 'Overfitting'],
      venue: 'JMLR 2014',
      url: 'https://jmlr.org/papers/v15/srivastava14a.html',
      openAccess: true
    },
    {
      id: 'ss-8',
      title: 'Adam: A Method for Stochastic Optimization',
      authors: [
        { id: 'a16', name: 'Diederik Kingma', affiliation: 'University of Amsterdam' },
        { id: 'a17', name: 'Jimmy Ba', affiliation: 'University of Toronto' }
      ],
      year: 2015,
      citations: 87654,
      abstract: 'We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions, based on adaptive estimates of lower-order moments.',
      keywords: ['Adam', 'Optimization', 'Deep Learning', 'Gradient Descent', 'Neural Network'],
      venue: 'ICLR 2015',
      url: 'https://arxiv.org/abs/1412.6980',
      openAccess: true
    },
    {
      id: 'ss-9',
      title: 'Batch Normalization: Accelerating Deep Network Training',
      authors: [
        { id: 'a18', name: 'Sergey Ioffe', affiliation: 'Google' },
        { id: 'a19', name: 'Christian Szegedy', affiliation: 'Google' }
      ],
      year: 2015,
      citations: 45678,
      abstract: 'Training Deep Neural Networks is complicated by the fact that the distribution of each layer inputs changes during training. We refer to this phenomenon as internal covariate shift, and address the problem by normalizing layer inputs.',
      keywords: ['Batch Normalization', 'Deep Learning', 'Neural Network', 'Training', 'Normalization'],
      venue: 'ICML 2015',
      url: 'https://arxiv.org/abs/1502.03167',
      openAccess: true
    },
    {
      id: 'ss-10',
      title: 'Neural Machine Translation by Jointly Learning to Align and Translate',
      authors: [
        { id: 'a20', name: 'Dzmitry Bahdanau', affiliation: 'Jacobs University' },
        { id: 'a21', name: 'Kyunghyun Cho', affiliation: 'Université de Montréal' },
        { id: 'a22', name: 'Yoshua Bengio', affiliation: 'Université de Montréal' }
      ],
      year: 2015,
      citations: 34567,
      abstract: 'Neural machine translation is a recently proposed approach to machine translation. We conjecture that the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder-decoder architecture.',
      keywords: ['Attention', 'Machine Translation', 'NLP', 'Sequence-to-Sequence', 'Neural Network'],
      venue: 'ICLR 2015',
      url: 'https://arxiv.org/abs/1409.0473',
      openAccess: true
    }
  ];

  // 简单的关键词匹配过滤
  const queryLower = query.toLowerCase();
  const filtered = mockPapers.filter(paper =>
    paper.title.toLowerCase().includes(queryLower) ||
    paper.abstract.toLowerCase().includes(queryLower) ||
    paper.keywords.some(k => k.toLowerCase().includes(queryLower))
  );

  // 如果没有匹配，返回所有（模拟相关性搜索）
  const results = filtered.length > 0 ? filtered : mockPapers;

  // 分页
  const start = (page - 1) * pageSize;
  return results.slice(start, start + pageSize);
}

// 边缘函数主处理器
export async function onRequest(context: {
  request: Request;
  env: {
    SEARCH_CACHE: KVNamespace;
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

  const startTime = Date.now();

  try {
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(50, parseInt(url.searchParams.get('pageSize') || '20'));
    const sortBy = url.searchParams.get('sort') || 'relevance';

    // 解析过滤器
    const filters: SearchFilters = {
      yearFrom: url.searchParams.get('yearFrom') ? parseInt(url.searchParams.get('yearFrom')!) : undefined,
      yearTo: url.searchParams.get('yearTo') ? parseInt(url.searchParams.get('yearTo')!) : undefined,
      minCitations: url.searchParams.get('minCitations') ? parseInt(url.searchParams.get('minCitations')!) : undefined,
      openAccessOnly: url.searchParams.get('openAccess') === 'true'
    };

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
    const cacheKey = `search:${query.toLowerCase()}:${page}:${pageSize}:${sortBy}`;
    const cached = await env.SEARCH_CACHE?.get(cacheKey);

    if (cached) {
      const result = JSON.parse(cached);
      result.searchTime = Date.now() - startTime;
      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Edge-Location': 'aliyun-esa'
        }
      });
    }

    // 执行搜索
    let papers = await searchAcademicAPI(query, page, pageSize);

    // 应用过滤器
    papers = applyFilters(papers, filters);

    // 排序
    papers = sortResults(papers, sortBy);

    const searchTime = Date.now() - startTime;

    const result: SearchResult = {
      papers,
      total: papers.length * 10, // 模拟总数
      page,
      pageSize,
      query,
      searchTime
    };

    // 缓存结果（30分钟）
    await env.SEARCH_CACHE?.put(cacheKey, JSON.stringify(result), { expirationTtl: 1800 });

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Search-Time': `${searchTime}ms`,
        'X-Edge-Location': 'aliyun-esa'
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: 'Search failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// KV Namespace 类型声明
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
