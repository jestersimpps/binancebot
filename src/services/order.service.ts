import { WsTicker } from './../models/wsticker'
import { Variables } from './../config/variables'
import { CryptoModel } from './../schemas/crypto.schema'
import { Indicators } from '../utils/indicators'
import chalk from 'chalk'
import { OrderModel, DbOrder, IOrderModel } from '../schemas/order.schema'
import { Time } from '../utils/time'

export class OrderService {
  calculateIndicators (crypto: CryptoModel, cryptoFromWs: WsTicker) {
    const priceArray = crypto.history.map((h) => h.p)
    const volumeArray = crypto.history.map((h) => h.v)
    const lastPriceArray = priceArray.slice(priceArray.length - Variables.lastPricePositions)
    const lastVolumeArray = volumeArray.slice(volumeArray.length - Variables.lastVolumePositions)

    const indicators = {
      smaShort: +Indicators.ema(priceArray, Variables.smaShort).toFixed(8),
      smaMedium: +Indicators.ema(priceArray, Variables.smaMedium).toFixed(8),
      smaLong: +Indicators.ema(priceArray, Variables.smaLong).toFixed(8),
      rsi: +Indicators.rsi(priceArray).toFixed(0),
      priceScore: +((Indicators.average(lastPriceArray) * 100) / Indicators.average(priceArray) - 100).toFixed(3),
      volumeScore: +((Indicators.average(lastVolumeArray) * 100) / Indicators.average(volumeArray) - 100).toFixed(3),
      bb_20_3: (+cryptoFromWs.bestBid * 100) / Indicators.Bb(priceArray, 20, 3).lower - 100,
      bb_30_3: (+cryptoFromWs.bestBid * 100) / Indicators.Bb(priceArray, 30, 3).lower - 100,
      bb_50_3: (+cryptoFromWs.bestBid * 100) / Indicators.Bb(priceArray, 50, 3).lower - 100,
      bb_10_3: (+cryptoFromWs.bestBid * 100) / Indicators.Bb(priceArray, 10, 3).lower - 100,
      bb_30_2: (+cryptoFromWs.bestBid * 100) / Indicators.Bb(priceArray, 30, 2).lower - 100,
      bb_30_1: (+cryptoFromWs.bestBid * 100) / Indicators.Bb(priceArray, 30, 1).lower - 100,
      bb_30_4: (+cryptoFromWs.bestBid * 100) / Indicators.Bb(priceArray, 30, 4).lower - 100
    }

    const shouldBuy = indicators.bb_20_3 < 1 && indicators.priceScore < 0 && indicators.volumeScore > 0.02
    // const shouldBuy = true;
    const shouldSell = indicators.smaShort < indicators.smaMedium && indicators.smaMedium < indicators.smaLong

    console.log(
      crypto.base,
      chalk.yellow(crypto.history[0].v.toFixed(0)),
      indicators.smaShort > indicators.smaMedium
        ? chalk.greenBright(indicators.smaShort.toString())
        : chalk.redBright(indicators.smaShort.toString()),
      indicators.smaMedium > indicators.smaLong
        ? chalk.greenBright(indicators.smaMedium.toString())
        : chalk.redBright(indicators.smaMedium.toString()),
      indicators.smaShort > indicators.smaLong
        ? chalk.greenBright(indicators.smaLong.toString())
        : chalk.redBright(indicators.smaLong.toString()),
      indicators.rsi,
      +indicators.priceScore > 0
        ? chalk.greenBright(indicators.priceScore.toString())
        : chalk.redBright(indicators.priceScore.toString()),
      +indicators.volumeScore > 0
        ? chalk.greenBright(indicators.volumeScore.toString())
        : chalk.redBright(indicators.volumeScore.toString()),
      +indicators.bb_20_3 < 0
        ? chalk.greenBright(indicators.bb_20_3.toFixed(3))
        : chalk.redBright(indicators.bb_20_3.toFixed(3)),
      shouldBuy ? '<--------' : ''
    )

    // (shouldSell && +cryptoFromWs.bestBid * pb.amount > pb.fee * 2 + pb.openPrice * pb.amount) ||

    DbOrder.findOne({ symbol: crypto.symbol, isBuy: true }).then((previousBuy) => {
      if (crypto.history.length > Variables.secondsToKeep - 2) {
        if (previousBuy) {
          const pb = previousBuy.toObject()
          delete pb._id
          if (shouldSell && +cryptoFromWs.bestAsk * pb.amount > pb.fee * 2 + pb.openPrice * pb.amount) {
            this.newSellOrder(cryptoFromWs, pb)
          }
        }
        if (!previousBuy && shouldBuy) {
          this.newBuyOrder(cryptoFromWs, indicators)
        }
      }
    })
  }

  newBuyOrder (cryptoFromWs: WsTicker, indicators) {
    const amount = 1 / +cryptoFromWs.bestAsk
    const fee = 0.00015 * +amount * +cryptoFromWs.bestAsk
    const amountMinusFee = amount - fee

    const order : OrderModel = {
      symbol: cryptoFromWs.symbol,
      orderId: '0',
      openPrice: +cryptoFromWs.bestAsk,
      closePrice: 0,
      amount: amountMinusFee,
      filled: 100,
      last: +cryptoFromWs.bestBid,
      fee,
      isBuy: true,
      createdAt: Time.now(),
      updatedAt: Time.now(),
      ...indicators
    }

    new DbOrder(order).save((err) => {
      if (err) throw err
    })
    console.log(chalk.bgRed('buy order placed.'), order)
  }

  newSellOrder (cryptoFromWs: WsTicker, previousBuy: OrderModel) {
    const amount = previousBuy.amount
    const fee = 0.00015 * +amount * +cryptoFromWs.bestBid // check later
    const amountMinusFee = amount - fee

    const order : OrderModel = {
      ...previousBuy,
      symbol: previousBuy.symbol,
      orderId: '0',
      openPrice: previousBuy.openPrice,
      closePrice: +cryptoFromWs.bestBid,
      amount: amountMinusFee,
      filled: 100,
      last: +cryptoFromWs.bestBid,
      fee,
      isBuy: false,
      createdAt: Time.now(),
      updatedAt: Time.now()
    }

    new DbOrder(order).save((err) => {
      if (err) throw err
    })
    DbOrder.remove({ symbol: previousBuy.symbol, isBuy: true }).then(() => {
      console.log(chalk.bgGreen('sell order placed.'), order)
    })
  }

  removeAll () {
    DbOrder.deleteMany({}).then(() => {
      console.log('removed all orderdata')
    })
  }

  getProfit () {
    DbOrder.find({}).then((orders) => {
      let profit = 0
      orders.forEach((order) => {
        const doc : OrderModel = order.toObject()
        if (doc.isBuy) {
          profit += doc.last * doc.amount - doc.openPrice * doc.amount - 2 * doc.fee
        } else {
          profit += doc.closePrice * doc.amount - doc.openPrice * doc.amount - 2 * doc.fee
        }
      })
      console.log('----------------------------------------------------------')
      console.log(` ${new Date().toUTCString()}`)
      console.log(
        profit > 0
          ? ` Profit/loss: ${chalk.greenBright(profit.toString())}`
          : ` Profit/loss: ${chalk.redBright(profit.toString())}`
      )
      console.log('----------------------------------------------------------')
    })
  }
}
