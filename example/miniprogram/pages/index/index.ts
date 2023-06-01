import dayjs from 'dayjs'
import advancedFormat from 'dayjs/esm/plugin/advancedFormat'
import zh from 'dayjs/esm/locale/zh'

dayjs.extend(advancedFormat)
dayjs.locale(zh)

// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Page({
  data: {
    rq: dayjs().format('Q Do k kk X x')
  },
  onLoad() {
  },
})
