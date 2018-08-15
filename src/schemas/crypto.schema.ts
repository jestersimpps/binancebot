import { Document, Schema, Model, model } from 'mongoose'

export interface CryptoModel {
  symbol: string
  base: string
  history: {
    p: number
    v: number
    t: number
  }[]
}

export interface ICryptoModel extends Document {}

const historySchema = new Schema({
  p: Number,
  t: Number,
  v: Number
})

export const CryptoSchema : Schema = new Schema({
  symbol: String,
  base: String,
  history: [historySchema]
})

export const DbCrypto : Model < ICryptoModel > = model<ICryptoModel>('Crypto', CryptoSchema)
