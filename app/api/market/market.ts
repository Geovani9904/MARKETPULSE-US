export interface MarketItem {
  symbol: string;
  value: string;
  change: string;
  positive: boolean;
}

export async function getMarketData(): Promise<MarketItem[]> {
  const symbols = [
    { code: 'SPY', name: 'S&P 500' },
    { code: 'QQQ', name: 'NASDAQ' },
    { code: 'DIA', name: 'DOW JONES' },
    { code: 'CAT', name: 'CATERPILLAR' }
  ];

  const marketResults: MarketItem[] = [];

  for (const item of symbols) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${item.code}?interval=1d&range=2d`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 300 }
      });

      if (!res.ok) continue;

      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;

      if (meta && meta.regularMarketPrice) {
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
        const diff = currentPrice - previousClose;
        const changePercent = previousClose !== 0 ? (diff / previousClose) * 100 : 0;

        marketResults.push({
          symbol: item.name,
          value: currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
          positive: changePercent >= 0,
        });
      }
    } catch (e) {
      // Silencioso para proteger el render
    }
  }

  return marketResults;
}