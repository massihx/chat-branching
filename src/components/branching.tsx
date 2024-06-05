import React, {useCallback, useEffect, useState} from 'react'
import ReactFlow, {
	NodeMouseHandler,
	Background,
	Controls,
	MiniMap,
	Edge,
	useNodesState,
	useEdgesState,
	MarkerType,
	Node,
	NodeProps,
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
import {fetchOpenAIResponse, GptMessage} from '@/utils/openai'
import {v4 as uuidv4} from 'uuid'
import {createConversation, getAllConversations} from '@/dbm/conversation.dbm'
import {createMessage, deleteMessageWithChildren, getParentMessages} from '@/dbm/message.dbm'
import {Message} from '@prisma/client'
import {MarkdownNode, MarkdownNodeData} from './MarkdownNode'

type MarkdownNodeDataProps = MarkdownNodeData<Partial<Message> & {id: Message['id']}>
type NodeWithData = Node<MarkdownNodeDataProps, 'markdownNode'>

const initialNodes: NodeWithData[] = []
const initialEdges: Edge[] = []

export const BranchingComponent: React.FC = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
	const [open, setOpen] = useState(false)
	const [question, setQuestion] = useState('')
	const [selectedNode, setSelectedNode] = useState<NodeWithData>()

	useEffect(() => {
		const fetchData = async () => {
			const conversations = await getAllConversations(true)
			const newNodes: NodeWithData[] = []
			const newEdges: Edge[] = []

			conversations.forEach(conversation => {
				conversation.messages.forEach((message, index) => {
					const nodeType = message.role === 'user' ? 'question' : 'answer'

					const messageNode: NodeWithData = {
						id: `msg-${message.id}`,
						type: 'markdownNode',
						data: {message, content: message.content, nodeType},
						position: {x: 100 * index, y: 100 + 50 * newNodes.length},
					}
					newNodes.push(messageNode)

					if (index === 0) return

					newEdges.push({
						id: `edge-${conversation.id}-${message.id}`,
						source: `msg-${message.parentId || message.id}`,
						target: messageNode.id,
						type: 'smoothstep',
						markerEnd: {
							type: MarkerType.ArrowClosed,
							width: 20,
							height: 20,
						},
					})
				})
			})

			setNodes(newNodes)
			setEdges(newEdges)
		}

		fetchData()
	}, [setEdges, setNodes])

	const onClickCanvas = useCallback(() => {
		setOpen(true)
	}, [])

	const handleClose = useCallback(() => {
		setOpen(false)
		setQuestion('')
		setSelectedNode(undefined)
	}, [])

	const calculateNodePosition = (
		existingNodeId?: NodeProps<MarkdownNodeDataProps>,
	): {x: number; y: number} => {
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
		isQuestion: boolean,
	): NodeWithData => {
		const newNode: NodeWithData = {
			id: uuidv4(),
			type: 'markdownNode',
			data: {
				message: data,
				content: data.content,
				nodeType: isQuestion ? 'question' : 'answer',
			},
			position,
		}
		setNodes(nds => [...nds, newNode])
		return newNode
	}

	const linkNodes = (
		{id: source}: NodeProps<MarkdownNodeDataProps>,
		{id: target}: NodeWithData,
	) => {
		const newEdge: Edge = {
			id: uuidv4(),
			source,
			target,
			type: 'smoothstep',
			markerEnd: {
				type: MarkerType.ArrowClosed,
				width: 20,
				height: 20,
			},
		}
		setEdges(eds => [...eds, newEdge])
	}

	const handleSubmitQuestion = async (
		node: NodeProps<MarkdownNodeDataProps>,
		questionContent: string,
	) => {
		try {
			const newPosition = calculateNodePosition(node)
			let convId = node?.data?.message?.conversationId!
			let messageContext: GptMessage[] = []

			// Create a new conversation if user clicked on the canvas
			if (!convId) {
				convId = (await createConversation(questionContent)).id
			}

			const hasParent = selectedNode?.data?.message?.parentId
			if (hasParent) {
				messageContext = (await getParentMessages(selectedNode?.data?.message?.id))
					.reverse()
					.map<GptMessage>(({role, content}) => ({
						role: role as GptMessage['role'],
						content,
					}))
			}

			messageContext.push({role: 'user', content: question})

			// Create question message on the backend and get the answer from OpenAI
			const [newQuestion, answer] = await Promise.all([
				createMessage(questionContent, 'user', convId, node?.data?.message?.id),
				fetchOpenAIResponse([{role: 'user', content: questionContent}]),
			])

			// Create answer message on the backend
			const newAnswer = await createMessage(answer, 'assistant', convId, newQuestion.id)

			// Update the UI with the new nodes and link them
			// const questionNode = addNode(newQuestion, newPosition, true)
			const answerNode = addNode(newAnswer, {x: newPosition.x + 200, y: newPosition.y}, false)

			// if (node) {
			// 	linkNodes(node, questionNode)
			// }

			linkNodes(node, answerNode)
		} catch (error: any) {
			console.error(error.message, error)
		}

		handleClose()
	}

	const onNodeClick: NodeMouseHandler = async (_, node) => {
		setSelectedNode(node as NodeWithData)
		setOpen(true)
	}

	const handleEditNode = (nodeId: NodeProps<MarkdownNodeDataProps>) => {
		// Implement your edit logic here
		console.log(`Edit node ${nodeId}`)
	}

	const handleDeleteNode = async (node: NodeProps<MarkdownNodeDataProps>) => {
		try {
			const nodeId = node.id

			await deleteMessageWithChildren(node.data.message.id)

			setNodes(currentNodes => {
				// Set to keep track of nodes to delete, starting with the selected node
				const nodesToDelete = new Set([nodeId])
				const edgesToDelete = new Set<string>()

				setEdges(currentEdges => {
					// Iterate over edges to find and mark all connected child nodes and their edges
					currentEdges.forEach(edge => {
						if (nodesToDelete.has(edge.source)) {
							nodesToDelete.add(edge.target)
							edgesToDelete.add(edge.id)
						}
					})

					// Return updated edges, excluding those marked for deletion
					return currentEdges.filter(edge => !edgesToDelete.has(edge.id))
				})

				// Return updated nodes, excluding those marked for deletion
				return currentNodes.filter(node => !nodesToDelete.has(node.id))
			})
		} catch (error: any) {
			console.error(error.message, error)
		}
	}

	const handleExtend = (node: NodeProps<MarkdownNodeDataProps>) => {
		setSelectedNode(node as unknown as NodeWithData)
		setOpen(true)
	}

	const handleContentChange = (id: string, content: string) => {
		setNodes(nds => nds.map(n => (n.id === id ? {...n, data: {...n.data, content}} : n)))
	}

	const addQuestionNode = (node: NodeProps<MarkdownNodeDataProps>) => {
		console.log({node})
		const newNodeID = uuidv4()
		const newNode: NodeWithData = {
			id: newNodeID,
			type: 'markdownNode',
			data: {content: '', nodeType: 'question', message: {id: -9}},
			position: {x: node.xPos + 200, y: node.yPos + 100}, // Adjust position relative to the existing node
		}
		setNodes(nds => nds.concat(newNode))
		setEdges(eds =>
			eds.concat({
				id: uuidv4(),
				source: node.id,
				target: newNode.id,
				type: 'smoothstep',
			}),
		)
	}

	return (
		<Box sx={{flexGrow: 1}}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={React.useMemo(() => {
					return {
						markdownNode: props => (
							<MarkdownNode
								{...props}
								data={props.data}
								onEdit={handleEditNode}
								// onExtend={handleExtend}
								onAddQuestion={addQuestionNode}
								onDelete={handleDeleteNode}
								submitQuestion={handleSubmitQuestion}
								// onContentChange={handleContentChange}
							/>
						),
					}
				}, [])}
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
					{/* <Button onClick={handleSubmitQuestion}>Submit</Button> */}
				</DialogActions>
			</Dialog>
		</Box>
	)
}
