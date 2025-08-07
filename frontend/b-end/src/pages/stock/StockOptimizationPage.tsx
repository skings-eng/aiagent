import React from 'react';
import { useTranslation } from 'react-i18next';
import StockOptimizationCard from '../../components/StockOptimizationCard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StockOptimizationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // サンプルデータ（ユーザーが提供したJSON形式）
  const sampleStockData = {
    name: "Asahi Group Holdings, Ltd.",
    name_ja: "アサヒグループホールディングス株式会社",
    code: "2502.T",
    price: 5755,
    industry: "食品",
    technical: {
      trend_score: "4",
      trend_reason: "股价处于日线、周线多头排列，站上所有主要移动均线（20/50/200日），上涨趋势明显。",
      support_levels: [5600, 5450],
      resistance_levels: [5850, 6000],
      rsi: "62.3",
      macd: "MACD金叉，DIFF与DEA值均在零轴上方，显示多头动能持续。"
    },
    fundamental: {
      pe: "19.5",
      peg: "1.95",
      roic: "9.2%",
      revenue_growth: "5.5%",
      fcf_trend: "連続2季増長",
      valuation: "5900 - 6300 JPY"
    },
    sentiment: {
      institutional_holding: "55.8%",
      main_capital_flow: "近期呈淨流入状態"
    },
    risk: {
      volatility: "18.5%",
      risk_events: [
        "財報臨近 (予計8月上旬)",
        "原材料成本上涨風險",
        "消費需求受宏観経済影響"
      ]
    },
    summary: {
      scores: {
        trend: "★★★★☆",
        valuation: "★★★☆☆",
        risk: "★★★★☆"
      },
      suggestion: "公司基本面穩健，作為行業龍頭，其國際業務為未來提供了增長動力。技術面呈現清晰的多頭趨勢，資金面配合良好。當前股価略低於我們估值區間的下沿，具備一定的安全邊際。綜合來看，該股具有較好的中長期配置価値。建議投資者可考慮逢低布局，短期需關注5850日元附近的阻力突破情況，並留意即將發布的財報可能帶來的股価波動。"
    },
    data_source: {
      pe: "MCP Real-time Data",
      rsi: "MCP Real-time Data",
      valuation: "DCF模型估算"
    }
  };

  // 追加のサンプルデータ
  const additionalSamples = [
    {
      name: "Toyota Motor Corporation",
      name_ja: "トヨタ自動車株式会社",
      code: "7203.T",
      price: 2850,
      industry: "自動車",
      technical: {
        trend_score: "5",
        trend_reason: "強力な上昇トレンドを維持、全ての主要移動平均線を上回り、モメンタムが継続。",
        support_levels: [2750, 2650],
        resistance_levels: [2950, 3100],
        rsi: "68.5",
        macd: "MACD強気シグナル継続、上昇モメンタム強い。"
      },
      fundamental: {
        pe: "12.8",
        peg: "1.2",
        roic: "12.5%",
        revenue_growth: "8.2%",
        fcf_trend: "連続4季増長",
        valuation: "2900 - 3200 JPY"
      },
      sentiment: {
        institutional_holding: "62.3%",
        main_capital_flow: "大幅淨流入"
      },
      risk: {
        volatility: "15.2%",
        risk_events: [
          "半導体供給鏈風險",
          "電動車競争激化",
          "為替変動影響"
        ]
      },
      summary: {
        scores: {
          trend: "★★★★★",
          valuation: "★★★★☆",
          risk: "★★★☆☆"
        },
        suggestion: "自動車業界のリーダーとして、電動化とデジタル化への転換を積極的に進めている。技術面では強力な上昇トレンドを維持し、ファンダメンタルズも健全。現在の株価は適正範囲内にあり、中長期的な成長ポテンシャルが高い。"
      },
      data_source: {
        pe: "MCP Real-time Data",
        rsi: "MCP Real-time Data",
        valuation: "DCF模型估算"
      }
    },
    {
      name: "SoftBank Group Corp.",
      name_ja: "ソフトバンクグループ株式会社",
      code: "9984.T",
      price: 7200,
      industry: "通信・IT",
      technical: {
        trend_score: "2",
        trend_reason: "短期的な下降トレンド、主要移動平均線を下回り、売り圧力が継続。",
        support_levels: [6800, 6500],
        resistance_levels: [7500, 7800],
        rsi: "35.2",
        macd: "MACD弱気シグナル、下降モメンタム継続。"
      },
      fundamental: {
        pe: "N/A",
        peg: "N/A",
        roic: "3.8%",
        revenue_growth: "-2.1%",
        fcf_trend: "変動が大きい",
        valuation: "6500 - 7500 JPY"
      },
      sentiment: {
        institutional_holding: "45.2%",
        main_capital_flow: "淨流出状態"
      },
      risk: {
        volatility: "28.7%",
        risk_events: [
          "投資先企業の業績悪化",
          "金利上昇による投資環境悪化",
          "地政学的リスク"
        ]
      },
      summary: {
        scores: {
          trend: "★★☆☆☆",
          valuation: "★★☆☆☆",
          risk: "★★☆☆☆"
        },
        suggestion: "投資ポートフォリオの価値変動が大きく、市場環境に敏感。現在は調整局面にあり、リスク許容度の高い投資家向け。長期的な視点での投資戦略が必要。"
      },
      data_source: {
        pe: "MCP Real-time Data",
        rsi: "MCP Real-time Data",
        valuation: "DCF模型估算"
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/stock')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>戻る</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('stock.optimization.title', { defaultValue: '株式最適化分析' })}
                </h1>
                <p className="text-gray-600 text-sm">
                  {t('stock.optimization.subtitle', { defaultValue: 'AI による包括的な株式分析と投資提案' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* 説明セクション */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              株式最適化分析について
            </h2>
            <p className="text-blue-800 text-sm leading-relaxed">
              この分析は、技術分析、ファンダメンタル分析、センチメント分析、リスク評価を統合し、
              包括的な投資判断をサポートします。各セクションは異なる角度から株式を評価し、
              総合的な投資提案を提供します。
            </p>
          </div>

          {/* 株式分析カード */}
          <div className="space-y-8">
            <StockOptimizationCard data={sampleStockData} />
            
            {additionalSamples.map((stock, index) => (
              <StockOptimizationCard key={index} data={stock} />
            ))}
          </div>

          {/* フッター情報 */}
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              分析手法について
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">技術分析</h4>
                <p className="text-gray-600">
                  移動平均線、RSI、MACD等のテクニカル指標を用いた分析
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">ファンダメンタル分析</h4>
                <p className="text-gray-600">
                  PER、PEG、ROIC等の財務指標による企業価値評価
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">センチメント分析</h4>
                <p className="text-gray-600">
                  機関投資家の動向と資金フローの分析
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">リスク評価</h4>
                <p className="text-gray-600">
                  ボラティリティと潜在的リスクイベントの評価
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockOptimizationPage;