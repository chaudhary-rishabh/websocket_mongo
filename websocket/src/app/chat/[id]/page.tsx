import ChatView from '@/components/chat/ChatView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params
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
