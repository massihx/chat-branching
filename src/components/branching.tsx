import React, {useCallback, useRef, useState} from 'react'
import ReactFlow, {
	Background,
	Controls,
	MiniMap,
	Node,
	Edge,
	useNodesState,
	useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
} from '@mui/material'
import {fetchOpenAIResponse} from '@/utils/openai'
import {v4 as uuidv4} from 'uuid'

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export const BranchingComponent: React.FC = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
	const [open, setOpen] = useState(false)
	const [question, setQuestion] = useState('')
	const clickedNodeIdRef = useRef<string | undefined>()

	const onClickCanvas = useCallback(() => {
		setOpen(true)
	}, [])

	const handleClose = () => {
		setOpen(false)
		setQuestion('')
	}

	const calculateNewPosition = (existingNodeId: string | undefined): {x: number; y: number} => {
		if (existingNodeId) {
			const existingNode = nodes.find(node => node.id === existingNodeId)
			if (existingNode) {
				return {x: existingNode.position.x + 200, y: existingNode.position.y + 50}
			}
		}
		return {x: Math.random() * 400, y: Math.random() * 400}
	}

	const addNode = (label: string, position: {x: number; y: number}): Node => {
		const newNode: Node = {
			id: uuidv4(),
			data: {label},
			position,
		}
		setNodes(nds => [...nds, newNode])
		return newNode
	}

	const addEdgeBetweenNodes = (source: string, target: string) => {
		const newEdge: Edge = {
			id: uuidv4(),
			source,
			target,
			type: 'smoothstep',
		}
		setEdges(eds => [...eds, newEdge])
	}

	const handleSubmit = async () => {
		const newPosition = calculateNewPosition(clickedNodeIdRef.current)
		const questionNode = addNode(question, newPosition)

		if (clickedNodeIdRef.current) {
			addEdgeBetweenNodes(clickedNodeIdRef.current, questionNode.id)
		}

		try {
			const answer = await fetchOpenAIResponse([{role: 'user', content: question}])
			const answerNode = addNode(answer, {x: newPosition.x + 200, y: newPosition.y})
			addEdgeBetweenNodes(questionNode.id, answerNode.id)
		} catch (error) {
			console.error('Error fetching response from OpenAI:', error)
		}

		clickedNodeIdRef.current = undefined
		handleClose()
	}

	const onNodeClick = async (event: React.MouseEvent<Element, MouseEvent>, node: Node) => {
		const dataId = event.currentTarget.getAttribute('data-id')
		console.log('clicked node id', dataId)
		clickedNodeIdRef.current = dataId!
		setOpen(true)
	}

	return (
		<Box sx={{height: '100vh', width: '100vw'}}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onPaneClick={onClickCanvas}
				onNodeClick={onNodeClick}
				fitView
			>
				<MiniMap />
				<Controls />
				<Background />
			</ReactFlow>
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>Start a New Conversation</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="Enter your question"
						type="text"
						fullWidth
						value={question}
						onChange={e => setQuestion(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleSubmit}>Submit</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}
