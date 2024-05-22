'use client'

import React, {useEffect, useState, MouseEvent} from 'react'
import ReactFlow, {
	Controls,
	Background,
	MiniMap,
	Node,
	Edge,
	addEdge,
	Connection,
	Handle,
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

interface Message {
	id: string
	content: string
	role: string
	parentId: string | null
	children: Message[]
}

interface ConversationTreeProps {
	conversationId: number
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

const ConversationTree: React.FC<ConversationTreeProps> = ({conversationId}) => {
	const [nodes, setNodes] = useState<Node[]>(initialNodes)
	const [edges, setEdges] = useState<Edge[]>(initialEdges)
	const [newMessage, setNewMessage] = useState<string>('')
	const [open, setOpen] = useState<boolean>(false)
	const [context, setContext] = useState<string>('')

	const handleClick = (event: MouseEvent) => {
		const rect = (event.target as HTMLElement).getBoundingClientRect()
		const position = {x: event.clientX - rect.left, y: event.clientY - rect.top}
		setNewMessage('')
		setContext('')
		setOpen(true)
	}

	const handleClose = () => {
		setOpen(false)
	}

	const handleAddMessage = async () => {
		if (newMessage.trim()) {
			const newId = `node-${nodes.length + 1}`
			const newNode: Node = {
				id: newId,
				type: 'default',
				data: {label: newMessage},
				position: {x: 250, y: 50},
			}
			setNodes(nds => nds.concat(newNode))

			const response = await getOpenAIResponse(newMessage, context)
			const responseNode: Node = {
				id: `node-${nodes.length + 2}`,
				type: 'default',
				data: {
					label: (
						<>
							{response}
							<Button onClick={() => handleContinueConversation(newId)}>
								Continue
							</Button>
						</>
					),
				},
				position: {x: 250, y: 150},
			}
			setNodes(nds => nds.concat(responseNode))

			const newEdge: Edge = {
				id: `edge-${newId}-${responseNode.id}`,
				source: newId,
				target: responseNode.id,
				type: 'default',
			}
			setEdges(eds => eds.concat(newEdge))

			setOpen(false)
		}
	}

	const handleContinueConversation = (parentId: string) => {
		setContext(nodes.find(node => node.id === parentId)?.data.label || '')
		setOpen(true)
	}

	const onConnect = (params: Edge | Connection) => setEdges(eds => addEdge(params, eds))

	return (
		<div style={{width: '100%', height: '100vh'}} onClick={handleClick}>
			<ReactFlow nodes={nodes} edges={edges} onConnect={onConnect} fitView>
				<MiniMap
					nodeColor={node => (node.style?.background === '#D3E5FF' ? 'blue' : 'red')}
				/>
				<Controls />
				<Background />
			</ReactFlow>
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>Ask a Question</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="Question"
						fullWidth
						variant="outlined"
						value={newMessage}
						onChange={e => setNewMessage(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleAddMessage}>Add</Button>
				</DialogActions>
			</Dialog>
		</div>
	)
}

export default ConversationTree
