export interface Participant {
  id: string
  name: string
  machineCode?: string
  companyName?: string
  region?: string
  phone?: string
  address?: string
  department?: string
  email?: string
  [key: string]: string | undefined
}

export interface PrizeItem {
  id: string
  name: string
  image?: string
}

export interface Prize {
  id: string
  name: string
  count: number
  level: number
  description?: string
  image?: string       // 兼容旧数据（单张）
  images?: string[]   // 多张图片
  items?: PrizeItem[] // 奖项包含的多个物品
}

export interface Winner {
  id: string
  participant: Participant
  prize: Prize
  winTime: Date
}

export interface LotteryHistory {
  id: string
  prize: Prize
  winners: Winner[]
  drawTime: Date
}

export interface ExcelRow {
  [key: string]: string | number | null | undefined
}
