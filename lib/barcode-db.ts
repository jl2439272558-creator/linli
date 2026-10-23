/**
 * 商品条码资料库（演示数据）
 *
 * 生产环境接入真实条码数据库的两种方式：
 * 1. 第三方付费 API：聚合数据、阿里云市场「商品条码查询」等，按次计费，
 *    将 app/api/barcode/route.ts 中的 queryBarcodeDb 调用替换为服务端 fetch
 *    （API Key 放服务端环境变量，如 process.env.BARCODE_API_KEY，绝不可暴露到前端）。
 * 2. 中国物品编码中心（GS1 China）：企业成员可通过其数据服务接口校验条码归属，
 *    但仅提供厂商信息，不含品名/规格/价格，零售业普遍采用方案 1 + 自建商品库。
 */

export type BarcodeProductInfo = {
  barcode: string
  name: string
  brand: string
  spec: string
  category: string
  unit: string
  /** 市场参考零售价（元） */
  retailPrice: number
  /** 市场参考进货价（元），无参考时为 null */
  purchasePrice: number | null
  /** 数据来源标注，用于界面展示与审计 */
  source: string
}

const SOURCE = '内置演示条码库'

const db: BarcodeProductInfo[] = [
  { barcode: '6901285991219', name: '怡宝 纯净水', brand: '怡宝', spec: '555ml/瓶', category: '饮料冲调', unit: '瓶', retailPrice: 2.0, purchasePrice: 1.2, source: SOURCE },
  { barcode: '6907992100023', name: '伊利 纯牛奶', brand: '伊利', spec: '250ml/盒', category: '乳品', unit: '盒', retailPrice: 3.5, purchasePrice: 2.4, source: SOURCE },
  { barcode: '6917878007445', name: '蒙牛 酸酸乳 原味', brand: '蒙牛', spec: '250ml/盒', category: '乳品', unit: '盒', retailPrice: 2.5, purchasePrice: 1.7, source: SOURCE },
  { barcode: '6934665099113', name: '可口可乐 零度汽水', brand: '可口可乐', spec: '500ml/瓶', category: '饮料冲调', unit: '瓶', retailPrice: 3.5, purchasePrice: 2.3, source: SOURCE },
  { barcode: '6925303721350', name: '统一 冰红茶', brand: '统一', spec: '500ml/瓶', category: '饮料冲调', unit: '瓶', retailPrice: 3.0, purchasePrice: 2.0, source: SOURCE },
  { barcode: '6954767412573', name: '雪碧 柠檬味汽水', brand: '雪碧', spec: '330ml/罐', category: '饮料冲调', unit: '罐', retailPrice: 3.0, purchasePrice: 1.85, source: SOURCE },
  { barcode: '6928804011132', name: '景田 百岁山 饮用天然矿泉水', brand: '百岁山', spec: '570ml/瓶', category: '饮料冲调', unit: '瓶', retailPrice: 3.0, purchasePrice: 2.0, source: SOURCE },
  { barcode: '6970399920002', name: '元气森林 燃茶 桃香乌龙', brand: '元气森林', spec: '500ml/瓶', category: '饮料冲调', unit: '瓶', retailPrice: 5.5, purchasePrice: 3.6, source: SOURCE },
  { barcode: '6900873000777', name: '康师傅 冰红茶 柠檬味', brand: '康师傅', spec: '500ml/瓶', category: '饮料冲调', unit: '瓶', retailPrice: 3.0, purchasePrice: 1.95, source: SOURCE },
  { barcode: '6900873001101', name: '康师傅 鲜虾鱼板面', brand: '康师傅', spec: '101g/袋', category: '方便速食', unit: '袋', retailPrice: 3.5, purchasePrice: 2.2, source: SOURCE },
  { barcode: '6925303722104', name: '统一 汤达人 日式豚骨拉面', brand: '统一', spec: '125g/袋', category: '方便速食', unit: '袋', retailPrice: 5.5, purchasePrice: 3.8, source: SOURCE },
  { barcode: '6937458400028', name: '白象 大骨面 原汁猪骨味', brand: '白象', spec: '113g/袋', category: '方便速食', unit: '袋', retailPrice: 3.0, purchasePrice: 1.9, source: SOURCE },
  { barcode: '6924743915763', name: '乐事 黄瓜味薯片', brand: '乐事', spec: '70g/袋', category: '休闲零食', unit: '袋', retailPrice: 7.5, purchasePrice: 4.8, source: SOURCE },
  { barcode: '6901668053411', name: '奥利奥 巧克力味夹心饼干', brand: '奥利奥', spec: '97g/盒', category: '休闲零食', unit: '盒', retailPrice: 7.9, purchasePrice: 5.2, source: SOURCE },
  { barcode: '6920658211137', name: '旺旺 仙贝', brand: '旺旺', spec: '52g/袋', category: '休闲零食', unit: '袋', retailPrice: 5.5, purchasePrice: 3.6, source: SOURCE },
  { barcode: '6935284500466', name: '卫龙 大面筋 香辣味', brand: '卫龙', spec: '102g/袋', category: '休闲零食', unit: '袋', retailPrice: 3.5, purchasePrice: 2.1, source: SOURCE },
  { barcode: '6910016319259', name: '洽洽 香瓜子', brand: '洽洽', spec: '160g/袋', category: '休闲零食', unit: '袋', retailPrice: 6.5, purchasePrice: 4.2, source: SOURCE },
  { barcode: '6902022135321', name: '蓝月亮 深层洁净洗衣液 补充装', brand: '蓝月亮', spec: '1kg/袋', category: '家庭清洁', unit: '袋', retailPrice: 19.9, purchasePrice: 12.5, source: SOURCE },
  { barcode: '6901236341292', name: '维达 蓝色经典卷纸', brand: '维达', spec: '10 卷/提', category: '日用百货', unit: '提', retailPrice: 15.9, purchasePrice: 10.5, source: SOURCE },
  { barcode: '6903148100028', name: '舒肤佳 纯白香皂', brand: '舒肤佳', spec: '115g/块', category: '个人护理', unit: '块', retailPrice: 5.5, purchasePrice: 3.4, source: SOURCE },
  { barcode: '6902083882417', name: '飘柔 去屑洗发水', brand: '飘柔', spec: '400ml/瓶', category: '个人护理', unit: '瓶', retailPrice: 29.9, purchasePrice: 19.5, source: SOURCE },
  { barcode: '6920174736115', name: '立白 天然皂粉', brand: '立白', spec: '1.6kg/袋', category: '家庭清洁', unit: '袋', retailPrice: 16.9, purchasePrice: 11.0, source: SOURCE },
  { barcode: '6902088600033', name: '金龙鱼 黄金比例食用调和油', brand: '金龙鱼', spec: '5L/桶', category: '粮油调味', unit: '桶', retailPrice: 65.0, purchasePrice: 52.0, source: SOURCE },
  { barcode: '6922507300079', name: '海天 生抽酱油', brand: '海天', spec: '500ml/瓶', category: '粮油调味', unit: '瓶', retailPrice: 8.5, purchasePrice: 5.6, source: SOURCE },
]

const index = new Map(db.map((item) => [item.barcode, item]))

/** 本地演示库查询（同步）。生产环境替换为第三方 API 调用。 */
export function queryBarcodeDb(code: string): BarcodeProductInfo | null {
  return index.get(code) ?? null
}

/** 演示用：从库中随机取一条（模拟扫描枪扫到的商品） */
export function randomBarcodeEntry(rng: () => number = Math.random): BarcodeProductInfo {
  return db[Math.floor(rng() * db.length)]
}
