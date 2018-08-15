import { Time } from './utils/time'
import { CryptoService } from './services/crypto.service'
import { WsTicker } from './models/wsticker'
import Binance from 'binance-api-node'
import { Variables } from './config/variables'
import * as mongoose from 'mongoose'
import { OrderService } from './services/order.service'
import { DbOrder, OrderModel } from './schemas/order.schema'

const url = 'mongodb://localhost:27017/tradeBot'

mongoose.connect(
  url,
  { useNewUrlParser: true },
  (err) => {
    if (err) throw err
    console.log('Successfully connected')
  }
)

const binance = Binance()
const cryptoService = new CryptoService()
const orderService = new OrderService()

// cryptoService.removeAll()
// orderService.removeAll()

binance.ws.allTickers((tickers: WsTicker[]) => {
  orderService.getProfit()
  tickers
    .filter((t) => +t.volumeQuote > Variables.minVolume)
    .filter((t) => t.symbol.endsWith('BTC'))
    .map((ticker: WsTicker) => {
      DbOrder.findOne({ symbol: ticker.symbol, closePrice: 0 }).then((buyOrder) => {
        if (buyOrder) {
          const doc = buyOrder.toObject()
          doc.last = +ticker.bestAsk
          doc.updatedAt = Time.now()
          delete doc._id
          buyOrder.set(doc)
          buyOrder.save()
        }
      })
      cryptoService.get(ticker.symbol).then((crypto) => {
        if (crypto) {
          const cryptoObject = cryptoService.newHistoryPoint(crypto, {
            p: +ticker.bestBid,
            v: +ticker.volumeQuote,
            t: +ticker.eventTime
          })
          orderService.calculateIndicators(cryptoObject, ticker)
        } else {
          cryptoService.create({
            symbol: ticker.symbol,
            base: ticker.symbol.replace('BTC', ''),
            history: [
              {
                p: +ticker.bestBid,
                v: +ticker.volumeQuote,
                t: +ticker.eventTime
              }
            ]
          })
        }
      })
    })
})
