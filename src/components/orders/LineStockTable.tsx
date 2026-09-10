import { MapPin } from 'lucide-react'
import { Pill } from '@/components/ui/Pill'
import { Mono } from './cells'
import type { LineStock } from '@/lib/types'
import { cn } from '@/lib/cn'

const lineState = {
  ok: null,
  low: { label: 'Dips below reorder', className: 'bg-risk-fill text-risk-text' },
  out: { label: 'Short', className: 'bg-danger-fill text-danger-text' },
} as const

/** SKU-level stock, so a picker knows what will actually be on the shelf. */
export function LineStockTable({ lines }: { lines: LineStock[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-hairline-subtle">
          <th className="label-text pb-2 text-left">SKU</th>
          <th className="label-text pb-2 text-left">Product</th>
          <th className="label-text pb-2 text-right">Required</th>
          <th className="label-text pb-2 text-right">On hand</th>
          <th className="label-text pb-2 pl-6 text-left">Location</th>
          <th className="label-text pb-2" />
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          const flag = lineState[line.state]

          return (
            <tr key={line.sku} className="border-b border-hairline-subtle last:border-0">
              <td className="py-2.5">
                <Mono className="text-ink-secondary">{line.sku}</Mono>
              </td>
              <td className="py-2.5 pr-4 text-[13.5px] text-ink">{line.name}</td>
              <td className="tnum py-2.5 text-right text-[13.5px] text-ink">{line.required}</td>
              <td
                className={cn(
                  'tnum py-2.5 text-right text-[13.5px]',
                  line.state === 'out'
                    ? 'font-medium text-danger-text'
                    : line.state === 'low'
                      ? 'font-medium text-risk-text'
                      : 'text-ink',
                )}
              >
                {line.onHand}
              </td>
              <td className="py-2.5 pl-6">
                <span className="inline-flex items-center gap-1.5 text-ink-secondary">
                  <MapPin size={13} className="text-ink-muted" />
                  <Mono>{line.location}</Mono>
                </span>
              </td>
              <td className="py-2.5 pl-4 text-right">
                {flag && <Pill className={flag.className}>{flag.label}</Pill>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
