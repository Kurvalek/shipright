import { useEffect, useRef, useState } from 'react'

const easeOut = (t: number) => 1 - (1 - t) ** 3

/* Long enough to be seen counting, short enough that it is over before it is
   read. Scaled by the distance so that a card moving by one does not take as
   long as one moving by thirty, which would read as hesitation rather than
   change. */
const durationFor = (distance: number) => Math.min(700, 200 + Math.abs(distance) * 20)

/* A number that counts to its new value rather than being replaced by it. These
   cards change while you are looking at them — a shift packs an order and the
   totals move underneath — and a digit swapped in place is easy to miss
   entirely. Counting is the smallest thing that says the number is not the one
   you read a moment ago.

   Renders bare, so the classes on whatever holds it still apply to the digits. */
export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  // What is on screen right now, so a change mid-count carries on from there
  // instead of jumping back to where the last one started.
  const shownRef = useRef(value)
  const settled = useRef(false)

  useEffect(() => {
    /* The first value is not a change, it is the state of the warehouse when
       the page opened. Counting up to it on load would make every reload look
       like a busy morning. */
    if (!settled.current) {
      settled.current = true
      shownRef.current = value
      return
    }

    const from = shownRef.current
    const distance = value - from
    if (distance === 0) return

    const snap = () => {
      shownRef.current = value
      setShown(value)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      snap()
      return
    }

    const duration = durationFor(distance)
    const start = performance.now()
    let frame = 0

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)

      if (progress === 1) {
        snap()
        return
      }

      shownRef.current = Math.round(from + distance * easeOut(progress))
      setShown(shownRef.current)
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <>{shown}</>
}
