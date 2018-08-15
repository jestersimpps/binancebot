export interface WsTicker {
  eventTime: number
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvg: string
  prevDayClose: string
  curDayClose: string
  closeTradeQuantity: string
  bestBid: string
  bestBidQnt: string
  bestAsk: string
  bestAskQnt: string
  open: string
  high: string
  low: string
  volume: string
  volumeQuote: string
  openTime: number
  closeTime: number
  firstTradeId: number
  lastTradeId: number
  totalTrades: number
}
