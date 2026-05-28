import { useEffect, useRef, useState, useCallback } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import { Button } from '@/components/ui/button'
import { ChartCard } from './ChartCard'

export default function GraphView({
  categories, skills: allSkills, levels,
  filteredSkills, filteredMembers,
}) {
  const canvasRef = useRef(null)
  const [aggregated, setAggregated] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)

  const width = 900
  const height = 600

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpi = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const displayW = rect.width || width
    const displayH = displayW * (height / width)
    canvas.width = displayW * dpi
    canvas.height = displayH * dpi
    canvas.style.height = `${displayH}px`

    const computed = getComputedStyle(canvas)
    const borderCSS = computed.getPropertyValue('--border').trim() || '#e5e7eb'
    const fgCSS = computed.getPropertyValue('--foreground').trim() || '#000'
    const mutedCSS = computed.getPropertyValue('--muted-foreground').trim() || '#6b7280'

    const catMap = {}
    categories.forEach((c) => { catMap[c.id] = c })

    const nodes = []
    const links = []
    const nodeMap = new Map()

    filteredMembers.forEach((m) => {
      const node = { id: m.id, type: 'member', label: m.full_name || m.email, r: 10, x: displayW / 2, y: displayH / 2 }
      nodes.push(node)
      nodeMap.set(m.id, node)
    })

    if (aggregated) {
      categories
        .filter((cat) => filteredSkills.length === 0 || filteredSkills.some((s) => s.category_id === cat.id))
        .forEach((cat) => {
          const nid = `cat-${cat.id}`
          const node = { id: nid, type: 'category', label: cat.name, r: 14, color: cat.color || '#888', catId: cat.id, x: displayW / 2, y: displayH / 2 }
          nodes.push(node)
          nodeMap.set(nid, node)

          filteredMembers.forEach((m) => {
            const catSkillIds = allSkills.filter((s) => s.category_id === cat.id).map((s) => s.id)
            let total = 0
            let count = 0
            catSkillIds.forEach((sid) => {
              const key = `${m.id}-${sid}`
              const lvl = levels.get(key)?.level
              if (lvl) { total += lvl; count++ }
            })
            if (count > 0) {
              links.push({ source: m.id, target: nid, strength: total / count / 4 })
            }
          })
        })
    } else {
      filteredSkills.forEach((s) => {
        const nid = `skill-${s.id}`
        const node = {
          id: nid, type: 'skill', label: s.name, r: 7,
          color: catMap[s.category_id]?.color || '#888',
          skillId: s.id, catId: s.category_id,
          x: displayW / 2, y: displayH / 2,
        }
        nodes.push(node)
        nodeMap.set(nid, node)
      })

      filteredMembers.forEach((m) => {
        filteredSkills.forEach((s) => {
          const key = `${m.id}-${s.id}`
          const lvl = levels.get(key)?.level
          if (lvl) {
            links.push({ source: m.id, target: `skill-${s.id}`, strength: lvl / 4 })
          }
        })
      })
    }

    if (nodes.length === 0) return

    ctx.scale(dpi, dpi)

    const simulation = forceSimulation(nodes)
      .force('link', forceLink(links).id((d) => d.id).distance(120).strength((d) => d.strength || 0.3))
      .force('charge', forceManyBody().strength(-180))
      .force('center', forceCenter(displayW / 2, displayH / 2))
      .force('collide', forceCollide(20))
      .on('tick', ticked)

    function drawBgPattern() {
      ctx.save()
      ctx.fillStyle = mutedCSS
      const spacing = 24
      for (let x = 0; x < displayW; x += spacing) {
        for (let y = 0; y < displayH; y += spacing) {
          ctx.globalAlpha = 0.12
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      ctx.restore()
    }

    function ticked() {
      ctx.save()
      ctx.clearRect(0, 0, displayW, displayH)
      drawBgPattern()

      links.forEach((l) => {
        const s = l.strength || 0.3
        const lw = Math.max(1, s * 4)
        ctx.beginPath()
        ctx.moveTo(l.source.x, l.source.y)
        ctx.lineTo(l.target.x, l.target.y)
        ctx.strokeStyle = borderCSS
        ctx.globalAlpha = s * 0.35 + 0.1
        ctx.lineWidth = lw
        ctx.stroke()
      })

      ctx.globalAlpha = 1
      nodes.forEach((n) => {
        const isSel = selectedNode === n.id
        const isNeighbor = isSel
          ? links.some((l) => {
              const sid = typeof l.source === 'object' ? l.source.id : l.source
              const tid = typeof l.target === 'object' ? l.target.id : l.target
              return (sid === selectedNode && tid === n.id) || (tid === selectedNode && sid === n.id)
            })
          : false

        ctx.globalAlpha = selectedNode && !isSel && !isNeighbor ? 0.1 : 1

        if (isSel) {
          ctx.save()
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
          grad.addColorStop(0, `rgba(99, 102, 241, 0.25)`)
          grad.addColorStop(1, `rgba(99, 102, 241, 0)`)
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }

        if (n.type === 'member') {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI)
          ctx.fillStyle = '#6366f1'
          ctx.fill()
          if (isSel) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2.5
            ctx.stroke()
          }
        } else if (n.type === 'category') {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI)
          ctx.fillStyle = n.color || '#888'
          ctx.fill()
          if (isSel) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2.5
            ctx.stroke()
          }
        } else {
          const s = 6
          ctx.fillStyle = n.color || '#888'
          ctx.beginPath()
          ctx.roundRect(n.x - s / 2, n.y - s / 2, s, s, 1.5)
          ctx.fill()
          if (isSel) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.strokeRect(n.x - s / 2 - 1, n.y - s / 2 - 1, s + 2, s + 2)
          }
        }

        ctx.fillStyle = fgCSS
        ctx.font = '500 10px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const tx = n.x
        const ty = n.y + n.r + 4
        ctx.save()
        ctx.shadowColor = 'var(--background, #fff)'
        ctx.shadowBlur = 4
        ctx.fillText(n.label, tx, ty)
        ctx.restore()
      })

      ctx.globalAlpha = 1
      ctx.restore()
    }

    let dragNode = null
    let panning = false
    let panStart = null

    function getCanvasPos(e) {
      const r = canvas.getBoundingClientRect()
      return {
        x: (e.clientX - r.left) * (displayW / r.width),
        y: (e.clientY - r.top) * (displayH / r.height),
      }
    }

    function findHit(px, py) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const dx = px - n.x
        const dy = py - n.y
        if (dx * dx + dy * dy <= (n.r + 8) * (n.r + 8)) return n
      }
      return null
    }

    function onPointerDown(e) {
      const pos = getCanvasPos(e)
      const hit = findHit(pos.x, pos.y)
      if (hit) {
        dragNode = hit
        setSelectedNode(hit.id)
        hit.fx = hit.x
        hit.fy = hit.y
        simulation.alphaTarget(0.3).restart()
        canvas.style.cursor = 'grabbing'
      } else {
        panning = true
        panStart = { x: e.clientX, y: e.clientY }
        canvas.style.cursor = 'grabbing'
      }
    }

    function onPointerMove(e) {
      if (dragNode) {
        const pos = getCanvasPos(e)
        dragNode.fx = Math.max(0, Math.min(displayW, pos.x))
        dragNode.fy = Math.max(0, Math.min(displayH, pos.y))
        return
      }
      if (panning && panStart) {
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y
        nodes.forEach((n) => {
          n.x += dx * (displayW / canvas.getBoundingClientRect().width)
          n.y += dy * (displayH / canvas.getBoundingClientRect().height)
          if (n.fx !== null) n.fx = n.x
          if (n.fy !== null) n.fy = n.y
        })
        panStart = { x: e.clientX, y: e.clientY }
      } else {
        if (!e.buttons) { canvas.style.cursor = 'grab'; return }
        const pos = getCanvasPos(e)
        const hit = findHit(pos.x, pos.y)
        canvas.style.cursor = hit ? 'pointer' : 'grab'
      }
    }

    function onPointerUp() {
      if (dragNode) {
        dragNode.fx = null
        dragNode.fy = null
        dragNode = null
        simulation.alphaTarget(0)
      }
      panning = false
      panStart = null
      canvas.style.cursor = 'grab'
    }

    function onWheel(e) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.92 : 1.08
      const rect = canvas.getBoundingClientRect()
      const cx = (e.clientX - rect.left) * (displayW / rect.width)
      const cy = (e.clientY - rect.top) * (displayH / rect.height)
      nodes.forEach((n) => {
        n.x = cx + (n.x - cx) * delta
        n.y = cy + (n.y - cy) * delta
        if (n.fx !== null) n.fx = n.x
        if (n.fy !== null) n.fy = n.y
      })
      simulation.alpha(0.3).restart()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      simulation.stop()
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [filteredSkills, filteredMembers, levels, categories, aggregated, selectedNode, allSkills, width, height])

  useEffect(() => {
    const cleanup = render()
    return cleanup
  }, [render])

  return (
    <ChartCard>
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Membre
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-400 inline-block" /> Compétence
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-current inline-block" /> Catégorie
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAggregated(!aggregated)}>
            {aggregated ? 'Détailler les compétences' : 'Agréger par catégorie'}
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-lg border bg-background">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            style={{ cursor: 'grab', aspectRatio: `${width}/${height}` }}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/60 pointer-events-none select-none">
            Sélectionner • Glisser nœud • Molette zoom • Fond pour panoramique
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
