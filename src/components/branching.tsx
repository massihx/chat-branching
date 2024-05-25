import React, {useCallback, useState} from 'react'
import ReactFlow, {
	NodeMouseHandler,
	addEdge,
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
	const [selectedNode, setSelectedNode] = useState<Node>()

	const onClickCanvas = useCallback(() => {
		setOpen(true)
	}, [])

	const handleClose = useCallback(() => {
		setOpen(false)
		setQuestion('')
		setSelectedNode(undefined)
	}, [])

	const calculateNewPosition = (existingNodeId?: Node): {x: number; y: number} => {
		if (existingNodeId) {
			const existingNode = nodes.find(node => node.id === existingNodeId.id)

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

	const linkNodes = ({id: source}: Node, {id: target}: Node) => {
		const newEdge: Edge = {
			id: uuidv4(),
			source,
			target,
			type: 'smoothstep',
		}
		setEdges(eds => [...eds, newEdge])
	}

	const handleSubmit = async () => {
		const newPosition = calculateNewPosition(selectedNode)
		const questionNode = addNode(question, newPosition)

		if (selectedNode) {
			linkNodes(selectedNode, questionNode)
		}

		try {
			const answer = await fetchOpenAIResponse([{role: 'user', content: question}])
			const answerNode = addNode(answer, {x: newPosition.x + 200, y: newPosition.y})
			linkNodes(questionNode, answerNode)
		} catch (error) {
			console.error('Error fetching response from OpenAI:', error)
		}

		handleClose()
	}

	const onNodeClick: NodeMouseHandler = async (_, node) => {
		setSelectedNode(node)
		setOpen(true)
	}

	return (
		<Box sx={{flexGrow: 1}}>
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
