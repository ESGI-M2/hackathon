"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface Step {
  prompt: string;
  dependencies: number[];
}

interface Props {
  steps: Step[];
}

export default function StepFlow({ steps }: Props) {
  const initial = useMemo(() => {
    const ns: Node[] = [
      { id: "input", data: { label: "Entrée" }, position: { x: 0, y: 0 } },
    ];
    const es: Edge[] = [];
    steps.forEach((s, idx) => {
      ns.push({
        id: `${idx}`,
        data: { label: `Étape ${idx + 1}` },
        position: { x: 200 * (idx + 1), y: 0 },
      });
      const deps = s.dependencies.length > 0 ? s.dependencies : [idx - 1];
      deps.forEach((d) => {
        es.push({
          id: `${d}->${idx}`,
          source: d === -1 ? "input" : `${d}`,
          target: `${idx}`,
        });
      });
    });
    return { nodes: ns, edges: es };
  }, [steps]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  return (
    <div className="h-64 w-full border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
        fitView
      ></ReactFlow>
    </div>
  );
}
