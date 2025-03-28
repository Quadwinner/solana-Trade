import { useEffect, useState } from 'react'

interface MarketStat {
  id: string
  name: string
  value: string
  change: number
  changeType: 'positive' | 'negative' | 'neutral'
}

export const MarketOverview = () => {
  const [stats, setStats] = useState<MarketStat[]>([
    {
      id: 'total-volume',
      name: 'Total Volume (24h)',
      value: '2,345,678 SOL',
      change: 12.5,
      changeType: 'positive'
    },
    {
      id: 'active-stocks',
      name: 'Active Stocks',
      value: '136',
      change: 3.8,
      changeType: 'positive'
    },
    {
      id: 'transactions',
      name: 'Transactions (24h)',
      value: '15,432',
      change: -2.3,
      changeType: 'negative'
    },
    {
      id: 'market-cap',
      name: 'Market Cap',
      value: '56,789,012 SOL',
      change: 5.9,
      changeType: 'positive'
    }
  ])

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-white">Market Overview</h3>
        
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="relative bg-slate-700 pt-5 px-4 pb-4 sm:pt-6 sm:px-6 rounded-lg overflow-hidden"
            >
              <dt>
                <p className="text-sm font-medium text-gray-400 truncate">{stat.name}</p>
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-white">
                  {stat.value}
                </div>

                <div
                  className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0
                    ${
                      stat.changeType === 'positive'
                        ? 'bg-green-100 text-green-800'
                        : stat.changeType === 'negative'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  `}
                >
                  {stat.changeType === 'positive' ? (
                    <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : stat.changeType === 'negative' ? (
                    <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : null}
                  <span className="ml-1">{Math.abs(stat.change)}%</span>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
} 