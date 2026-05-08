import { cn } from '@/lib/utils'

interface BadgeProps {
  count: number
  className?: string
}

export default function Badge({ count, className }: BadgeProps) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
        'rounded-full bg-[#EF4444] text-white text-[10px] font-bold leading-none',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
