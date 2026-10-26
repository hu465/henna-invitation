import { useEffect, useState } from 'react'

/** Live viewport size in CSS pixels, for artwork drawn in screen units. */
export function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setSize(read()))
    }
    addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', on)
    }
  }, [])
  return size
}
