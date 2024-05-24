import React, {useCallback, useState} from 'react'
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

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export const BranchingComponent: React.FC = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
	const [open, setOpen] = useState(false)
	const [question, setQuestion] = useState('')
	const [nodeId, setNodeId] = useState(1)

	const onClickCanvas = useCallback(() => {
		setOpen(true)
	}, [])

	const handleClose = () => {
		setOpen(false)
		setQuestion('')
	}

	const handleSubmit = async () => {
		const newNodeId = `node-${nodeId}`
		const questionNode: Node = {
			id: newNodeId,
			data: {label: question},
			position: {x: Math.random() * 400, y: Math.random() * 400},
		}

		setNodes(nds => [...nds, questionNode])
		setNodeId(id => id + 1)

		try {
			const answer = await fetchOpenAIResponse([{role: 'user', content: question}])
			const answerNode: Node = {
				id: `node-${nodeId + 1}`,
				data: {label: answer},
				position: {x: questionNode.position.x + 200, y: questionNode.position.y},
			}
			setNodes(nds => [...nds, questionNode, answerNode])
			setEdges(eds => [
				...eds,
				{
					id: `edge-${nodeId}`,
					source: newNodeId,
					target: `node-${nodeId + 1}`,
					type: 'smoothstep',
				},
			])
			setNodeId(id => id + 1)
		} catch (error) {
			console.error('Error fetching response from OpenAI:', error)
		}

		handleClose()
	}

	return (
		<Box sx={{height: '100vh', width: '100vw'}}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onPaneClick={onClickCanvas}
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
