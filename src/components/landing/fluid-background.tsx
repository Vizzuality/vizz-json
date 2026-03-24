import { useRef, useEffect } from 'react'
import {
  createSimulation,
  stepSimulation,
  renderDisplay,
  addSplat,
  resizeSimulation,
  destroySimulation,
  shouldDisableSimulation,
  speedToSplatColor,
} from '#/lib/fluid'
import type { SimulationState } from '#/lib/fluid'

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const disabled = shouldDisableSimulation(
      navigator.userAgent,
      window.innerWidth,
      (navigator as any).deviceMemory,
      navigator.hardwareConcurrency,
    )
    if (disabled) {
      canvas.style.display = 'none'
      return
    }

    const parent = canvas.parentElement
    if (!parent) return

    // --- Canvas sizing ---
    function resize() {
      if (!canvas || !parent) return
      const rect = parent.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }
    resize()

    // --- Initialize simulation ---
    const simOrNull = createSimulation(canvas)
    if (!simOrNull) {
      canvas.style.display = 'none'
      return
    }
    const sim: SimulationState = simOrNull

    // --- State ---
    let animationId = 0
    let running = true
    let isDark = document.documentElement.classList.contains('dark')
    let lastTime = performance.now()

    // --- Mouse state ---
    let mouseX = 0
    let mouseY = 0
    let prevMouseX = 0
    let prevMouseY = 0

    function onMouseMove(e: globalThis.MouseEvent) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()

      prevMouseX = mouseX
      prevMouseY = mouseY
      mouseX = (e.clientX - rect.left) / rect.width
      mouseY = 1.0 - (e.clientY - rect.top) / rect.height

      const dx = mouseX - prevMouseX
      const dy = mouseY - prevMouseY
      const speed = Math.hypot(dx, dy)

      // Only splat when actually moving (burst on movement)
      if (speed > 0.001) {
        const color = speedToSplatColor(speed * 1000, isDark)
        addSplat(sim, {
          x: mouseX,
          y: mouseY,
          dx,
          dy,
          color,
        })
      }
    }

    window.addEventListener('mousemove', onMouseMove)

    // --- Theme observer ---
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark')
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // --- Resize observer ---
    let resizeTimeout: ReturnType<typeof setTimeout>
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        resize()
        resizeSimulation(sim, canvas.width, canvas.height)
      }, 150)
    })
    resizeObserver.observe(parent)

    // --- Visibility ---
    function onVisibilityChange() {
      if (document.hidden) {
        running = false
      } else {
        running = true
        lastTime = performance.now()
        draw()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // --- Intersection observer ---
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          running = true
          lastTime = performance.now()
          draw()
        } else {
          running = false
        }
      },
      { threshold: 0 },
    )
    intersectionObserver.observe(canvas)

    // --- Render loop ---
    function draw() {
      cancelAnimationFrame(animationId)
      if (!running || !canvas) return

      const now = performance.now()
      const dt = Math.min((now - lastTime) / 1000, 0.016667)
      lastTime = now

      stepSimulation(sim, dt)

      const brightness = isDark ? 0.45 : 0.5
      renderDisplay(sim, brightness)

      animationId = requestAnimationFrame(draw)
    }
    draw()

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      themeObserver.disconnect()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      clearTimeout(resizeTimeout)
      destroySimulation(sim)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
      }}
    />
  )
}
