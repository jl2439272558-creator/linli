'use client'

import { BadgeCheck, Check, Crown, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/common/page-header'
import { SectionCard } from '@/components/common/section-card'
import { StatusBadge } from '@/components/common/status-badge'
import { useDemoStore } from '@/components/providers/demo-store'
import { billingRecords, plans, subscriptionInfo } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SubscriptionView() {
  const { storeList, staffList } = useDemoStore()
  const currentPlan = plans.find((p) => p.id === subscriptionInfo.planId) ?? plans[0]

  const quotas = [
    { label: '门店额度', used: storeList.length, total: currentPlan.storeQuota, unit: '家' },
    { label: '员工额度', used: staffList.length, total: currentPlan.staffQuota, unit: '人' },
    { label: 'AI 识别额度（本月）', used: subscriptionInfo.aiUsed, total: subscriptionInfo.aiQuota, unit: '张' },
  ]

  return (
    <>
      <PageHeader
        title="账号与订阅"
        breadcrumbs={[{ label: '系统设置' }, { label: '账号与订阅' }]}
        description={`当前订阅：${subscriptionInfo.planName} · ${subscriptionInfo.startedAt} 至 ${subscriptionInfo.expiresAt}`}
        actions={
          <Button variant="outline" className="h-9" onClick={() => toast.success('发票申请已提交', { description: `抬头：${subscriptionInfo.invoiceTitle}（演示）` })}>
            <FileText data-icon="inline-start" />
            开发票
          </Button>
        }
      />

      <SectionCard
        title="当前套餐"
        description={`${subscriptionInfo.startedAt} 生效 · ${subscriptionInfo.expiresAt} 到期 · ${subscriptionInfo.autoRenew ? '已开启自动续费' : '未开启自动续费'}`}
        className="mb-4"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-primary">
            <Crown className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
        }
        actions={
          <StatusBadge tone="brand" dot={false}>
            {subscriptionInfo.planName}
          </StatusBadge>
        }
      >
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {quotas.map((q) => {
            const pct = Math.min(100, Math.round((q.used / q.total) * 100))
            return (
              <div key={q.label}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="text-muted-foreground">{q.label}</span>
                  <span className="font-medium tabular-nums">
                    {q.used}
                    <span className="text-muted-foreground"> / {q.total} {q.unit}</span>
                  </span>
                </div>
                <Progress value={pct} className={cn('mt-2 h-1.5', pct >= 90 && '[&_[data-slot=progress-indicator]]:bg-warning')} aria-label={`${q.label} ${pct}%`} />
                <p className="mt-1 text-xs text-muted-foreground">已使用 {pct}%</p>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === subscriptionInfo.planId
          return (
            <div key={plan.id} className={cn('flex flex-col rounded-xl border bg-card p-5', isCurrent ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border')}>
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-foreground">{plan.name}</h2>
                {isCurrent && (
                  <StatusBadge tone="brand" dot={false}>
                    当前套餐
                  </StatusBadge>
                )}
              </div>
              <p className="mt-2">
                <span className="text-2xl font-semibold tabular-nums">{formatMoney(plan.price, 0)}</span>
                <span className="ml-1 text-xs text-muted-foreground">{plan.priceUnit}</span>
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Check className="size-3.5 shrink-0 text-success" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? 'outline' : 'default'}
                className="mt-5 h-9"
                disabled={isCurrent}
                onClick={() =>
                  toast.info(`升级至「${plan.name}」`, { description: '演示环境暂不支持在线支付，请联系客服开通' })
                }
              >
                {!isCurrent && <BadgeCheck data-icon="inline-start" />}
                {isCurrent ? '当前套餐' : `升级至${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      <SectionCard title="账单记录" description={`发票抬头：${subscriptionInfo.invoiceTitle}`} className="mt-4" bodyClassName="p-0">
        <div className="overflow-x-auto"><Table className="min-w-[820px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">账单号</TableHead>
              <TableHead>日期</TableHead>
              <TableHead className="min-w-64">项目</TableHead>
              <TableHead className="text-right">金额</TableHead>
              <TableHead className="pr-5">状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingRecords.map((b) => (
              <TableRow key={b.id} className="[&_td]:py-2.5">
                <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{b.id}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{b.createdAt}</TableCell>
                <TableCell className="text-foreground">{b.item}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(b.amount, 0)}</TableCell>
                <TableCell className="pr-5">
                  <StatusBadge tone="success">{b.status}</StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </SectionCard>
    </>
  )
}
