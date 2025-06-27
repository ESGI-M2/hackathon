"use client"

import { useMemo } from "react"
import ReactFlow, { Background, Controls, Edge, Node } from "reactflow"
import "reactflow/dist/style.css"

interface Step {
  prompt: string
  dependencies: number[]
}

interface Props {
  steps: Step[]
}

export default function StepFlow({ steps }: Props) {
  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = [
      { id: "input", data: { label: "Entrée" }, position: { x: 0, y: 0 } },
    ]
    const es: Edge[] = []
    steps.forEach((s, idx) => {
      ns.push({
        id: `${idx}`,
        data: { label: `Étape ${idx + 1}` },
        position: { x: 200 * (idx + 1), y: 0 },
      })
      const deps = s.dependencies.length > 0 ? s.dependencies : [idx - 1]
      deps.forEach(d => {
        es.push({
          id: `${d}->${idx}`,
          source: d === -1 ? "input" : `${d}`,
          target: `${idx}`,
        })
      })
    })
    return { nodes: ns, edges: es }
  }, [steps])

  return (
    <div className="h-64 w-full border">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
