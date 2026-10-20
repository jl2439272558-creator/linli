'use client'

import { useState } from 'react'
import { CalendarDays, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useDemoStore } from '@/components/providers/demo-store'

export function DashboardActions() {
  const { currentStore } = useDemoStore()
  const [loading, setLoading] = useState(false)

  return (
    <>
      <Button variant="outline" className="h-9" onClick={() => toast.info('日期筛选', { description: '演示版本固定展示今日数据' })}>
        <CalendarDays data-icon="inline-start" />
        今日
      </Button>
      <Button
        variant="outline"
        className="h-9"
        disabled={loading}
        onClick={() => {
          setLoading(true)
          setTimeout(() => {
            setLoading(false)
            toast.success('数据已刷新', { description: `${currentStore.name} · 演示数据` })
          }, 900)
        }}
      >
        <RefreshCw data-icon="inline-start" className={loading ? 'animate-spin' : undefined} />
        刷新
      </Button>
      <Button className="h-9" onClick={() => toast.success('日报已生成', { description: '经营日报_20261020.xlsx（演示文件，未实际下载）' })}>
        <Download data-icon="inline-start" />
        导出日报
      </Button>
    </>
  )
}
