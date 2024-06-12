'use client'
import {useEffect, useCallback, useMemo} from 'react'

import ReactFlow, {
	MarkerType,
	ReactFlowProvider,
	useReactFlow,
	Node,
	Edge,
	NodeMouseHandler,
	useNodesState,
	useEdgesState,
	OnConnect,
	addEdge,
	ConnectionLineType,
	Background,
	Controls,
	MiniMap,
	BackgroundVariant,
} from 'reactflow'

import 'reactflow/dist/style.css'
// import './styles.css'
import {initialEdges, initialNodes} from './initialElements'

import QuestionNode from './questionNode'
import AnswerNode from './answerNode'

const proOptions = {
	account: 'paid-pro',
	hideAttribution: true,
}

const defaultEdgeOptions = {
	type: 'smoothstep',
	markerEnd: {type: MarkerType.ArrowClosed},
	pathOptions: {offset: 5},
}

const nodeColor = (node: Node) => {
	switch (node.type) {
		case 'input':
			return '#6ede87'
		case 'output':
			return '#6865A5'
		default:
			return '#ff0072'
	}
}

function ReactFlowAutoLayout() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
	const nodeTypes = useMemo(() => ({question: QuestionNode, answer: AnswerNode}), [])
	return (
		<ReactFlow
			nodes={nodes}
			onNodesChange={onNodesChange}
			edges={edges}
			onEdgesChange={onEdgesChange}
			fitView={false}
			zoomOnDoubleClick={false} // Prevent zooming on double click
			preventScrolling={false} // Allow the main document to be scrolled
		></ReactFlow>
	)
}

const ReactFlowWrapper = () => {
	return (
		<ReactFlowProvider>
			<ReactFlowAutoLayout />
		</ReactFlowProvider>
	)
}

export default ReactFlowWrapper
