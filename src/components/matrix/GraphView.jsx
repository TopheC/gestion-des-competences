import { useEffect, useRef, useState } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import { Button } from '@/components/ui/button'

export default function GraphView({
  categories, skills: allSkills, levels,
  filteredSkills, filteredMembers,
}) {
  const canvasRef = useRef(null)
  const [aggregated, setAggregated] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const width = 900
  const height = 600

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const catMap = {}
    categories.forEach((c) => { catMap[c.id] = c })

    const nodes = []
    const links = []
    const nodeMap = new Map()

    filteredMembers.forEach((m) => {
      const node = { id: m.id, type: 'member', label: m.full_name || m.email, r: 10, x: width / 2, y: height / 2 }
      nodes.push(node)
      nodeMap.set(m.id, node)
    })

    if (aggregated) {
      categories
        .filter((cat) => filteredSkills.length === 0 || filteredSkills.some((s) => s.category_id === cat.id))
        .forEach((cat) => {
          const nid = `cat-${cat.id}`
          const node = { id: nid, type: 'category', label: cat.name, r: 14, color: cat.color, catId: cat.id, x: width / 2, y: height / 2 }
          nodes.push(node)
          nodeMap.set(nid, node)

          filteredMembers.forEach((m) => {
            const catSkillIds = allSkills.filter((s) => s.category_id === cat.id).map((s) => s.id)
            let total = 0
            let count = 0
            catSkillIds.forEach((sid) => {
              const key = `${m.id}-${sid}`
              const lvl = levels[key]?.level
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
        const node = { id: nid, type: 'skill', label: s.name, r: 8, color: catMap[s.category_id]?.color || '#888', skillId: s.id, x: width / 2, y: height / 2 }
        nodes.push(node)
        nodeMap.set(nid, node)
      })

      filteredMembers.forEach((m) => {
        filteredSkills.forEach((s) => {
          const key = `${m.id}-${s.id}`
          const lvl = levels[key]?.level
          if (lvl) {
            links.push({ source: m.id, target: `skill-${s.id}`, strength: lvl / 4 })
          }
        })
      })
    }

    if (nodes.length === 0) return

    const dpi = window.devicePixelRatio || 1
    canvas.width = width * dpi
    canvas.height = height * dpi
    ctx.scale(dpi, dpi)

    const borderColor = getComputedStyle(canvas).getPropertyValue('--border').trim() || '#e5e7eb'
    const fgColor = getComputedStyle(canvas).getPropertyValue('--foreground').trim() || '#000'

    const simulation = forceSimulation(nodes)
      .force('link', forceLink(links).id((d) => d.id).distance(120).strength((d) => d.strength || 0.3))
      .force('charge', forceManyBody().strength(-150))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(20))
      .on('tick', ticked)

    function ticked() {
      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = borderColor
      ctx.lineWidth = 1
      links.forEach((l) => {
        const s = l.strength || 0.3
        ctx.globalAlpha = s * 0.5 + 0.15
        ctx.beginPath()
        ctx.moveTo(l.source.x, l.source.y)
        ctx.lineTo(l.target.x, l.target.y)
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

        ctx.globalAlpha = selectedNode && !isSel && !isNeighbor ? 0.12 : 1

        if (n.type === 'member') {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI)
          ctx.fillStyle = '#6366f1'
          ctx.fill()
          if (isSel) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.stroke()
          }
        } else if (n.type === 'category') {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI)
          ctx.fillStyle = n.color || '#888'
          ctx.fill()
          if (isSel) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.stroke()
          }
        } else {
          const s = 6
          ctx.fillStyle = n.color || '#888'
          ctx.fillRect(n.x - s / 2, n.y - s / 2, s, s)
          if (isSel) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.strokeRect(n.x - s / 2, n.y - s / 2, s, s)
          }
        }

        ctx.fillStyle = fgColor
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(n.label, n.x, n.y + n.r + 12)
      })

      ctx.globalAlpha = 1
    }

    let dragNode = null

    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) * (width / rect.width),
        y: (e.clientY - rect.top) * (height / rect.height),
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
      }
    }

    function onPointerMove(e) {
      if (!dragNode) return
      const pos = getCanvasPos(e)
      dragNode.fx = Math.max(0, Math.min(width, pos.x))
      dragNode.fy = Math.max(0, Math.min(height, pos.y))
    }

    function onPointerUp() {
      if (dragNode) {
        dragNode.fx = null
        dragNode.fy = null
        dragNode = null
        simulation.alphaTarget(0)
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      simulation.stop()
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [filteredSkills, filteredMembers, levels, categories, aggregated, selectedNode, allSkills])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Membre
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-400 inline-block" /> Compétence
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-current inline-block" /> Catégorie
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAggregated(!aggregated)}>
          {aggregated ? 'Détailler les compétences' : 'Agréger par catégorie'}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-lg overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="block w-full touch-none"
          style={{ height: `${height}px`, cursor: 'grab' }}
        />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-400 pointer-events-none">
          Cliquez sur un nœud pour le sélectionner • Glissez pour déplacer
        </div>
      </div>
    </div>
  )
}
