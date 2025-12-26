/**
 * ScholarNexus - AI分析边缘函数
 *
 * 功能：
 * 1. 论文摘要智能总结
 * 2. 研究趋势分析
 * 3. 关键词提取和聚类
 * 4. 合作者推荐
 */

interface AnalysisRequest {
  type: 'summarize' | 'trends' | 'keywords' | 'recommend';
  data: unknown;
}

interface TrendAnalysis {
  topic: string;
  growth: number;
  papers: number;
  description: string;
  relatedKeywords: string[];
  trend: 'hot' | 'rising' | 'stable' | 'declining';
}

interface KeywordCluster {
  keyword: string;
  count: number;
  growth: number;
  relatedPapers: string[];
}

interface CollaboratorRecommendation {
  author: {
    id: string;
    name: string;
    affiliation: string;
  };
  score: number;
  reason: string;
  commonKeywords: string[];
  potentialTopics: string[];
}

// 计算研究趋势
function analyzeTrends(papers: Array<{ year: number; keywords: string[]; citations: number }>): TrendAnalysis[] {
  const keywordYearCounts: Map<string, Map<number, number>> = new Map();
  const keywordCitations: Map<string, number> = new Map();

  // 统计每个关键词每年的论文数和引用
  papers.forEach(paper => {
    paper.keywords.forEach(keyword => {
      if (!keywordYearCounts.has(keyword)) {
        keywordYearCounts.set(keyword, new Map());
      }
      const yearCounts = keywordYearCounts.get(keyword)!;
      yearCounts.set(paper.year, (yearCounts.get(paper.year) || 0) + 1);

      keywordCitations.set(keyword, (keywordCitations.get(keyword) || 0) + paper.citations);
    });
  });

  const trends: TrendAnalysis[] = [];
  const currentYear = new Date().getFullYear();

  keywordYearCounts.forEach((yearCounts, keyword) => {
    const recentCount = yearCounts.get(currentYear) || yearCounts.get(currentYear - 1) || 0;
    const previousCount = yearCounts.get(currentYear - 2) || yearCounts.get(currentYear - 3) || 1;

    const growth = Math.round(((recentCount - previousCount) / previousCount) * 100);
    const totalPapers = Array.from(yearCounts.values()).reduce((a, b) => a + b, 0);

    let trend: 'hot' | 'rising' | 'stable' | 'declining';
    if (growth > 50) trend = 'hot';
    else if (growth > 20) trend = 'rising';
    else if (growth > -10) trend = 'stable';
    else trend = 'declining';

    trends.push({
      topic: keyword,
      growth,
      papers: totalPapers,
      description: `${keyword}领域的研究${trend === 'hot' ? '正在快速增长' : trend === 'rising' ? '呈上升趋势' : trend === 'stable' ? '保持稳定' : '有所下降'}`,
      relatedKeywords: findRelatedKeywords(keyword, papers),
      trend
    });
  });

  // 按增长率排序
  return trends.sort((a, b) => b.growth - a.growth).slice(0, 10);
}

// 查找相关关键词
function findRelatedKeywords(keyword: string, papers: Array<{ keywords: string[] }>): string[] {
  const cooccurrence: Map<string, number> = new Map();

  papers.forEach(paper => {
    if (paper.keywords.includes(keyword)) {
      paper.keywords.forEach(k => {
        if (k !== keyword) {
          cooccurrence.set(k, (cooccurrence.get(k) || 0) + 1);
        }
      });
    }
  });

  return Array.from(cooccurrence.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);
}

// 提取和聚类关键词
function extractKeywordClusters(papers: Array<{ id: string; keywords: string[]; year: number }>): KeywordCluster[] {
  const keywordData: Map<string, { count: number; papers: string[]; years: number[] }> = new Map();

  papers.forEach(paper => {
    paper.keywords.forEach(keyword => {
      if (!keywordData.has(keyword)) {
        keywordData.set(keyword, { count: 0, papers: [], years: [] });
      }
      const data = keywordData.get(keyword)!;
      data.count++;
      data.papers.push(paper.id);
      data.years.push(paper.year);
    });
  });

  const currentYear = new Date().getFullYear();
  const clusters: KeywordCluster[] = [];

  keywordData.forEach((data, keyword) => {
    const recentYears = data.years.filter(y => y >= currentYear - 2).length;
    const olderYears = data.years.filter(y => y < currentYear - 2).length;
    const growth = olderYears > 0 ? Math.round(((recentYears - olderYears) / olderYears) * 100) : 100;

    clusters.push({
      keyword,
      count: data.count,
      growth,
      relatedPapers: data.papers.slice(0, 5)
    });
  });

  return clusters.sort((a, b) => b.count - a.count).slice(0, 20);
}

// 推荐潜在合作者
function recommendCollaborators(
  userKeywords: string[],
  authors: Array<{ id: string; name: string; affiliation: string; keywords: string[] }>
): CollaboratorRecommendation[] {
  const recommendations: CollaboratorRecommendation[] = [];

  authors.forEach(author => {
    const commonKeywords = author.keywords.filter(k => userKeywords.includes(k));
    const uniqueKeywords = author.keywords.filter(k => !userKeywords.includes(k));

    if (commonKeywords.length > 0) {
      const score = commonKeywords.length * 0.6 + uniqueKeywords.length * 0.4;

      recommendations.push({
        author: {
          id: author.id,
          name: author.name,
          affiliation: author.affiliation
        },
        score: Math.round(score * 100) / 100,
        reason: `在${commonKeywords.slice(0, 3).join('、')}等领域有共同研究兴趣`,
        commonKeywords,
        potentialTopics: uniqueKeywords.slice(0, 3)
      });
    }
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
}

// 生成论文摘要总结
function summarizePaper(paper: { title: string; abstract: string; keywords: string[] }): string {
  // 实际应用中应调用AI API（如通义千问）
  // 这里返回模拟结果
  const keywordStr = paper.keywords.slice(0, 3).join('、');
  return `本文研究${keywordStr}相关问题。${paper.abstract.substring(0, 100)}...`;
}

// 边缘函数主处理器
export async function onRequest(context: {
  request: Request;
  env: {
    AI_CACHE: KVNamespace;
    QWEN_API_KEY?: string;
  };
}): Promise<Response> {
  const { request, env } = context;

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
    const url = new URL(request.url);
    const analysisType = url.searchParams.get('type') || 'trends';

    let result: unknown;

    switch (analysisType) {
      case 'trends': {
        // 模拟论文数据
        const mockPapers = generateMockPapersForAnalysis();
        result = {
          trends: analyzeTrends(mockPapers),
          generatedAt: new Date().toISOString()
        };
        break;
      }

      case 'keywords': {
        const mockPapers = generateMockPapersForAnalysis();
        result = {
          clusters: extractKeywordClusters(mockPapers),
          generatedAt: new Date().toISOString()
        };
        break;
      }

      case 'recommend': {
        const userKeywords = url.searchParams.get('keywords')?.split(',') || ['Deep Learning', 'NLP'];
        const mockAuthors = generateMockAuthors();
        result = {
          recommendations: recommendCollaborators(userKeywords, mockAuthors),
          generatedAt: new Date().toISOString()
        };
        break;
      }

      case 'summarize': {
        const paperId = url.searchParams.get('paperId');
        if (!paperId) {
          return new Response(
            JSON.stringify({ error: 'Paper ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // 模拟论文数据
        const paper = {
          title: 'Sample Paper',
          abstract: 'This paper presents a novel approach to deep learning...',
          keywords: ['Deep Learning', 'Neural Network', 'AI']
        };
        result = {
          summary: summarizePaper(paper),
          generatedAt: new Date().toISOString()
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid analysis type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Edge-Location': 'aliyun-esa'
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// 生成模拟论文数据用于分析
function generateMockPapersForAnalysis() {
  return [
    { id: '1', year: 2024, keywords: ['Large Language Model', 'GPT', 'NLP', 'AI'], citations: 1234 },
    { id: '2', year: 2024, keywords: ['Large Language Model', 'BERT', 'Transformer'], citations: 987 },
    { id: '3', year: 2024, keywords: ['Multimodal', 'Vision-Language', 'CLIP'], citations: 756 },
    { id: '4', year: 2023, keywords: ['Large Language Model', 'ChatGPT', 'RLHF'], citations: 2345 },
    { id: '5', year: 2023, keywords: ['Diffusion Model', 'Image Generation', 'AI Art'], citations: 1876 },
    { id: '6', year: 2023, keywords: ['Transformer', 'Attention', 'NLP'], citations: 3456 },
    { id: '7', year: 2022, keywords: ['Deep Learning', 'CNN', 'Computer Vision'], citations: 4567 },
    { id: '8', year: 2022, keywords: ['GAN', 'Generative Model', 'Image Synthesis'], citations: 2345 },
    { id: '9', year: 2022, keywords: ['Reinforcement Learning', 'Game AI', 'AlphaGo'], citations: 1234 },
    { id: '10', year: 2021, keywords: ['Transformer', 'BERT', 'Pre-training'], citations: 5678 },
    { id: '11', year: 2024, keywords: ['AI Safety', 'Alignment', 'RLHF'], citations: 567 },
    { id: '12', year: 2024, keywords: ['Embodied AI', 'Robotics', 'Manipulation'], citations: 345 },
    { id: '13', year: 2024, keywords: ['World Model', 'Prediction', 'Planning'], citations: 234 },
    { id: '14', year: 2023, keywords: ['Federated Learning', 'Privacy', 'Distributed'], citations: 876 },
    { id: '15', year: 2023, keywords: ['Graph Neural Network', 'GNN', 'Knowledge Graph'], citations: 1234 },
  ];
}

// 生成模拟作者数据
function generateMockAuthors() {
  return [
    { id: 'a1', name: 'Geoffrey Hinton', affiliation: 'University of Toronto', keywords: ['Deep Learning', 'Neural Network', 'Backpropagation'] },
    { id: 'a2', name: 'Yann LeCun', affiliation: 'Meta AI', keywords: ['CNN', 'Computer Vision', 'Self-supervised Learning'] },
    { id: 'a3', name: 'Yoshua Bengio', affiliation: 'Mila', keywords: ['Deep Learning', 'NLP', 'Attention'] },
    { id: 'a4', name: 'Andrew Ng', affiliation: 'Stanford', keywords: ['Machine Learning', 'Deep Learning', 'AI Education'] },
    { id: 'a5', name: 'Fei-Fei Li', affiliation: 'Stanford', keywords: ['Computer Vision', 'ImageNet', 'AI for Healthcare'] },
    { id: 'a6', name: 'Ian Goodfellow', affiliation: 'DeepMind', keywords: ['GAN', 'Adversarial', 'Deep Learning'] },
    { id: 'a7', name: 'Ilya Sutskever', affiliation: 'OpenAI', keywords: ['Large Language Model', 'GPT', 'Scaling'] },
    { id: 'a8', name: 'Demis Hassabis', affiliation: 'DeepMind', keywords: ['Reinforcement Learning', 'AlphaGo', 'AI for Science'] },
  ];
}

// KV Namespace 类型声明
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
