import { Variables } from './../config/variables'
import { CryptoModel, DbCrypto, ICryptoModel } from './../schemas/crypto.schema'

export class CryptoService {
  removeAll () {
    DbCrypto.deleteMany({}).then(() => {
      console.log('removed all cryptodata')
    })
  }

  create (crypto: CryptoModel) {
    new DbCrypto({
      symbol: crypto.symbol,
      base: crypto.base,
      history: crypto.history
    }).save((err) => {
      if (err) throw err
    })
  }

  get (symbol: string) {
    return DbCrypto.findOne({ symbol })
  }

  newHistoryPoint (crypto: ICryptoModel, historyPoint: { p: number; t: number; v: number }): CryptoModel {
    const doc = crypto.toObject()
    doc.history.push(historyPoint)
    if (doc.history.length > Variables.secondsToKeep) {
      doc.history.shift()
    }
    delete doc._id
    crypto.set(doc)
    crypto.save()
    return doc
  }
  
}
