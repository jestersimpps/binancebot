import { Document, Schema, Model, model } from 'mongoose'

export interface OrderModel {
  symbol: string
  orderId?: string
  openPrice: number
  closePrice: number
  isBuy: boolean
  amount: number
  filled: number
  last: number
  fee?: number
  createdAt?: number
  updatedAt?: number
  smaShort: number
  smaMedium: number
  smaLong: number
  rsi: number
  priceScore: number
  volumeScore: number
}

export interface IOrderModel extends Document {}

export const OrderSchema : Schema = new Schema({
  symbol: String,
  orderId: String,
  openPrice: Number,
  closePrice: Number,
  isBuy: Boolean,
  amount: Number,
  filled: Number,
  last: Number,
  fee: Number,
  createdAt: Number,
  updatedAt: Number,
  smaShort: Number,
  smaMedium: Number,
  smaLong: Number,
  rsi: Number,
  priceScore: Number,
  volumeScore: Number,
  bb_20_3: Number,
  bb_30_3: Number,
  bb_50_3: Number,
  bb_10_3: Number,
  bb_30_2: Number,
  bb_30_1: Number,
  bb_30_4: Number
})

export const DbOrder : Model < IOrderModel > = model<IOrderModel>('Order', OrderSchema)
