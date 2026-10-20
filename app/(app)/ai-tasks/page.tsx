import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: 'AI 任务记录' }

export default function AiTasksPage() {
  return (
    <PlaceholderView
      title="AI 任务记录"
      group="AI 助手"
      description="AI 识别与经营分析任务的执行记录"
      features={[
        '汇总 AI 商品采集任务、识别成功率与失败原因',
        '记录 AI 经营分析的问题、结论与数据口径，便于追溯',
        '支持按时间、来源与状态筛选，并可导出任务记录',
      ]}
      links={[
        { label: 'AI 商品采集', href: '/ai-collect' },
        { label: 'AI 识别结果审核', href: '/ai-review' },
        { label: 'AI 经营助手', href: '/ai-assistant' },
      ]}
    />
  )
}
