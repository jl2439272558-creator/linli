import { PageHeader } from '@/components/common/page-header'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart'
import { CategoryChart } from '@/components/dashboard/category-chart'
import { StockAlertList } from '@/components/dashboard/stock-alert-list'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { AiInsights } from '@/components/dashboard/ai-insights'

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="经营工作台" description="2026 年 10 月 20 日 星期二 · 数据截至 10:30" actions={<DashboardActions />} />
      <div className="flex flex-col gap-4">
        <KpiCards />
        <div className="grid grid-cols-3 gap-4">
          <SalesTrendChart />
          <CategoryChart />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StockAlertList />
          <QuickActions />
          <AiInsights />
        </div>
      </div>
    </>
  )
}
