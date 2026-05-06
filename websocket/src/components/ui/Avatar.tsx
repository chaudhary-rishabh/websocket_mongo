'use client'

import Image from 'next/image'
import { cn, getAvatarColor } from '@/lib/utils'

interface AvatarProps {
  src?: string
  initials?: string
  name?: string
  id?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isOnline?: boolean
  className?: string
}

const SIZE_CLASS: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-20 h-20',
}

const TEXT_CLASS: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'text-[9px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
}

const SIZE_PX: Record<NonNullable<AvatarProps['size']>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
}

export default function Avatar({
  src,
  initials,
  name,
  id,
  size = 'md',
  isOnline,
  className,
}: AvatarProps) {
  const colorClass = getAvatarColor(id ?? name ?? initials ?? 'x')
  const px = SIZE_PX[size]

  return (
    <div className={cn('relative flex-shrink-0 inline-flex', SIZE_CLASS[size], className)}>
      {/* Circle */}
      <div className={cn('rounded-full overflow-hidden w-full h-full', !src && colorClass)}>
        {src ? (
          <Image
            src={src}
            alt={name ?? initials ?? ''}
            width={px}
            height={px}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className={cn('font-semibold text-white select-none', TEXT_CLASS[size])}>
              {initials ?? name?.slice(0, 2).toUpperCase() ?? '?'}
            </span>
          </div>
        )}
      </div>

      {/* Online indicator */}
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            size === 'xl' ? 'w-4 h-4' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5',
            isOnline ? 'bg-[#22C55E]' : 'bg-gray-300',
          )}
        />
      )}
    </div>
  )
}
