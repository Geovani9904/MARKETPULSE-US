import { MarketItem } from '@/app/api/market/market';

interface MarketTickerProps {
  marketIndices: MarketItem[];
}

export default function MarketTicker({ marketIndices }: MarketTickerProps) {
  return (
    <div className="bg-neutral-900 border-b border-neutral-800 py-2.5 px-4 overflow-x-auto">
      <div className="max-w-4xl mx-auto flex space-x-8 text-xs whitespace-nowrap">
        {marketIndices.length > 0 ? (
          marketIndices.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="font-semibold text-neutral-400">{item.symbol}</span>
              <span className="text-white">${item.value}</span>
              <span className={item.positive ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {item.change}
              </span>
            </div>
          ))
        ) : (
          <span className="text-neutral-500">Market data temporarily unavailable.</span>
        )}
      </div>
    </div>
  );
}