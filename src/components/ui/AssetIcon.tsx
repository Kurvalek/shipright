import { cn } from '@/lib/cn'

/* The drawn icons, as opposed to the line icons the rest of the app takes from
   lucide. They arrive as flat black PNGs, so they are painted as a mask over
   currentColor rather than dropped in as images: an <img> would stay black in a
   row that has gone brand-coloured, and would need a second copy of itself to
   survive a dark surface.

   Sized in pixels rather than by a Tailwind class because these sit beside
   lucide icons that are sized the same way, and a nav row where one icon is
   16px and its neighbour is "size-4" is a row where the two drift apart. */
export function AssetIcon({
  src,
  size = 16,
  className,
}: {
  src: string
  size?: number
  className?: string
}) {
  return (
    <span
      aria-hidden
      style={{ maskImage: `url(${src})`, width: size, height: size }}
      className={cn('icon-mask block shrink-0', className)}
    />
  )
}
