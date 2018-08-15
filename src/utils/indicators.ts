import { Variables } from './../config/variables';
const BB = require('technicalindicators').BollingerBands

export class Indicators {
  static average (array: number[]): number {
    if (array.length) {
      const sum = array.reduce((a, b) => a + b)
      return sum / array.length
    }
    return 0
  }

  static ema (closePrices: number[], mRange: number) {
    const k = 2 / (mRange + 1)
    // first item is just the same as the first item in the input
    const emaArray = [closePrices[0]]
    // for the rest of the items, they are computed with the previous one
    for (let i = 1; i < closePrices.length; i++) {
      emaArray.push(closePrices[i] * k + emaArray[i - 1] * (1 - k))
    }
    return emaArray[closePrices.length - 1]
  }

  static rsi (closePrices: number[]) {
    let sumGain = 0
    let sumLoss = 0
    for (let i = 1; i < closePrices.length; i++) {
      const difference = closePrices[i] - closePrices[i - 1]
      if (difference >= 0) {
        sumGain += difference
      } else {
        sumLoss -= difference
      }
    }
    if (sumGain == 0) return 0
    const relativeStrength = sumGain / sumLoss
    return 100 - 100 / (1 + relativeStrength)
  }

  static Bb (closePrices: number[],period = Variables.bollingerbandsPeriod, stDev = Variables.bollingerbandsdev) {

    const input = {
      period,
      values: closePrices,
      stdDev: stDev
    }
    const bb = BB.calculate(input)

    return bb[bb.length - 1]
  }

}
