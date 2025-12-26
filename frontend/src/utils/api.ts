import { Paper, GraphNode, GraphLink, GraphData } from '../store'

const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

// 模拟学术论文数据（Semantic Scholar API 不支持浏览器跨域请求）
const MOCK_PAPERS: Paper[] = [
  {
    id: 'ss-1',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
    year: 2017,
    citations: 89234,
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    keywords: ['Transformer', 'Attention', 'Neural Network', 'NLP', 'Deep Learning'],
    venue: 'NeurIPS 2017',
    doi: '10.5555/3295222.3295349',
    url: 'https://arxiv.org/abs/1706.03762',
  },
  {
    id: 'ss-2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
    year: 2019,
    citations: 67890,
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
    keywords: ['BERT', 'Pre-training', 'NLP', 'Language Model', 'Transformer'],
    venue: 'NAACL 2019',
    doi: '10.18653/v1/N19-1423',
    url: 'https://arxiv.org/abs/1810.04805',
  },
  {
    id: 'ss-3',
    title: 'Language Models are Few-Shot Learners',
    authors: ['Tom Brown', 'Benjamin Mann', 'Nick Ryder', 'Melanie Subbiah'],
    year: 2020,
    citations: 45678,
    abstract: 'Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task. We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance.',
    keywords: ['GPT-3', 'Few-shot Learning', 'Language Model', 'NLP', 'Large Language Model'],
    venue: 'NeurIPS 2020',
    url: 'https://arxiv.org/abs/2005.14165',
  },
  {
    id: 'ss-4',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
    year: 2016,
    citations: 123456,
    abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs.',
    keywords: ['ResNet', 'Deep Learning', 'Computer Vision', 'Image Recognition', 'CNN'],
    venue: 'CVPR 2016',
    doi: '10.1109/CVPR.2016.90',
    url: 'https://arxiv.org/abs/1512.03385',
  },
  {
    id: 'ss-5',
    title: 'Generative Adversarial Networks',
    authors: ['Ian Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu'],
    year: 2014,
    citations: 56789,
    abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.',
    keywords: ['GAN', 'Generative Model', 'Deep Learning', 'Neural Network', 'Adversarial'],
    venue: 'NeurIPS 2014',
    url: 'https://arxiv.org/abs/1406.2661',
  },
  {
    id: 'ss-6',
    title: 'ImageNet Classification with Deep Convolutional Neural Networks',
    authors: ['Alex Krizhevsky', 'Ilya Sutskever', 'Geoffrey Hinton'],
    year: 2012,
    citations: 98765,
    abstract: 'We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes. On the test data, we achieved top-1 and top-5 error rates of 37.5% and 17.0%.',
    keywords: ['AlexNet', 'CNN', 'Image Classification', 'Deep Learning', 'Computer Vision'],
    venue: 'NeurIPS 2012',
    doi: '10.1145/3065386',
    url: 'https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks',
  },
  {
    id: 'ss-7',
    title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting',
    authors: ['Nitish Srivastava', 'Geoffrey Hinton', 'Alex Krizhevsky', 'Ilya Sutskever'],
    year: 2014,
    citations: 34567,
    abstract: 'Deep neural nets with a large number of parameters are very powerful machine learning systems. However, overfitting is a serious problem in such networks. Dropout is a technique for addressing this problem by randomly dropping units during training.',
    keywords: ['Dropout', 'Regularization', 'Neural Network', 'Deep Learning', 'Overfitting'],
    venue: 'JMLR 2014',
    url: 'https://jmlr.org/papers/v15/srivastava14a.html',
  },
  {
    id: 'ss-8',
    title: 'Adam: A Method for Stochastic Optimization',
    authors: ['Diederik Kingma', 'Jimmy Ba'],
    year: 2015,
    citations: 87654,
    abstract: 'We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions, based on adaptive estimates of lower-order moments. The method is straightforward to implement, is computationally efficient, has little memory requirements.',
    keywords: ['Adam', 'Optimization', 'Deep Learning', 'Gradient Descent', 'Neural Network'],
    venue: 'ICLR 2015',
    url: 'https://arxiv.org/abs/1412.6980',
  },
  {
    id: 'ss-9',
    title: 'Batch Normalization: Accelerating Deep Network Training',
    authors: ['Sergey Ioffe', 'Christian Szegedy'],
    year: 2015,
    citations: 45678,
    abstract: 'Training Deep Neural Networks is complicated by the fact that the distribution of each layer inputs changes during training. We refer to this phenomenon as internal covariate shift, and address the problem by normalizing layer inputs.',
    keywords: ['Batch Normalization', 'Deep Learning', 'Neural Network', 'Training', 'Normalization'],
    venue: 'ICML 2015',
    url: 'https://arxiv.org/abs/1502.03167',
  },
  {
    id: 'ss-10',
    title: 'Neural Machine Translation by Jointly Learning to Align and Translate',
    authors: ['Dzmitry Bahdanau', 'Kyunghyun Cho', 'Yoshua Bengio'],
    year: 2015,
    citations: 34567,
    abstract: 'Neural machine translation is a recently proposed approach to machine translation. We conjecture that the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder-decoder architecture.',
    keywords: ['Attention', 'Machine Translation', 'NLP', 'Sequence-to-Sequence', 'Neural Network'],
    venue: 'ICLR 2015',
    url: 'https://arxiv.org/abs/1409.0473',
  },
  {
    id: 'ss-11',
    title: 'Very Deep Convolutional Networks for Large-Scale Image Recognition',
    authors: ['Karen Simonyan', 'Andrew Zisserman'],
    year: 2015,
    citations: 78901,
    abstract: 'In this work we investigate the effect of the convolutional network depth on its accuracy in the large-scale image recognition setting. Our main contribution is a thorough evaluation of networks of increasing depth using an architecture with very small convolution filters.',
    keywords: ['VGGNet', 'CNN', 'Image Recognition', 'Deep Learning', 'Computer Vision'],
    venue: 'ICLR 2015',
    url: 'https://arxiv.org/abs/1409.1556',
  },
  {
    id: 'ss-12',
    title: 'Sequence to Sequence Learning with Neural Networks',
    authors: ['Ilya Sutskever', 'Oriol Vinyals', 'Quoc Le'],
    year: 2014,
    citations: 23456,
    abstract: 'Deep Neural Networks (DNNs) are powerful models that have achieved excellent performance on difficult learning tasks. We present a general end-to-end approach to sequence learning that makes minimal assumptions on the sequence structure.',
    keywords: ['Seq2Seq', 'LSTM', 'Machine Translation', 'NLP', 'Deep Learning'],
    venue: 'NeurIPS 2014',
    url: 'https://arxiv.org/abs/1409.3215',
  },
  {
    id: 'ss-13',
    title: 'Playing Atari with Deep Reinforcement Learning',
    authors: ['Volodymyr Mnih', 'Koray Kavukcuoglu', 'David Silver', 'Alex Graves'],
    year: 2013,
    citations: 12345,
    abstract: 'We present the first deep learning model to successfully learn control policies directly from high-dimensional sensory input using reinforcement learning. The model is a convolutional neural network, trained with a variant of Q-learning.',
    keywords: ['DQN', 'Reinforcement Learning', 'Deep Learning', 'Game AI', 'Atari'],
    venue: 'NIPS Workshop 2013',
    url: 'https://arxiv.org/abs/1312.5602',
  },
  {
    id: 'ss-14',
    title: 'Mastering the Game of Go with Deep Neural Networks and Tree Search',
    authors: ['David Silver', 'Aja Huang', 'Chris Maddison', 'Arthur Guez'],
    year: 2016,
    citations: 15678,
    abstract: 'The game of Go has long been viewed as the most challenging of classic games for artificial intelligence owing to its enormous search space and the difficulty of evaluating board positions and moves.',
    keywords: ['AlphaGo', 'Reinforcement Learning', 'Game AI', 'Monte Carlo Tree Search', 'Deep Learning'],
    venue: 'Nature 2016',
    doi: '10.1038/nature16961',
    url: 'https://www.nature.com/articles/nature16961',
  },
  {
    id: 'ss-15',
    title: 'U-Net: Convolutional Networks for Biomedical Image Segmentation',
    authors: ['Olaf Ronneberger', 'Philipp Fischer', 'Thomas Brox'],
    year: 2015,
    citations: 45678,
    abstract: 'There is large consent that successful training of deep networks requires many thousand annotated training samples. In this paper, we present a network and training strategy that relies on the strong use of data augmentation.',
    keywords: ['U-Net', 'Image Segmentation', 'Medical Imaging', 'CNN', 'Deep Learning'],
    venue: 'MICCAI 2015',
    url: 'https://arxiv.org/abs/1505.04597',
  },
  {
    id: 'ss-16',
    title: 'YOLO: Real-Time Object Detection',
    authors: ['Joseph Redmon', 'Santosh Divvala', 'Ross Girshick', 'Ali Farhadi'],
    year: 2016,
    citations: 34567,
    abstract: 'We present YOLO, a new approach to object detection. Prior work on object detection repurposes classifiers to perform detection. Instead, we frame object detection as a regression problem to spatially separated bounding boxes and associated class probabilities.',
    keywords: ['YOLO', 'Object Detection', 'Real-time', 'Computer Vision', 'Deep Learning'],
    venue: 'CVPR 2016',
    url: 'https://arxiv.org/abs/1506.02640',
  },
  {
    id: 'ss-17',
    title: 'Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks',
    authors: ['Shaoqing Ren', 'Kaiming He', 'Ross Girshick', 'Jian Sun'],
    year: 2015,
    citations: 56789,
    abstract: 'State-of-the-art object detection networks depend on region proposal algorithms to hypothesize object locations. We introduce a Region Proposal Network (RPN) that shares full-image convolutional features with the detection network.',
    keywords: ['Faster R-CNN', 'Object Detection', 'Region Proposal', 'Computer Vision', 'Deep Learning'],
    venue: 'NeurIPS 2015',
    url: 'https://arxiv.org/abs/1506.01497',
  },
  {
    id: 'ss-18',
    title: 'Long Short-Term Memory',
    authors: ['Sepp Hochreiter', 'Jürgen Schmidhuber'],
    year: 1997,
    citations: 67890,
    abstract: 'Learning to store information over extended time intervals by recurrent backpropagation takes a very long time, mostly because of insufficient, decaying error backflow. We briefly review Hochreiter\'s analysis of this problem.',
    keywords: ['LSTM', 'RNN', 'Sequence Modeling', 'Neural Network', 'Deep Learning'],
    venue: 'Neural Computation 1997',
    doi: '10.1162/neco.1997.9.8.1735',
    url: 'https://www.bioinf.jku.at/publications/older/2604.pdf',
  },
  {
    id: 'ss-19',
    title: 'Word2Vec: Efficient Estimation of Word Representations in Vector Space',
    authors: ['Tomas Mikolov', 'Kai Chen', 'Greg Corrado', 'Jeffrey Dean'],
    year: 2013,
    citations: 34567,
    abstract: 'We propose two novel model architectures for computing continuous vector representations of words from very large data sets. The quality of these representations is measured in a word similarity task.',
    keywords: ['Word2Vec', 'Word Embeddings', 'NLP', 'Neural Network', 'Representation Learning'],
    venue: 'ICLR 2013',
    url: 'https://arxiv.org/abs/1301.3781',
  },
  {
    id: 'ss-20',
    title: 'GloVe: Global Vectors for Word Representation',
    authors: ['Jeffrey Pennington', 'Richard Socher', 'Christopher Manning'],
    year: 2014,
    citations: 23456,
    abstract: 'Recent methods for learning vector space representations of words have succeeded in capturing fine-grained semantic and syntactic regularities using vector arithmetic. We propose a new global log-bilinear regression model.',
    keywords: ['GloVe', 'Word Embeddings', 'NLP', 'Representation Learning', 'Neural Network'],
    venue: 'EMNLP 2014',
    url: 'https://nlp.stanford.edu/pubs/glove.pdf',
  },
]

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

// 搜索学术论文 - 使用模拟数据（Semantic Scholar API 不支持浏览器跨域）
export async function searchPapers(query: string, limit: number = 20): Promise<Paper[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))

  const queryLower = query.toLowerCase()

  // 根据查询关键词过滤论文
  const filtered = MOCK_PAPERS.filter(paper =>
    paper.title.toLowerCase().includes(queryLower) ||
    paper.abstract.toLowerCase().includes(queryLower) ||
    paper.keywords.some(k => k.toLowerCase().includes(queryLower)) ||
    paper.authors.some(a => a.toLowerCase().includes(queryLower))
  )

  // 如果没有匹配，返回所有论文（模拟相关性搜索）
  const results = filtered.length > 0 ? filtered : MOCK_PAPERS

  return results.slice(0, limit)
}

// 获取论文详情 - 使用模拟数据
export async function getPaperDetails(paperId: string): Promise<Paper | null> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200))

  // 从模拟数据中查找
  const paper = MOCK_PAPERS.find(p => p.id === paperId)
  return paper || null
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
