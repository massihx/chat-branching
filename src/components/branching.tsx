import React, {useCallback, useEffect, useState} from 'react'
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
import {createConversation, getAllConversations} from '@/dbm/conversation.dbm'
import {createMessage} from '@/dbm/message.dbm'
import {Message} from '@prisma/client'

type NodeWithData = Node<
	Partial<Message> & {id: Message['id']; content: Message['content']; label: Message['content']}
>

const initialNodes: NodeWithData[] = []
const initialEdges: Edge[] = []

export const BranchingComponent: React.FC = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
	const [open, setOpen] = useState(false)
	const [question, setQuestion] = useState('')
	const [selectedNode, setSelectedNode] = useState<NodeWithData>()

	useEffect(() => {
		;(async () => {
			const conversations = await getAllConversations(true)
			const newNodes: NodeWithData[] = []
			const newEdges: Edge[] = []

			conversations.forEach(conversation => {
				conversation.messages.forEach((message, index) => {
					const messageNode: NodeWithData = {
						id: `msg-${message.id}`,
						data: {...message, label: message.content},
						position: {x: 100 * index, y: 100 + 50 * newNodes.length},
					}
					newNodes.push(messageNode)

					if (index > 0) {
						newEdges.push({
							id: `edge-${conversation.id}-${message.id}`,
							source: `msg-${message.parentId || message.id}`,
							target: messageNode.id,
							type: 'smoothstep',
						})
					}
				})
			})

			setNodes(newNodes)
			setEdges(newEdges)
		})()
	}, [setEdges, setNodes])

	const onClickCanvas = useCallback(() => {
		setOpen(true)
	}, [])

	const handleClose = useCallback(() => {
		setOpen(false)
		setQuestion('')
		setSelectedNode(undefined)
	}, [])

	const calculateNodePosition = (existingNodeId?: NodeWithData): {x: number; y: number} => {
		if (existingNodeId) {
			const existingNode = nodes.find(node => node.id === existingNodeId.id)

			if (existingNode) {
				return {x: existingNode.position.x + 200, y: existingNode.position.y + 50}
			}
		}

		return {x: Math.random() * 400, y: Math.random() * 400}
	}

	const addNode = (
		data: {content: string; id: number},
		position: {x: number; y: number},
	): NodeWithData => {
		const newNode: NodeWithData = {
			id: uuidv4(),
			data: {...data, label: data.content},
			position,
		}
		setNodes(nds => [...nds, newNode])
		return newNode
	}

	const linkNodes = ({id: source}: NodeWithData, {id: target}: NodeWithData) => {
		const newEdge: Edge = {
			id: uuidv4(),
			source,
			target,
			type: 'smoothstep',
		}
		setEdges(eds => [...eds, newEdge])
	}

	const handleSubmit = async () => {
		try {
			const newPosition = calculateNodePosition(selectedNode)
			let convId = selectedNode?.data.conversationId!

			// Determine the conversation context
			if (!selectedNode) {
				convId = (await createConversation(question)).id
			}

			// Crate question message on the backend and get the answer from OpenAI
			const [newQuestion, answer] = await Promise.all([
				createMessage(question, 'user', convId, selectedNode?.data.id),
				fetchOpenAIResponse([{role: 'user', content: question}]),
			])

			// Create answer message on the backend
			const newAnswer = await createMessage(answer, 'bot', convId, newQuestion.id)

			// Update the UI with the new nodes and link them
			const questionNode = addNode(newQuestion, newPosition)
			const answerNode = addNode(newAnswer, {x: newPosition.x + 200, y: newPosition.y})

			if (selectedNode) {
				linkNodes(selectedNode, questionNode)
			}

			linkNodes(questionNode, answerNode)
		} catch (error: any) {
			console.error(error.message, error)
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
				<DialogTitle>
					{selectedNode ? 'Type a question' : 'Start a new conversation'}
				</DialogTitle>
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
