import { useRef, useEffect, useState } from 'react'
import {
  type Particle,
  type MouseState,
  type RgbColor,
  DEFAULT_CONFIG,
  createParticles,
  updateParticle,
  calculateParticleColor,
  shouldDisableSimulation,
  parseBgColor,
} from '#/lib/fluid-simulation'

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const disabled = shouldDisableSimulation(
      navigator.userAgent,
      window.innerWidth,
      (navigator as any).deviceMemory,
      navigator.hardwareConcurrency,
    )
    if (disabled) {
      setEnabled(false)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement
    if (!parent) return

    // --- State ---
    let animationId = 0
    let running = true
    let isDark = document.documentElement.classList.contains('dark')
    let bgColor: RgbColor = parseBgColor(
      getComputedStyle(parent).backgroundColor,
    )

    // --- Canvas sizing ---
    function resize() {
      if (!canvas || !parent) return
      const rect = parent.getBoundingClientRect()
      const scale = DEFAULT_CONFIG.canvasScale
      canvas.width = rect.width * scale
      canvas.height = rect.height * scale
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }
    resize()

    // --- Particles ---
    let particles: Particle[] = createParticles(
      DEFAULT_CONFIG.particleCount,
      canvas.width,
      canvas.height,
    )

    // --- Mouse ---
    const mouse: {
      x: number
      y: number
      prevX: number
      prevY: number
      active: boolean
    } = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      active: false,
    }

    function onMouseMove(e: globalThis.MouseEvent) {
      if (!canvas || !parent) return
      const rect = parent.getBoundingClientRect()
      const scale = DEFAULT_CONFIG.canvasScale
      mouse.prevX = mouse.x
      mouse.prevY = mouse.y
      mouse.x = (e.clientX - rect.left) * scale
      mouse.y = (e.clientY - rect.top) * scale
      mouse.active = true
    }

    function onMouseLeave() {
      mouse.active = false
    }

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    // --- Theme observer ---
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark')
      if (parent) {
        bgColor = parseBgColor(getComputedStyle(parent).backgroundColor)
      }
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
        particles = createParticles(
          DEFAULT_CONFIG.particleCount,
          canvas!.width,
          canvas!.height,
        )
      }, 150)
    })
    resizeObserver.observe(parent)

    // --- Visibility ---
    function onVisibilityChange() {
      if (document.hidden) {
        running = false
      } else {
        running = true
        draw()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // --- Intersection observer ---
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          running = true
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
      if (!running || !ctx || !canvas) return

      ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${DEFAULT_CONFIG.fadeAlpha})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const bounds = { width: canvas.width, height: canvas.height }
      const mouseState: MouseState = { ...mouse }

      particles = particles.map((p) => {
        const updated = updateParticle(p, mouseState, bounds, DEFAULT_CONFIG)
        const speed = Math.hypot(updated.vx, updated.vy)
        const color = calculateParticleColor(speed, isDark)

        ctx!.fillStyle = `hsla(${color.hue}, ${color.saturation}%, ${color.lightness}%, ${color.alpha})`
        ctx!.beginPath()
        ctx!.arc(updated.x, updated.y, 2 + speed * 0.5, 0, Math.PI * 2)
        ctx!.fill()

        return updated
      })

      animationId = requestAnimationFrame(draw)
    }
    draw()

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      themeObserver.disconnect()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      clearTimeout(resizeTimeout)
    }
  }, [])

  if (!enabled) return null

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
