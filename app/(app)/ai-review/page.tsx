import { ReviewView } from '@/components/ai-collect/review-view'

export const metadata = { title: 'AI 识别结果审核' }

export default async function AiReviewPage({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
  const { task } = await searchParams
  return <ReviewView taskId={task} />
}
