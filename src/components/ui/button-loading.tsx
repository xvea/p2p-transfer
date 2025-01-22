import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from './button'

export function ButtonLoading({ className }: { className?: string }) {
  return (
    <Button className={cn(className)} disabled>
      <Loader2 className="animate-spin" />
    </Button>
  )
}
