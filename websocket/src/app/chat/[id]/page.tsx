import { notFound } from 'next/navigation'
import { getConversationById } from '@/lib/mock-data'
import ChatView from '@/components/chat/ChatView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params
  const conversation = getConversationById(id)

  if (!conversation) notFound()

  return <ChatView conversationId={id} />
}

export function generateStaticParams() {
  return [
    { id: 'conv-1' },
    { id: 'conv-2' },
    { id: 'conv-3' },
    { id: 'conv-4' },
  ]
}
