import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Papa from 'papaparse';

const AppleStockChart = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('line');
  const [dataView, setDataView] = useState('price');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Instead of reading from a file, use the hardcoded data from our API call
        const stockCSV = `Date,Open,High,Low,Close,Volume,Dividends,Stock Splits
2025-03-12 00:00:00-04:00,220.13999938964844,221.75,214.91000366210938,216.97999572753906,62547500,0.0,0.0
2025-03-13 00:00:00-04:00,215.9499969482422,216.83999633789062,208.4199981689453,209.67999267578125,61368300,0.0,0.0
2025-03-14 00:00:00-04:00,211.25,213.9499969482422,209.5800018310547,213.49000549316406,60107600,0.0,0.0
2025-03-17 00:00:00-04:00,213.30999755859375,215.22000122070312,209.97000122070312,214.0,48073400,0.0,0.0
2025-03-18 00:00:00-04:00,214.16000366210938,215.14999389648438,211.49000549316406,212.69000244140625,42432400,0.0,0.0
2025-03-19 00:00:00-04:00,214.22000122070312,218.75999450683594,213.75,215.24000549316406,54385400,0.0,0.0
2025-03-20 00:00:00-04:00,213.99000549316406,217.49000549316406,212.22000122070312,214.10000610351562,48862900,0.0,0.0
2025-03-21 00:00:00-04:00,211.55999755859375,218.83999633789062,211.27999877929688,218.27000427246094,94127800,0.0,0.0
2025-03-24 00:00:00-04:00,221.0,221.47999572753906,218.5800018310547,220.72999572753906,44299500,0.0,0.0
2025-03-25 00:00:00-04:00,220.77000427246094,224.10000610351562,220.0800018310547,223.75,34493600,0.0,0.0
2025-03-26 00:00:00-04:00,223.50999450683594,225.02000427246094,220.47000122070312,221.52999877929688,34466100,0.0,0.0
2025-03-27 00:00:00-04:00,221.38999938964844,224.99000549316406,220.55999755859375,223.85000610351562,37094800,0.0,0.0
2025-03-28 00:00:00-04:00,221.6699981689453,223.80999755859375,217.67999267578125,217.89999389648438,39818600,0.0,0.0
2025-03-31 00:00:00-04:00,217.00999450683594,225.6199951171875,216.22999572753906,222.1300048828125,65299300,0.0,0.0
2025-04-01 00:00:00-04:00,219.80999755859375,223.67999267578125,218.89999389648438,223.19000244140625,36412700,0.0,0.0
2025-04-02 00:00:00-04:00,221.32000732421875,225.19000244140625,221.02000427246094,223.88999938964844,35905900,0.0,0.0
2025-04-03 00:00:00-04:00,205.5399932861328,207.49000549316406,201.25,203.19000244140625,103419000,0.0,0.0
2025-04-04 00:00:00-04:00,193.88999938964844,199.8800048828125,187.33999633789062,188.3800048828125,125910900,0.0,0.0
2025-04-07 00:00:00-04:00,177.1999969482422,194.14999389648438,174.6199951171875,181.4600067138672,160466300,0.0,0.0
2025-04-08 00:00:00-04:00,186.6999969482422,190.33999633789062,169.2100067138672,172.4199981689453,120859500,0.0,0.0
2025-04-09 00:00:00-04:00,171.9499969482422,200.61000061035156,171.88999938964844,198.85000610351562,184395900,0.0,0.0
2025-04-10 00:00:00-04:00,189.07000732421875,194.77999877929688,183.0,190.4199981689453,121880000,0.0,0.0
2025-04-11 00:00:00-04:00,186.10000610351562,199.5399932861328,186.05999755859375,198.14999389648438,87300000,0.0,0.0`;
        
        const parsed = Papa.parse(stockCSV, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });
        
        const processedData = parsed.data.map(item => {
          const date = new Date(item.Date);
          return {
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            fullDate: item.Date,
            open: item.Open,
            high: item.High,
            low: item.Low,
            close: item.Close,
            volume: item.Volume / 1000000 // Convert to millions
          };
        });
        
        setStockData(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics
  const calculateMetrics = () => {
    if (stockData.length === 0) return { max: 0, min: 0, change: 0, percentChange: 0 };
    
    const max = Math.max(...stockData.map(item => item.high));
    const min = Math.min(...stockData.map(item => item.low));
    const firstClose = stockData[0]?.close || 0;
    const lastClose = stockData[stockData.length - 1]?.close || 0;
    const change = lastClose - firstClose;
    const percentChange = (change / firstClose) * 100;
    
    return { max, min, change, percentChange };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading Apple stock data...</div>;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Apple Stock (AAPL)</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3 rounded shadow">
            <div className="text-sm text-gray-500">Current Price</div>
            <div className="text-xl font-bold">${stockData[stockData.length - 1]?.close.toFixed(2)}</div>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <div className="text-sm text-gray-500">30-Day Change</div>
            <div className={`text-xl font-bold ${metrics.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.change >= 0 ? '+' : ''}{metrics.change.toFixed(2)} ({metrics.percentChange.toFixed(2)}%)
            </div>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <div className="text-sm text-gray-500">30-Day High</div>
            <div className="text-xl font-bold">${metrics.max.toFixed(2)}</div>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <div className="text-sm text-gray-500">30-Day Low</div>
            <div className="text-xl font-bold">${metrics.min.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      <div className="mb-4 flex space-x-2">
        <button 
          className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setChartType('line')}
        >
          Line
        </button>
        <button 
          className={`px-3 py-1 rounded ${chartType === 'area' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setChartType('area')}
        >
          Area
        </button>
        <div className="flex-grow"></div>
        <button 
          className={`px-3 py-1 rounded ${dataView === 'price' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setDataView('price')}
        >
          Price
        </button>
        <button 
          className={`px-3 py-1 rounded ${dataView === 'volume' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setDataView('volume')}
        >
          Volume
        </button>
      </div>
      
      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {dataView === 'price' ? (
            chartType === 'line' ? (
              <LineChart data={stockData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis 
                  domain={['auto', 'auto']} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                  labelFormatter={(label, items) => {
                    const item = items[0]?.payload;
                    return item ? `Date: ${item.date}` : label;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  name="Closing Price" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="open" 
                  name="Opening Price" 
                  stroke="#10b981" 
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <AreaChart data={stockData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis 
                  domain={['auto', 'auto']} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                  labelFormatter={(label, items) => {
                    const item = items[0]?.payload;
                    return item ? `Date: ${item.date}` : label;
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  name="Closing Price" 
                  stroke="#2563eb" 
                  fill="#2563eb" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            )
          ) : (
            <AreaChart data={stockData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}M`}
              />
              <Tooltip 
                formatter={(value) => [`${value.toFixed(2)}M shares`, 'Volume']}
                labelFormatter={(label, items) => {
                  const item = items[0]?.payload;
                  return item ? `Date: ${item.date}` : label;
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="volume" 
                name="Trading Volume" 
                stroke="#f97316" 
                fill="#f97316" 
                fillOpacity={0.3}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow text-sm">
          <h3 className="font-bold mb-2 text-gray-800">Performance Insights</h3>
          <p>
            Apple stock has shown {metrics.percentChange >= 0 ? 'positive' : 'negative'} performance over the past month 
            with a {Math.abs(metrics.percentChange).toFixed(2)}% {metrics.percentChange >= 0 ? 'gain' : 'loss'}.
            The stock reached a high of ${metrics.max.toFixed(2)} and a low of ${metrics.min.toFixed(2)} during this period.
          </p>
          <p className="mt-2">
            Current price: ${stockData[stockData.length - 1]?.close.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow text-sm">
          <h3 className="font-bold mb-2 text-gray-800">Recent Activity</h3>
          <div className="overflow-y-auto max-h-32">
            {stockData.slice(-7).reverse().map((day, i) => (
              <div key={i} className="pb-1 mb-1 border-b border-gray-100 flex justify-between">
                <span>{day.date}</span>
                <span className={day.close >= day.open ? 'text-green-600' : 'text-red-600'}>
                  ${day.close.toFixed(2)} ({((day.close - day.open) / day.open * 100).toFixed(2)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleStockChart;