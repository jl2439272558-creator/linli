export type StockStatus = '正常' | '库存偏低' | '缺货'

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
  stock: number
  safetyStock: number
  unit: string
  source: '手动录入' | 'AI 采集' | '批量导入'
  updatedAt: string
}

export const categories = ['饮料冲调', '方便速食', '休闲零食', '乳品', '日用百货', '家庭清洁', '粮油调味', '个人护理']
export const brands = ['农夫山泉', '可口可乐', '康师傅', '统一', '维达', '蓝月亮', '乐事', '奥利奥', '蒙牛', '元气森林', '旺旺', '立白', '怡宝', '卫龙', '金龙鱼', '舒肤佳']
export const stores = [
  { id: 's1', name: '幸福里社区店', address: '杭州市西湖区文三路 218 号' },
  { id: 's2', name: '阳光花园店', address: '杭州市拱墅区湖墅南路 66 号' },
  { id: 's3', name: '东湖便利店', address: '杭州市余杭区东湖北路 9 号' },
]

export function getStockStatus(p: Pick<Product, 'stock' | 'safetyStock'>): StockStatus {
  if (p.stock <= 0) return '缺货'
  if (p.stock < p.safetyStock) return '库存偏低'
  return '正常'
}

export const initialProducts: Product[] = [
  { id: 'P10001', name: '农夫山泉 饮用天然水', image: '/products/water.png', barcode: '6921168509256', category: '饮料冲调', brand: '农夫山泉', spec: '550ml/瓶', purchasePrice: 1.15, retailPrice: 2.0, stock: 386, safetyStock: 120, unit: '瓶', source: '手动录入', updatedAt: '2026-10-20 09:12' },
  { id: 'P10002', name: '可口可乐 汽水 罐装', image: '/products/cola.png', barcode: '6954767410388', category: '饮料冲调', brand: '可口可乐', spec: '330ml/罐', purchasePrice: 1.85, retailPrice: 3.0, stock: 42, safetyStock: 60, unit: '罐', source: '批量导入', updatedAt: '2026-10-19 18:40' },
  { id: 'P10003', name: '康师傅 红烧牛肉面', image: '/products/noodle-bag.png', barcode: '6900873000258', category: '方便速食', brand: '康师傅', spec: '103g/袋', purchasePrice: 2.1, retailPrice: 3.5, stock: 215, safetyStock: 80, unit: '袋', source: '手动录入', updatedAt: '2026-10-19 16:05' },
  { id: 'P10004', name: '统一 老坛酸菜牛肉面 桶装', image: '/products/noodle-cup.png', barcode: '6925303721367', category: '方便速食', brand: '统一', spec: '121g/桶', purchasePrice: 3.3, retailPrice: 5.0, stock: 18, safetyStock: 40, unit: '桶', source: 'AI 采集', updatedAt: '2026-10-19 11:22' },
  { id: 'P10005', name: '维达 超韧抽纸 3 层', image: '/products/tissue.png', barcode: '6901236341285', category: '日用百货', brand: '维达', spec: '100 抽 × 3 包', purchasePrice: 8.6, retailPrice: 12.9, stock: 64, safetyStock: 30, unit: '提', source: '手动录入', updatedAt: '2026-10-18 20:10' },
  { id: 'P10006', name: '蓝月亮 深层洁净洗衣液', image: '/products/detergent.png', barcode: '6902022135314', category: '家庭清洁', brand: '蓝月亮', spec: '3kg/瓶', purchasePrice: 32.5, retailPrice: 49.9, stock: 0, safetyStock: 10, unit: '瓶', source: 'AI 采集', updatedAt: '2026-10-18 15:36' },
  { id: 'P10007', name: '乐事 原味薯片', image: '/products/chips.png', barcode: '6924743915756', category: '休闲零食', brand: '乐事', spec: '70g/袋', purchasePrice: 4.8, retailPrice: 7.5, stock: 96, safetyStock: 40, unit: '袋', source: '批量导入', updatedAt: '2026-10-18 10:02' },
  { id: 'P10008', name: '奥利奥 原味夹心饼干', image: '/products/cookies.png', barcode: '6901668053893', category: '休闲零食', brand: '奥利奥', spec: '116g/盒', purchasePrice: 5.6, retailPrice: 8.9, stock: 23, safetyStock: 30, unit: '盒', source: '手动录入', updatedAt: '2026-10-17 19:48' },
  { id: 'P10009', name: '蒙牛 纯牛奶 整箱', image: '/products/milk.png', barcode: '6923644266318', category: '乳品', brand: '蒙牛', spec: '250ml × 12 盒', purchasePrice: 38.0, retailPrice: 52.0, stock: 31, safetyStock: 15, unit: '箱', source: '手动录入', updatedAt: '2026-10-17 14:30' },
  { id: 'P10010', name: '元气森林 白桃味苏打气泡水', image: '/products/sparkling.png', barcode: '6970399920415', category: '饮料冲调', brand: '元气森林', spec: '480ml/瓶', purchasePrice: 3.2, retailPrice: 5.5, stock: 128, safetyStock: 48, unit: '瓶', source: 'AI 采集', updatedAt: '2026-10-17 09:15' },
  { id: 'P10011', name: '旺旺 雪饼', image: '/products/rice-cracker.png', barcode: '6920658211152', category: '休闲零食', brand: '旺旺', spec: '84g/袋', purchasePrice: 4.2, retailPrice: 6.8, stock: 7, safetyStock: 24, unit: '袋', source: '批量导入', updatedAt: '2026-10-16 17:44' },
  { id: 'P10012', name: '立白 柠檬清新洗洁精', image: '/products/dish-soap.png', barcode: '6920174736078', category: '家庭清洁', brand: '立白', spec: '1kg/瓶', purchasePrice: 7.9, retailPrice: 11.9, stock: 54, safetyStock: 20, unit: '瓶', source: '手动录入', updatedAt: '2026-10-16 08:58' },
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
  { id: 'i3', level: '滞销', title: '3 款日化商品 30 天未动销', detail: '占用库存金额约 ¥ 1,286，建议调整陈列位置或设置限时促销。', action: '查看商品' },
]

export const notifications = [
  { id: 'n1', title: 'AI 识别任务已完成', desc: '任务 AT20261020003 识别 10 件商品，待审核', time: '10 分钟前', unread: true },
  { id: 'n2', title: '库存预警', desc: '旺旺雪饼库存仅剩 7 袋，低于安全库存', time: '32 分钟前', unread: true },
  { id: 'n3', title: '采购单已签收', desc: '采购单 PO20261019 已由供应商确认发货', time: '今天 08:40', unread: false },
]
