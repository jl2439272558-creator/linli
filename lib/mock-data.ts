export type StockStatus = '正常' | '库存偏低' | '缺货'

export type ProductStatus = '在售' | '停售'

export type Product = {
  id: string
  name: string
  image: string | null
  barcode: string | null
  category: string
  brand: string
  spec: string | null
  purchasePrice: number | null
  retailPrice: number | null
  memberPrice: number | null
  minPrice: number | null
  stock: number
  safetyStock: number
  unit: string
  supplier: string
  status: ProductStatus
  source: '手动录入' | 'AI 采集' | '批量导入'
  updatedAt: string
}

export const categories = ['饮料冲调', '方便速食', '休闲零食', '乳品', '日用百货', '家庭清洁', '粮油调味', '个人护理']
export const brands = ['农夫山泉', '可口可乐', '康师傅', '统一', '维达', '蓝月亮', '乐事', '奥利奥', '蒙牛', '元气森林', '旺旺', '立白', '怡宝', '卫龙', '金龙鱼', '舒肤佳']
export type StoreStatus = '营业中' | '筹备中' | '已停业'

export type StoreInfo = {
  id: string
  name: string
  address: string
  phone: string
  hours: string
  manager: string
  status: StoreStatus
  openedAt: string
  /** 本月销售额（演示值） */
  monthSales: number
}

export const storeStatusTone: Record<StoreStatus, 'success' | 'info' | 'neutral'> = {
  营业中: 'success',
  筹备中: 'info',
  已停业: 'neutral',
}

export const stores: StoreInfo[] = [
  { id: 's1', name: '幸福里社区店', address: '杭州市西湖区文三路 218 号', phone: '0571-8821 6690', hours: '07:00–23:00', manager: '王建国', status: '营业中', openedAt: '2023-06-18', monthSales: 218420 },
  { id: 's2', name: '阳光花园店', address: '杭州市拱墅区湖墅南路 66 号', phone: '0571-8765 2310', hours: '07:30–22:30', manager: '周婷', status: '营业中', openedAt: '2024-04-02', monthSales: 162350 },
  { id: 's3', name: '东湖便利店', address: '杭州市余杭区东湖北路 9 号', phone: '0571-8902 4471', hours: '08:00–22:00', manager: '郑凯', status: '筹备中', openedAt: '2026-11-01', monthSales: 0 },
]

export const suppliers = ['杭州华润食品批发', '康达饮料经销', '佳旺日化供应链', '万家粮油商贸', '鲜丰乳品供应']

export const units = ['瓶', '罐', '袋', '桶', '盒', '箱', '提', '包', '件']

export function getStockStatus(p: Pick<Product, 'stock' | 'safetyStock'>): StockStatus {
  if (p.stock <= 0) return '缺货'
  if (p.stock < p.safetyStock) return '库存偏低'
  return '正常'
}

export const initialProducts: Product[] = [
  { id: 'P10001', name: '农夫山泉 饮用天然水', image: '/products/water.png', barcode: '6921168509256', category: '饮料冲调', brand: '农夫山泉', spec: '550ml/瓶', purchasePrice: 1.15, retailPrice: 2.0, memberPrice: 1.9, minPrice: 1.8, stock: 386, safetyStock: 120, unit: '瓶', supplier: '康达饮料经销', status: '在售', source: '手动录入', updatedAt: '2026-10-20 09:12' },
  { id: 'P10002', name: '可口可乐 汽水 罐装', image: '/products/cola.png', barcode: '6954767410388', category: '饮料冲调', brand: '可口可乐', spec: '330ml/罐', purchasePrice: 1.85, retailPrice: 3.0, memberPrice: 2.8, minPrice: 2.5, stock: 42, safetyStock: 60, unit: '罐', supplier: '康达饮料经销', status: '在售', source: '批量导入', updatedAt: '2026-10-19 18:40' },
  { id: 'P10003', name: '康师傅 红烧牛肉面', image: '/products/noodle-bag.png', barcode: '6900873000258', category: '方便速食', brand: '康师傅', spec: '103g/袋', purchasePrice: 2.1, retailPrice: 3.5, memberPrice: 3.3, minPrice: 3.0, stock: 215, safetyStock: 80, unit: '袋', supplier: '杭州华润食品批发', status: '在售', source: '手动录入', updatedAt: '2026-10-19 16:05' },
  { id: 'P10004', name: '统一 老坛酸菜牛肉面 桶装', image: '/products/noodle-cup.png', barcode: '6925303721367', category: '方便速食', brand: '统一', spec: '121g/桶', purchasePrice: 3.3, retailPrice: 5.0, memberPrice: 4.8, minPrice: 4.5, stock: 18, safetyStock: 40, unit: '桶', supplier: '杭州华润食品批发', status: '在售', source: 'AI 采集', updatedAt: '2026-10-19 11:22' },
  { id: 'P10005', name: '维达 超韧抽纸 3 层', image: '/products/tissue.png', barcode: '6901236341285', category: '日用百货', brand: '维达', spec: '100 抽 × 3 包', purchasePrice: 8.6, retailPrice: 12.9, memberPrice: 12.5, minPrice: 11.5, stock: 64, safetyStock: 30, unit: '提', supplier: '佳旺日化供应链', status: '在售', source: '手动录入', updatedAt: '2026-10-18 20:10' },
  { id: 'P10006', name: '蓝月亮 深层洁净洗衣液', image: '/products/detergent.png', barcode: '6902022135314', category: '家庭清洁', brand: '蓝月亮', spec: '3kg/瓶', purchasePrice: 32.5, retailPrice: 49.9, memberPrice: 47.9, minPrice: 45.0, stock: 0, safetyStock: 10, unit: '瓶', supplier: '佳旺日化供应链', status: '在售', source: 'AI 采集', updatedAt: '2026-10-18 15:36' },
  { id: 'P10007', name: '乐事 原味薯片', image: '/products/chips.png', barcode: '6924743915756', category: '休闲零食', brand: '乐事', spec: '70g/袋', purchasePrice: 4.8, retailPrice: 7.5, memberPrice: 7.2, minPrice: 6.5, stock: 96, safetyStock: 40, unit: '袋', supplier: '杭州华润食品批发', status: '在售', source: '批量导入', updatedAt: '2026-10-18 10:02' },
  { id: 'P10008', name: '奥利奥 原味夹心饼干', image: '/products/cookies.png', barcode: '6901668053893', category: '休闲零食', brand: '奥利奥', spec: '116g/盒', purchasePrice: 5.6, retailPrice: 8.9, memberPrice: 8.5, minPrice: 8.0, stock: 23, safetyStock: 30, unit: '盒', supplier: '杭州华润食品批发', status: '在售', source: '手动录入', updatedAt: '2026-10-17 19:48' },
  { id: 'P10009', name: '蒙牛 纯牛奶 整箱', image: '/products/milk.png', barcode: '6923644266318', category: '乳品', brand: '蒙牛', spec: '250ml × 12 盒', purchasePrice: 38.0, retailPrice: 52.0, memberPrice: 50.0, minPrice: 48.0, stock: 31, safetyStock: 15, unit: '箱', supplier: '鲜丰乳品供应', status: '在售', source: '手动录入', updatedAt: '2026-10-17 14:30' },
  { id: 'P10010', name: '元气森林 白桃味苏打气泡水', image: '/products/sparkling.png', barcode: '6970399920415', category: '饮料冲调', brand: '元气森林', spec: '480ml/瓶', purchasePrice: 3.2, retailPrice: 5.5, memberPrice: 5.3, minPrice: 5.0, stock: 128, safetyStock: 48, unit: '瓶', supplier: '康达饮料经销', status: '在售', source: 'AI 采集', updatedAt: '2026-10-17 09:15' },
  { id: 'P10011', name: '旺旺 雪饼', image: '/products/rice-cracker.png', barcode: '6920658211152', category: '休闲零食', brand: '旺旺', spec: '84g/袋', purchasePrice: 4.2, retailPrice: 6.8, memberPrice: 6.5, minPrice: 6.0, stock: 7, safetyStock: 24, unit: '袋', supplier: '杭州华润食品批发', status: '在售', source: '批量导入', updatedAt: '2026-10-16 17:44' },
  { id: 'P10012', name: '立白 柠檬清新洗洁精', image: '/products/dish-soap.png', barcode: '6920174736078', category: '家庭清洁', brand: '立白', spec: '1kg/瓶', purchasePrice: 7.9, retailPrice: 11.9, memberPrice: 11.5, minPrice: 11.0, stock: 54, safetyStock: 20, unit: '瓶', supplier: '佳旺日化供应链', status: '停售', source: '手动录入', updatedAt: '2026-10-16 08:58' },
]

/* ---------------- AI 采集任务 ---------------- */

export type TaskStatus = '等待处理' | '识别中' | '待审核' | '已入库' | '处理失败'
export type TaskSource = '美团商品资料' | '商品链接导入' | '图片识别' | 'Excel 导入' | 'CSV 导入'

export type CollectTask = {
  id: string
  source: TaskSource
  sourceDetail: string
  total: number
  success: number
  pending: number
  status: TaskStatus
  progress: number
  createdAt: string
  operator: string
}

export const initialTasks: CollectTask[] = [
  { id: 'AT20261020003', source: '图片识别', sourceDetail: '货架照片 12 张', total: 10, success: 8, pending: 10, status: '待审核', progress: 100, createdAt: '2026-10-20 10:24', operator: '王店长' },
  { id: 'AT20261020002', source: 'Excel 导入', sourceDetail: '供应商报价单_十月.xlsx', total: 86, success: 0, pending: 0, status: '识别中', progress: 46, createdAt: '2026-10-20 09:58', operator: '王店长' },
  { id: 'AT20261020001', source: '商品链接导入', sourceDetail: '供应商商品详情页 3 条', total: 3, success: 0, pending: 0, status: '等待处理', progress: 0, createdAt: '2026-10-20 09:41', operator: '李晓' },
  { id: 'AT20261019004', source: '美团商品资料', sourceDetail: '合规导出文件 meituan_items.csv', total: 142, success: 139, pending: 0, status: '已入库', progress: 100, createdAt: '2026-10-19 16:12', operator: '王店长' },
  { id: 'AT20261019003', source: 'CSV 导入', sourceDetail: '旧系统商品档案.csv', total: 58, success: 0, pending: 0, status: '处理失败', progress: 100, createdAt: '2026-10-19 11:30', operator: '李晓' },
  { id: 'AT20261018002', source: '图片识别', sourceDetail: '新品到货照片 6 张', total: 6, success: 6, pending: 0, status: '已入库', progress: 100, createdAt: '2026-10-18 14:05', operator: '张敏' },
]

/* ---------------- AI 识别结果 ---------------- */

/** source: 来源资料中实际存在；ai: 大模型推断/建议；pending: 未能确认；manual: 人工修改确认 */
export type FieldOrigin = 'source' | 'ai' | 'pending' | 'manual'
export type Field<T = string> = { value: T | null; origin: FieldOrigin; note?: string }

export type ReviewStatus = '待审核' | '需补充' | '已确认' | '识别中' | '已入库'

export type ReviewItem = {
  id: string
  taskId: string
  image: string | null
  confidence: number
  name: Field
  brand: Field
  spec: Field
  category: Field
  barcode: Field
  refPrice: Field<number>
  suggestedPrice: Field<number>
  status: ReviewStatus
  sourceText: string
}

const s = <T,>(value: T, note?: string): Field<T> => ({ value, origin: 'source', note })
const a = <T,>(value: T, note?: string): Field<T> => ({ value, origin: 'ai', note })
const p = <T,>(note?: string): Field<T> => ({ value: null, origin: 'pending', note })

export const initialReviewItems: ReviewItem[] = [
  { id: 'R001', taskId: 'AT20261020003', image: '/products/purified-water.png', confidence: 96, name: s('怡宝 纯净水'), brand: s('怡宝'), spec: s('555ml/瓶'), category: a('饮料冲调', '依据商品名称与包装推断'), barcode: s('6901285991219', '包装条码区清晰可读'), refPrice: p('来源资料未包含价格'), suggestedPrice: a(2.0, '参考同类商品区间 1.8–2.5 元'), status: '待审核', sourceText: '照片 IMG_0412：瓶身标签「怡宝 纯净水 555ml」，条码清晰。' },
  { id: 'R002', taskId: 'AT20261020003', image: '/products/spicy-strip.png', confidence: 91, name: s('卫龙 大面筋 辣条'), brand: s('卫龙'), spec: a('102g/袋', '净含量字样部分遮挡，按可见字符推断'), category: a('休闲零食'), barcode: p('条码被价签遮挡'), refPrice: p('来源资料未包含价格'), suggestedPrice: a(3.5, '参考同类商品区间 3.0–4.5 元'), status: '需补充', sourceText: '照片 IMG_0415：包装正面「卫龙 大面筋」，净含量区域反光。' },
  { id: 'R003', taskId: 'AT20261020003', image: '/products/oil.png', confidence: 94, name: s('金龙鱼 精炼一级大豆油'), brand: s('金龙鱼'), spec: s('5L/桶'), category: a('粮油调味'), barcode: s('6948195800071'), refPrice: s(59.9, '货架价签可见'), suggestedPrice: a(62.9, '高于价签 5%，可按门店定价策略调整'), status: '待审核', sourceText: '照片 IMG_0417：桶身「金龙鱼 精炼一级大豆油 5L」，价签 59.90 元。' },
  { id: 'R004', taskId: 'AT20261020003', image: '/products/soap.png', confidence: 88, name: s('舒肤佳 纯白清香型香皂'), brand: s('舒肤佳'), spec: p('包装规格未出现在照片中'), category: a('个人护理'), barcode: p('未识别到条码'), refPrice: p(), suggestedPrice: p('规格未确认，暂不提供建议价'), status: '需补充', sourceText: '照片 IMG_0420：外盒正面「舒肤佳 纯白清香」，侧面不可见。' },
  { id: 'R005', taskId: 'AT20261020003', image: '/products/cola.png', confidence: 98, name: s('可口可乐 汽水 罐装'), brand: s('可口可乐'), spec: s('330ml/罐'), category: a('饮料冲调'), barcode: s('6954767410388', '与商品库已有商品条码一致'), refPrice: s(3.0, '货架价签可见'), suggestedPrice: a(3.0, '与现售价一致'), status: '待审核', sourceText: '照片 IMG_0421：罐身「可口可乐 330ml」，价签 3.00 元。' },
  { id: 'R006', taskId: 'AT20261020003', image: '/products/chips.png', confidence: 90, name: s('乐事 黄瓜味薯片'), brand: s('乐事'), spec: s('70g/袋'), category: a('休闲零食'), barcode: p('条码区域模糊'), refPrice: p(), suggestedPrice: a(7.5, '参考同品牌原味薯片售价'), status: '待审核', sourceText: '照片 IMG_0423：包装「乐事 黄瓜味 70g」，背面未拍摄。' },
  { id: 'R007', taskId: 'AT20261020003', image: '/products/sparkling.png', confidence: 93, name: s('元气森林 青瓜味苏打气泡水'), brand: s('元气森林'), spec: s('480ml/瓶'), category: a('饮料冲调'), barcode: s('6970399920439'), refPrice: s(5.5), suggestedPrice: a(5.5), status: '待审核', sourceText: '照片 IMG_0425：瓶身「元气森林 青瓜味 480ml」，价签 5.50 元。' },
  { id: 'R008', taskId: 'AT20261020003', image: null, confidence: 62, name: a('疑似：康师傅 冰红茶', '仅识别到部分瓶身文字'), brand: a('康师傅'), spec: p('未识别'), category: a('饮料冲调'), barcode: p('未识别'), refPrice: p(), suggestedPrice: p('商品信息不足'), status: '需补充', sourceText: '照片 IMG_0428：画面模糊，仅可见「…红茶」及部分品牌标识。' },
  { id: 'R009', taskId: 'AT20261020003', image: '/products/milk.png', confidence: 95, name: s('蒙牛 纯牛奶 整箱'), brand: s('蒙牛'), spec: s('250ml × 12 盒'), category: a('乳品'), barcode: s('6923644266318'), refPrice: s(52.0), suggestedPrice: a(52.0), status: '已确认', sourceText: '照片 IMG_0430：箱体「蒙牛 纯牛奶 250ml×12」，价签 52.00 元。' },
  { id: 'R010', taskId: 'AT20261020003', image: '/products/rice-cracker.png', confidence: 89, name: s('旺旺 仙贝'), brand: s('旺旺'), spec: a('52g/袋', '依据包装尺寸与常见规格推断'), category: a('休闲零食'), barcode: p(), refPrice: s(5.8, '货架价签可见'), suggestedPrice: a(5.8), status: '待审核', sourceText: '照片 IMG_0432：包装「旺旺 仙贝」，价签 5.80 元。' },
]

/* ---------------- 经营工作台 ---------------- */

export const salesTrend = [
  { date: '10-07', sales: 6820, profit: 1640 },
  { date: '10-08', sales: 7140, profit: 1720 },
  { date: '10-09', sales: 6590, profit: 1580 },
  { date: '10-10', sales: 7980, profit: 1930 },
  { date: '10-11', sales: 9260, profit: 2280 },
  { date: '10-12', sales: 9810, profit: 2410 },
  { date: '10-13', sales: 7230, profit: 1760 },
  { date: '10-14', sales: 7050, profit: 1690 },
  { date: '10-15', sales: 7420, profit: 1810 },
  { date: '10-16', sales: 7680, profit: 1860 },
  { date: '10-17', sales: 8350, profit: 2040 },
  { date: '10-18', sales: 9640, profit: 2370 },
  { date: '10-19', sales: 10120, profit: 2490 },
  { date: '10-20', sales: 8426, profit: 2068 },
]

/**
 * 近 90 天销售流水（2026-07-23 至 2026-10-20，演示数据）。
 * 前 76 天由确定性公式生成，最后 14 天沿用 salesTrend，保证与工作台指标一致。
 * 订单数按客单价 27 元推算（与 todayStats.avgTicket 一致）。
 */
export const salesDaily: { date: string; sales: number; profit: number; orders: number }[] = (() => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const end = new Date(2026, 9, 20)
  const rows: { date: string; sales: number; profit: number; orders: number }[] = []
  for (let i = 90 - 14; i >= 1; i--) {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    const dow = d.getDay()
    const weekend = dow === 0 || dow === 6
    const wave = Math.sin(i / 4.7) * 560
    const growth = (90 - i) * 9
    const sales = Math.round((weekend ? 9300 : 7350) + wave + growth)
    rows.push({ date: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, sales, profit: Math.round(sales * 0.245), orders: Math.round(sales / 27) })
  }
  for (const d of salesTrend) rows.push({ date: d.date, sales: d.sales, profit: d.profit, orders: Math.round(d.sales / 27) })
  return rows
})()

/* ---------------- 商品销售排行（经营报表用） ---------------- */

/** 近 30 天各商品销量（演示值），金额与毛利按商品库中的定价计算，保证跨页一致 */
const productSalesQty: { productId: string; quantity: number }[] = [
  { productId: 'P10001', quantity: 3720 },
  { productId: 'P10002', quantity: 2040 },
  { productId: 'P10003', quantity: 1560 },
  { productId: 'P10010', quantity: 920 },
  { productId: 'P10004', quantity: 840 },
  { productId: 'P10007', quantity: 520 },
  { productId: 'P10011', quantity: 480 },
  { productId: 'P10008', quantity: 300 },
  { productId: 'P10005', quantity: 192 },
  { productId: 'P10009', quantity: 108 },
]

export type ProductSalesRow = {
  productId: string
  name: string
  category: string
  brand: string
  quantity: number
  sales: number
  profit: number
  margin: number
}

export const productSalesRank: ProductSalesRow[] = productSalesQty
  .map(({ productId, quantity }) => {
    const p = initialProducts.find((x) => x.id === productId)
    if (!p || p.retailPrice === null) return null
    const sales = quantity * p.retailPrice
    const profit = quantity * (p.retailPrice - (p.purchasePrice ?? p.retailPrice))
    return {
      productId,
      name: p.name,
      category: p.category,
      brand: p.brand,
      quantity,
      sales,
      profit,
      margin: sales ? (profit / sales) * 100 : 0,
    }
  })
  .filter((r): r is ProductSalesRow => r !== null)
  .sort((a, b) => b.sales - a.sales)

export const categorySales = [
  { category: '饮料冲调', sales: 2864 },
  { category: '休闲零食', sales: 1852 },
  { category: '方便速食', sales: 1236 },
  { category: '乳品', sales: 984 },
  { category: '日用百货', sales: 726 },
  { category: '家庭清洁', sales: 512 },
  { category: '粮油调味', sales: 252 },
]

export const todayStats = {
  sales: 8426.5,
  salesDelta: 6.8,
  orders: 312,
  ordersDelta: 4.2,
  profit: 2068.3,
  profitDelta: 8.1,
  avgTicket: 27.0,
}

export const aiInsights = [
  { id: 'i1', level: '补货', title: '蓝月亮洗衣液已缺货 1 天', detail: '近 7 日日均销售 3.2 瓶，建议补货 24 瓶，可覆盖约 7 天销售。', action: '生成采购单' },
  { id: 'i2', level: '定价', title: '可口可乐罐装周末销量提升 38%', detail: '周五至周日晚间时段需求集中，建议与薯片组合陈列，并保持现价。', action: '查看分析' },
  { id: 'i3', level: '滞销', title: '2 款日化商品 30 天未动销', detail: '占用库存金额约 ¥ 977，建议调整陈列位置或设置限时促销。', action: '查看商品' },
]

export const notifications = [
  { id: 'n1', title: 'AI 识别任务已完成', desc: '任务 AT20261020003 识别 10 件商品，待审核', time: '10 分钟前', unread: true },
  { id: 'n2', title: '库存预警', desc: '旺旺雪饼库存仅剩 7 袋，低于安全库存', time: '32 分钟前', unread: true },
  { id: 'n3', title: '采购单已签收', desc: '采购单 PO20261019 已由供应商确认发货', time: '今天 08:40', unread: false },
]

/* ---------------- 采购与入库 ---------------- */

export type PurchaseStatus = '草稿' | '待确认' | '已下单' | '部分入库' | '已入库' | '已取消'

export type PurchaseItem = {
  productId: string
  name: string
  spec: string | null
  unit: string
  quantity: number
  received: number
  price: number
}

export type PurchaseOrder = {
  id: string
  supplier: string
  status: PurchaseStatus
  expectedAt: string
  createdAt: string
  operator: string
  items: PurchaseItem[]
}

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO20261020001',
    supplier: '佳旺日化供应链',
    status: '已下单',
    expectedAt: '2026-10-22',
    createdAt: '2026-10-20 09:20',
    operator: '王店长',
    items: [{ productId: 'P10006', name: '蓝月亮 深层洁净洗衣液', spec: '3kg/瓶', unit: '瓶', quantity: 24, received: 0, price: 32.5 }],
  },
  {
    id: 'PO20261019002',
    supplier: '康达饮料经销',
    status: '部分入库',
    expectedAt: '2026-10-20',
    createdAt: '2026-10-19 15:02',
    operator: '李晓',
    items: [
      { productId: 'P10002', name: '可口可乐 汽水 罐装', spec: '330ml/罐', unit: '罐', quantity: 78, received: 48, price: 1.85 },
      { productId: 'P10010', name: '元气森林 白桃味苏打气泡水', spec: '480ml/瓶', unit: '瓶', quantity: 48, received: 48, price: 3.2 },
    ],
  },
  {
    id: 'PO20261018001',
    supplier: '杭州华润食品批发',
    status: '已入库',
    expectedAt: '2026-10-18',
    createdAt: '2026-10-17 11:40',
    operator: '王店长',
    items: [
      { productId: 'P10003', name: '康师傅 红烧牛肉面', spec: '103g/袋', unit: '袋', quantity: 120, received: 120, price: 2.1 },
      { productId: 'P10011', name: '旺旺 雪饼', spec: '84g/袋', unit: '袋', quantity: 60, received: 60, price: 4.2 },
    ],
  },
  {
    id: 'PO20261017003',
    supplier: '鲜丰乳品供应',
    status: '已取消',
    expectedAt: '2026-10-19',
    createdAt: '2026-10-17 09:05',
    operator: '李晓',
    items: [{ productId: 'P10009', name: '蒙牛 纯牛奶 整箱', spec: '250ml × 12 盒', unit: '箱', quantity: 20, received: 0, price: 38.0 }],
  },
]

export type StockInStatus = '待收货' | '部分入库' | '已入库'

export type StockInRecord = {
  id: string
  orderId: string | null
  supplier: string
  status: StockInStatus
  arrivedAt: string
  operator: string
  items: PurchaseItem[]
}

export const initialStockInRecords: StockInRecord[] = [
  {
    id: 'SI20261020001',
    orderId: 'PO20261019002',
    supplier: '康达饮料经销',
    status: '部分入库',
    arrivedAt: '2026-10-20 08:35',
    operator: '李晓',
    items: [
      { productId: 'P10002', name: '可口可乐 汽水 罐装', spec: '330ml/罐', unit: '罐', quantity: 78, received: 48, price: 1.85 },
      { productId: 'P10010', name: '元气森林 白桃味苏打气泡水', spec: '480ml/瓶', unit: '瓶', quantity: 48, received: 48, price: 3.2 },
    ],
  },
  {
    id: 'SI20261018001',
    orderId: 'PO20261018001',
    supplier: '杭州华润食品批发',
    status: '已入库',
    arrivedAt: '2026-10-18 10:12',
    operator: '王店长',
    items: [
      { productId: 'P10003', name: '康师傅 红烧牛肉面', spec: '103g/袋', unit: '袋', quantity: 120, received: 120, price: 2.1 },
      { productId: 'P10011', name: '旺旺 雪饼', spec: '84g/袋', unit: '袋', quantity: 60, received: 60, price: 4.2 },
    ],
  },
]

/** 库存调整类型：入库补录 / 出库 / 报损 / 盘盈亏 */
export type StockAdjustType = '入库补录' | '出库' | '报损' | '盘盈亏'

export const purchaseStatusTone: Record<PurchaseStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'brand'> = {
  草稿: 'neutral',
  待确认: 'warning',
  已下单: 'info',
  部分入库: 'brand',
  已入库: 'success',
  已取消: 'danger',
}

export const stockInStatusTone: Record<StockInStatus, 'neutral' | 'info' | 'brand' | 'success'> = {
  待收货: 'neutral',
  部分入库: 'brand',
  已入库: 'success',
}

/** 某商品最近一次入库时间 */
export function lastInboundAt(records: StockInRecord[], productId: string) {
  let latest: string | null = null
  for (const r of records) {
    if (r.items.some((i) => i.productId === productId) && (!latest || r.arrivedAt > latest)) latest = r.arrivedAt
  }
  return latest
}

/* ---------------- AI 经营助手 ---------------- */

export type AssistantTable = {
  caption: string
  columns: string[]
  rows: (string | number)[][]
  /** 需要右对齐的列下标 */
  alignRight?: number[]
}

export type AssistantTopic = {
  id: string
  title: string
  hint: string
  question: string
  summary: string
  table: AssistantTable
  /** 数据来源与统计区间 */
  basis: string
  /** 计算口径 */
  note: string
  actions: { label: string; href?: string; toast?: string }[]
  insufficient?: boolean
}

export const assistantTopics: AssistantTopic[] = [
  {
    id: 'today',
    title: '今日经营情况',
    hint: '销售额、订单与毛利概览',
    question: '今天的经营情况怎么样？',
    summary: '今日销售额 ¥ 8,426.50，环比昨日同时段 +6.8%；毛利额 ¥ 2,068.30，毛利率 24.5%。成交 312 笔，客单价 ¥ 27.00。当前 5 个商品处于库存预警状态，其中 1 个已缺货。',
    table: {
      caption: '今日经营指标（截至 10:30）',
      columns: ['指标', '数值', '环比'],
      rows: [
        ['销售额', '¥ 8,426.50', '+6.8%'],
        ['订单数量', '312 笔', '+4.2%'],
        ['毛利额', '¥ 2,068.30', '+8.1%'],
        ['客单价', '¥ 27.00', '持平'],
        ['库存预警', '5 个商品', '较昨日 +1'],
      ],
      alignRight: [1, 2],
    },
    basis: '数据来源：门店 POS 销售流水（演示数据）· 统计区间：2026-10-20 00:00–10:30 · 对比区间：2026-10-19 同时段',
    note: '销售口径含折扣后实收金额，不含退款；毛利额＝销售额－商品进货成本。',
    actions: [{ label: '查看经营报表', href: '/reports' }],
  },
  {
    id: 'sales',
    title: '商品销售分析',
    hint: '按分类与单品看销售结构',
    question: '最近哪些饮料卖得比较快？',
    summary: '饮料冲调类今日销售 ¥ 2,864，占门店销售额 34.0%，为第一大品类；其中元气森林白桃味苏打气泡水、农夫山泉饮用天然水位列单品销量前二。',
    table: {
      caption: '今日分类销售额与占比',
      columns: ['商品分类', '销售额', '占比'],
      rows: [
        ['饮料冲调', '¥ 2,864.00', '34.0%'],
        ['休闲零食', '¥ 1,852.00', '22.0%'],
        ['方便速食', '¥ 1,236.00', '14.7%'],
        ['乳品', '¥ 984.00', '11.7%'],
        ['日用百货', '¥ 726.00', '8.6%'],
        ['家庭清洁', '¥ 512.00', '6.1%'],
        ['粮油调味', '¥ 252.00', '3.0%'],
      ],
      alignRight: [1, 2],
    },
    basis: '数据来源：门店 POS 销售流水（演示数据）· 统计区间：2026-10-20 00:00–10:30',
    note: '占比＝分类销售额 ÷ 当日总销售额；演示数据仅覆盖当日流水，不含跨期对比。',
    actions: [{ label: '查看经营报表', href: '/reports' }],
  },
  {
    id: 'restock',
    title: '库存补货建议',
    hint: '低于安全库存的补货清单',
    question: '哪些商品应该补货？',
    summary: '5 个商品低于安全库存，建议按「补至 2 倍安全库存」生成采购单，预估采购金额 ¥ 1,508.30，其中蓝月亮洗衣液已缺货需优先处理。',
    table: {
      caption: '建议补货商品（按紧急度排序）',
      columns: ['商品', '当前库存', '安全库存', '建议补货', '预估金额'],
      rows: [
        ['蓝月亮 深层洁净洗衣液 3kg/瓶', '0 瓶', '10 瓶', '24 瓶', '¥ 780.00'],
        ['统一 老坛酸菜牛肉面 121g/桶', '18 桶', '40 桶', '62 桶', '¥ 204.60'],
        ['旺旺 雪饼 84g/袋', '7 袋', '24 袋', '41 袋', '¥ 172.20'],
        ['可口可乐 汽水 330ml/罐', '42 罐', '60 罐', '78 罐', '¥ 144.30'],
        ['奥利奥 原味夹心饼干 116g/盒', '23 盒', '30 盒', '37 盒', '¥ 207.20'],
      ],
      alignRight: [1, 2, 3, 4],
    },
    basis: '数据来源：门店库存台账（演示数据）· 统计区间：库存快照 2026-10-20 10:30 · 补货公式参考近 7 日日均销量',
    note: '建议补货量＝2 × 安全库存 － 当前库存（不足 1 件按 1 件计）；预估金额＝建议补货量 × 最近进货价。',
    actions: [{ label: '前往采购管理', href: '/purchase' }, { label: '查看库存管理', href: '/inventory' }],
  },
  {
    id: 'slow',
    title: '滞销商品分析',
    hint: '库存高但销售慢的商品',
    question: '哪些商品库存高但销售慢？',
    summary: '2 款日化商品近 30 天无动销记录，合计占用库存金额 ¥ 977.00，占总库存金额 6.4%，建议调整陈列或设置限时促销。',
    table: {
      caption: '滞销商品（近 30 天无动销）',
      columns: ['商品', '当前库存', '库存金额', '最近动销', '建议'],
      rows: [
        ['维达 超韧抽纸 3 层 100 抽 × 3 包', '64 提', '¥ 550.40', '30 天前', '调整至主通道端架'],
        ['立白 柠檬清新洗洁精 1kg/瓶', '54 瓶', '¥ 426.60', '25 天前', '限时 9 折或组合销售'],
      ],
      alignRight: [1, 2, 3],
    },
    basis: '数据来源：门店 POS 销售流水 + 库存台账（演示数据）· 统计区间：2026-09-20–2026-10-20',
    note: '滞销口径＝近 30 天销量为 0 且库存金额 ≥ ¥ 200；库存金额＝当前库存 × 最近进货价。',
    actions: [{ label: '查看相关商品', href: '/products?category=家庭清洁' }],
  },
  {
    id: 'pricing',
    title: '商品定价建议',
    hint: '毛利率偏低或偏高的商品',
    question: '哪些商品的定价需要调整？',
    summary: '3 款商品毛利率偏离品类常见区间（30%–35%），建议先复核进货价与竞品售价，确认后再调整零售价。调整需在价格管理中人工确认后生效。',
    table: {
      caption: '定价建议（按毛利率偏离度排序）',
      columns: ['商品', '现零售价', '当前毛利率', '建议零售价', '依据'],
      rows: [
        ['蒙牛 纯牛奶 整箱', '¥ 52.00', '26.9%', '¥ 54.00', '低于乳品类均值 32%'],
        ['统一 老坛酸菜牛肉面 桶装', '¥ 5.00', '34.0%', '¥ 5.50', '缺货且动销良好，有上调空间'],
        ['维达 超韧抽纸 3 层', '¥ 12.90', '33.3%', '¥ 12.90', '与同类持平，建议维持'],
      ],
      alignRight: [1, 2, 3],
    },
    basis: '数据来源：门店价格台账与销售流水（演示数据）· 统计区间：2026-10-01–2026-10-20',
    note: '毛利率＝(零售价－进货价) ÷ 零售价；建议价参考同品类毛利率区间，仅作参考，系统不会自动改价。',
    actions: [{ label: '前往价格管理', href: '/pricing' }],
  },
  {
    id: 'purchase',
    title: '采购建议',
    hint: '按供应商汇总的建议采购',
    question: '这次应该找哪些供应商进货？',
    summary: '建议本次向 3 家供应商下单，共 5 个 SKU，预估采购金额 ¥ 1,508.30。其中佳旺日化供应链的蓝月亮洗衣液为缺货商品，建议优先下单。',
    table: {
      caption: '按供应商汇总的建议采购',
      columns: ['供应商', '建议 SKU 数', '预估金额', '优先级'],
      rows: [
        ['佳旺日化供应链', '1', '¥ 780.00', '高（含缺货商品）'],
        ['杭州华润食品批发', '3', '¥ 584.00', '中'],
        ['康达饮料经销', '1', '¥ 144.30', '中'],
      ],
      alignRight: [1, 2],
    },
    basis: '数据来源：商品主档中的默认供应商 + 库存台账（演示数据）· 统计区间：库存快照 2026-10-20 10:30',
    note: '按商品的默认供应商归集建议补货量；采购单价取最近进货价，实际价格以供应商报价为准。创建采购单需人工确认。',
    actions: [{ label: '前往采购管理', href: '/purchase' }, { label: '查看供应商', href: '/suppliers' }],
  },
]

/** 数据不足时的回答示例（不做经营结论） */
export const assistantInsufficient: AssistantTopic = {
  id: 'insufficient',
  title: '数据不足示例',
  hint: '门店数据不足时的提示',
  question: '上个季度的利润趋势如何？',
  summary: '当前门店在系统中仅有 2026-10-07 起的销售流水，缺少 2026 年 7–9 月的完整数据，无法给出上个季度的利润趋势分析。建议先完成历史数据导入，再进行分析。',
  table: {
    caption: '数据覆盖情况',
    columns: ['数据项', '可用区间', '状态'],
    rows: [
      ['销售流水', '2026-10-07 起', '部分可用'],
      ['进货成本', '2026-10-18 起', '不足'],
      ['库存快照', '2026-10-20 单日', '不足'],
    ],
  },
  basis: '数据来源：系统数据完整性检查（演示数据）',
  note: '数据覆盖不足时不做推断，不虚构经营结论；可通过「数据导入导出」补充历史数据。',
  actions: [{ label: '前往数据导入导出', href: '/settings' }],
  insufficient: true,
}

/* ---------------- 会员与销售订单 ---------------- */

export type MemberLevel = '普通会员' | '银卡会员' | '金卡会员'

export type Member = {
  id: string
  name: string
  phone: string
  level: MemberLevel
  points: number
  joinedAt: string
  lastVisitAt: string
}

export const members: Member[] = [
  { id: 'M0001', name: '张敏', phone: '138****6621', level: '金卡会员', points: 1860, joinedAt: '2024-03-12', lastVisitAt: '2026-10-20 09:40' },
  { id: 'M0002', name: '李晓', phone: '139****3208', level: '银卡会员', points: 920, joinedAt: '2025-01-08', lastVisitAt: '2026-10-19 20:12' },
  { id: 'M0003', name: '陈立', phone: '137****4477', level: '普通会员', points: 210, joinedAt: '2026-05-20', lastVisitAt: '2026-10-18 18:36' },
  { id: 'M0004', name: '刘芳', phone: '135****9911', level: '银卡会员', points: 640, joinedAt: '2025-09-02', lastVisitAt: '2026-10-17 12:05' },
  { id: 'M0005', name: '赵强', phone: '186****2033', level: '普通会员', points: 95, joinedAt: '2026-08-14', lastVisitAt: '2026-10-15 19:22' },
]

export type PayMethod = '微信支付' | '支付宝' | '现金' | '会员卡'

export const payMethods: PayMethod[] = ['微信支付', '支付宝', '现金', '会员卡']

export type SaleOrderStatus = '已完成' | '部分退款' | '已退款'

export type SaleOrderItem = { productId: string; name: string; unit: string; price: number; quantity: number }

export type SaleOrder = {
  id: string
  createdAt: string
  items: SaleOrderItem[]
  /** 应收金额（折扣前） */
  amount: number
  /** 优惠金额（会员折扣 + 抹零） */
  discount: number
  /** 实收金额 */
  paid: number
  payMethod: PayMethod
  cashier: string
  memberName: string | null
  memberPhone: string | null
  status: SaleOrderStatus
  /** 累计退款金额 */
  refunded: number
}

export const saleOrderStatusTone: Record<SaleOrderStatus, 'success' | 'warning' | 'danger'> = {
  已完成: 'success',
  部分退款: 'warning',
  已退款: 'danger',
}

const round2 = (n: number) => Math.round(n * 100) / 100

function makeOrder(
  id: string,
  createdAt: string,
  payMethod: PayMethod,
  cashier: string,
  memberName: string | null,
  memberPhone: string | null,
  cart: [string, number][],
  discount = 0,
  status: SaleOrderStatus = '已完成',
  refunded = 0,
): SaleOrder {
  const items: SaleOrderItem[] = cart.map(([productId, quantity]) => {
    const p = initialProducts.find((x) => x.id === productId)
    return { productId, name: p?.name ?? productId, unit: p?.unit ?? '件', price: p?.retailPrice ?? 0, quantity }
  })
  const amount = round2(items.reduce((s, i) => s + i.price * i.quantity, 0))
  return {
    id,
    createdAt,
    items,
    amount,
    discount,
    paid: round2(amount - discount),
    payMethod,
    cashier,
    memberName,
    memberPhone,
    status,
    refunded,
  }
}

export const initialSaleOrders: SaleOrder[] = [
  makeOrder('SO20261020012', '2026-10-20 10:18', '微信支付', '王店长', '张敏', '138****6621', [['P10001', 2], ['P10007', 1]], 0.5),
  makeOrder('SO20261020011', '2026-10-20 09:52', '支付宝', '王店长', null, null, [['P10003', 2], ['P10002', 2]]),
  makeOrder('SO20261020010', '2026-10-20 09:30', '现金', '李晓', null, null, [['P10011', 1], ['P10010', 1]], 0.3),
  makeOrder('SO20261020009', '2026-10-20 09:05', '微信支付', '李晓', '陈立', '137****4477', [['P10004', 1], ['P10008', 1]]),
  makeOrder('SO20261020008', '2026-10-20 08:48', '会员卡', '王店长', '刘芳', '135****9911', [['P10009', 1]], 2.0),
  makeOrder('SO20261020007', '2026-10-20 08:26', '微信支付', '王店长', null, null, [['P10001', 3], ['P10005', 1]]),
  makeOrder('SO20261020006', '2026-10-20 08:12', '现金', '张敏', null, null, [['P10007', 2], ['P10002', 1]], 0.2),
  makeOrder('SO20261020005', '2026-10-20 08:02', '微信支付', '张敏', null, null, [['P10006', 1]], 0, '已退款', 49.9),
  makeOrder('SO20261019008', '2026-10-19 20:41', '支付宝', '李晓', '李晓', '139****3208', [['P10012', 1], ['P10005', 1]], 0, '部分退款', 11.9),
  makeOrder('SO20261019007', '2026-10-19 20:05', '微信支付', '王店长', null, null, [['P10003', 3], ['P10010', 2]]),
  makeOrder('SO20261019006', '2026-10-19 19:38', '现金', '李晓', null, null, [['P10008', 2], ['P10007', 1]]),
  makeOrder('SO20261019005', '2026-10-19 18:52', '微信支付', '王店长', '赵强', '186****2033', [['P10001', 4], ['P10011', 2]], 1.0),
]

/* ---------------- 退货退款 ---------------- */

export type RefundStatus = '待处理' | '已退款' | '已拒绝'

export const refundStatusTone: Record<RefundStatus, 'warning' | 'success' | 'neutral'> = {
  待处理: 'warning',
  已退款: 'success',
  已拒绝: 'neutral',
}

export type RefundItem = { productId: string; name: string; unit: string; price: number; quantity: number }

export type RefundRecord = {
  id: string
  orderId: string
  createdAt: string
  items: RefundItem[]
  amount: number
  reason: string
  status: RefundStatus
  operator: string
  handledAt: string | null
  /** 是否已回滚库存 */
  stockRolledBack: boolean
}

export const refundReasons = ['商品破损', '临期或过期', '顾客不想要', '价格标示错误', '收银错误']

function makeRefund(
  id: string,
  orderId: string,
  createdAt: string,
  cart: [string, number][],
  reason: string,
  status: RefundStatus,
  operator: string,
  handledAt: string | null,
  stockRolledBack: boolean,
): RefundRecord {
  const items: RefundItem[] = cart.map(([productId, quantity]) => {
    const order = initialSaleOrders.find((o) => o.id === orderId)
    const line = order?.items.find((i) => i.productId === productId)
    const p = initialProducts.find((x) => x.id === productId)
    return {
      productId,
      name: line?.name ?? p?.name ?? productId,
      unit: line?.unit ?? p?.unit ?? '件',
      price: line?.price ?? p?.retailPrice ?? 0,
      quantity,
    }
  })
  return {
    id,
    orderId,
    createdAt,
    items,
    amount: round2(items.reduce((s, i) => s + i.price * i.quantity, 0)),
    reason,
    status,
    operator,
    handledAt,
    stockRolledBack,
  }
}

export const initialRefunds: RefundRecord[] = [
  makeRefund('RF20261020003', 'SO20261020011', '2026-10-20 10:26', [['P10003', 1]], '商品破损', '待处理', '王店长', null, false),
  makeRefund('RF20261020002', 'SO20261020005', '2026-10-20 08:30', [['P10006', 1]], '临期或过期', '已退款', '王店长', '2026-10-20 08:44', true),
  makeRefund('RF20261020001', 'SO20261019008', '2026-10-19 21:02', [['P10012', 1]], '顾客不想要', '已退款', '李晓', '2026-10-19 21:15', true),
  makeRefund('RF20261019004', 'SO20261019006', '2026-10-19 20:10', [['P10008', 1]], '价格标示错误', '已拒绝', '王店长', '2026-10-19 20:25', false),
]

/* ---------------- 供应商 ---------------- */

export type SupplierStatus = '合作中' | '暂停合作'

export type SupplierDetail = {
  id: string
  /** 与商品档案、采购单中的供应商名称一致 */
  name: string
  contact: string
  /** 演示环境仅保留前三后四 */
  phone: string
  categories: string[]
  status: SupplierStatus
  /** 近 90 天到货准时率（%） */
  onTimeRate: number
  since: string
  address: string
}

export const supplierStatusTone: Record<SupplierStatus, 'success' | 'neutral'> = {
  合作中: 'success',
  暂停合作: 'neutral',
}

export const initialSupplierDetails: SupplierDetail[] = [
  { id: 'SUP01', name: '杭州华润食品批发', contact: '陈经理', phone: '138****2266', categories: ['方便速食', '休闲零食', '粮油调味'], status: '合作中', onTimeRate: 96, since: '2023-06-20', address: '杭州市余杭区勾庄农产品物流中心 B12' },
  { id: 'SUP02', name: '康达饮料经销', contact: '刘经理', phone: '139****7741', categories: ['饮料冲调'], status: '合作中', onTimeRate: 98, since: '2023-06-20', address: '杭州市萧山区红垦农场物流园 3 号库' },
  { id: 'SUP03', name: '佳旺日化供应链', contact: '孙经理', phone: '137****5509', categories: ['家庭清洁', '日用百货', '个人护理'], status: '合作中', onTimeRate: 91, since: '2023-08-14', address: '杭州市临平区南苑街道联胜路 88 号' },
  { id: 'SUP04', name: '万家粮油商贸', contact: '吴经理', phone: '135****0182', categories: ['粮油调味'], status: '暂停合作', onTimeRate: 84, since: '2024-01-09', address: '杭州市江干区九堡家苑三区 21 幢' },
  { id: 'SUP05', name: '鲜丰乳品供应', contact: '许经理', phone: '186****3347', categories: ['乳品'], status: '合作中', onTimeRate: 99, since: '2023-07-01', address: '杭州市西湖区三墩镇西园八路 6 号' },
]

/* ---------------- 员工与权限 ---------------- */

export type StaffRole = '店长' | '收银员' | '理货员'
export type StaffStatus = '在职' | '已停用'

export type StaffMember = {
  id: string
  name: string
  account: string
  role: StaffRole
  storeId: string
  /** 演示环境仅保留前三后四 */
  phone: string
  status: StaffStatus
  lastLoginAt: string | null
}

export const staffStatusTone: Record<StaffStatus, 'success' | 'neutral'> = {
  在职: 'success',
  已停用: 'neutral',
}

export const roleTone: Record<StaffRole, 'brand' | 'info' | 'neutral'> = {
  店长: 'brand',
  收银员: 'info',
  理货员: 'neutral',
}

export const initialStaff: StaffMember[] = [
  { id: 'E001', name: '王建国', account: 'wangjianguo', role: '店长', storeId: 's1', phone: '138****5501', status: '在职', lastLoginAt: '2026-10-20 10:30' },
  { id: 'E002', name: '李晓', account: 'lixiao', role: '收银员', storeId: 's1', phone: '139****3208', status: '在职', lastLoginAt: '2026-10-20 09:58' },
  { id: 'E003', name: '张敏', account: 'zhangmin', role: '收银员', storeId: 's1', phone: '137****6621', status: '在职', lastLoginAt: '2026-10-20 08:12' },
  { id: 'E004', name: '周婷', account: 'zhouting', role: '店长', storeId: 's2', phone: '135****8843', status: '在职', lastLoginAt: '2026-10-19 21:40' },
  { id: 'E005', name: '郑凯', account: 'zhengkai', role: '理货员', storeId: 's3', phone: '186****2093', status: '在职', lastLoginAt: null },
  { id: 'E006', name: '钱丽', account: 'qianli', role: '收银员', storeId: 's2', phone: '150****7716', status: '已停用', lastLoginAt: '2026-09-28 17:22' },
]

/** 角色权限矩阵：模块 × 角色 */
export const permissionModules = ['经营报表', '商品管理', '库存管理', '采购入库', '销售收银', '退货退款', '系统设置'] as const

export const rolePermissions: Record<StaffRole, (typeof permissionModules)[number][]> = {
  店长: ['经营报表', '商品管理', '库存管理', '采购入库', '销售收银', '退货退款', '系统设置'],
  收银员: ['销售收银', '退货退款'],
  理货员: ['商品管理', '库存管理', '采购入库'],
}

/* ---------------- 调价记录 ---------------- */

export type PriceField = '零售价' | '会员价' | '最低售价'

export type PriceLog = {
  id: string
  createdAt: string
  field: PriceField
  /** 调价方式描述，如「按比例 +5%」 */
  mode: string
  scope: string
  affected: number
  operator: string
}

export const initialPriceLogs: PriceLog[] = [
  { id: 'PL20261015001', createdAt: '2026-10-15 14:20', field: '零售价', mode: '按比例 +3%', scope: '分类：饮料冲调', affected: 3, operator: '王建国' },
  { id: 'PL20260928002', createdAt: '2026-09-28 10:05', field: '会员价', mode: '固定金额 -0.20 元', scope: '供应商：康达饮料经销', affected: 3, operator: '王建国' },
]

/* ---------------- AI 经营分析记录 ---------------- */

export type AiAnalysisLog = {
  id: string
  question: string
  conclusion: string
  basis: string
  createdAt: string
  operator: string
}

export const aiAnalysisLogs: AiAnalysisLog[] = [
  { id: 'AN20261020002', question: '哪些商品应该补货？', conclusion: '5 个商品低于安全库存，建议采购金额 ¥ 1,508.30', basis: '库存台账快照 · 2026-10-20 10:30', createdAt: '2026-10-20 10:31', operator: '王建国' },
  { id: 'AN20261020001', question: '今天的经营情况怎么样？', conclusion: '销售额 ¥ 8,426.50，环比 +6.8%，毛利率 24.5%', basis: 'POS 销售流水 · 2026-10-20 00:00–10:30', createdAt: '2026-10-20 10:30', operator: '王建国' },
  { id: 'AN20261019003', question: '哪些商品库存高但销售慢？', conclusion: '2 款日化商品 30 天未动销，占用 ¥ 977.00', basis: '销售流水 + 库存台账 · 2026-09-20–2026-10-19', createdAt: '2026-10-19 16:40', operator: '李晓' },
  { id: 'AN20261019002', question: '哪些商品的定价需要调整？', conclusion: '3 款商品毛利率偏离品类区间，已给出建议价', basis: '价格台账 + 销售流水 · 2026-10-01–2026-10-19', createdAt: '2026-10-19 15:12', operator: '王建国' },
  { id: 'AN20261018001', question: '这次应该找哪些供应商进货？', conclusion: '建议向 3 家供应商下单，共 5 个 SKU', basis: '商品主档 + 库存台账 · 2026-10-18 09:00', createdAt: '2026-10-18 09:05', operator: '李晓' },
]

/* ---------------- 账号与订阅 ---------------- */

export type Plan = {
  id: string
  name: string
  price: number
  priceUnit: string
  storeQuota: number
  staffQuota: number
  aiQuota: number
  features: string[]
}

export const plans: Plan[] = [
  { id: 'basic', name: '基础版', price: 99, priceUnit: '元/月', storeQuota: 1, staffQuota: 5, aiQuota: 200, features: ['单门店管理', '收银与订单', '基础库存管理', 'AI 识别 200 张/月'] },
  { id: 'pro', name: '专业版', price: 299, priceUnit: '元/月', storeQuota: 5, staffQuota: 20, aiQuota: 1000, features: ['5 门店 / 20 员工', '采购与库存预警', '经营报表与 AI 助手', 'AI 识别 1,000 张/月'] },
  { id: 'flagship', name: '旗舰版', price: 599, priceUnit: '元/月', storeQuota: 20, staffQuota: 100, aiQuota: 5000, features: ['20 门店 / 100 员工', '多门店经营对比', '专属客服与数据迁移', 'AI 识别 5,000 张/月'] },
]

export const subscriptionInfo = {
  planId: 'pro',
  planName: '专业版',
  startedAt: '2026-04-01',
  expiresAt: '2027-03-31',
  autoRenew: true,
  aiUsed: 640,
  aiQuota: 1000,
  invoiceTitle: '杭州邻礼便利连锁有限公司',
}

export const billingRecords = [
  { id: 'INV20260401001', createdAt: '2026-04-01', item: '专业版订阅（2026-04 至 2027-03）', amount: 3588, status: '已支付' },
  { id: 'INV20251012003', createdAt: '2025-10-12', item: 'AI 识别加量包 500 张', amount: 99, status: '已支付' },
  { id: 'INV20250401001', createdAt: '2025-04-01', item: '基础版订阅（2025-04 至 2026-03）', amount: 1188, status: '已支付' },
]

