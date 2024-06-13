'use client'
import React, {useCallback, useEffect, useRef, useState} from 'react'
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
	useReactFlow,
	ReactFlowProvider,
	Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
	Box,
	Button,
	ButtonGroup,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Snackbar,
	TextField,
	Typography,
} from '@mui/material'
import {fetchOpenAIResponse, GptMessage} from '@/utils/openai'
import {v4 as uuidv4} from 'uuid'
import {createConversation, getAllConversations} from '@/dbm/conversation.dbm'
import {
	createMessage,
	deleteMessageWithChildren,
	getParentMessages,
	updateMessage,
} from '@/dbm/message.dbm'
import {Message} from '@prisma/client'
import {MarkdownNode, MarkdownNodeData} from './MarkdownNode'
import {FiCopy, FiPlus, FiTrash2} from 'react-icons/fi'
import {CircularProgress} from '@mui/material'
import {BiSelectMultiple} from 'react-icons/bi'
// import {initialEdges, initialNodes} from './_initialElements'
import ELK from 'elkjs/lib/elk.bundled.js'

const proOptions = {
	account: 'paid-pro',
	hideAttribution: true,
}

const elk = new ELK()

type MarkdownNodeDataProps = MarkdownNodeData<Partial<Message>>
type NodeWithData = Node<MarkdownNodeDataProps, 'markdownNode'>

const initialNodes: NodeWithData[] = []
const initialEdges: Edge[] = []

const useLayoutedElements = () => {
	const {getNodes, setNodes, getEdges, fitView} = useReactFlow()
	const defaultOptions = {
		'elk.algorithm': 'layered',
		'elk.layered.spacing.nodeNodeBetweenLayers': 100,
		'elk.spacing.nodeNode': 80,
	}

	const getLayoutedElements = useCallback(options => {
		const layoutOptions = {...defaultOptions, ...options}
		const graph = {
			id: 'root',
			layoutOptions: layoutOptions,
			children: getNodes(),
			edges: getEdges(),
		}

		elk.layout(graph).then(({children}) => {
			// By mutating the children in-place we saves ourselves from creating a
			// needless copy of the nodes array.
			children.forEach(node => {
				node.position = {x: node.x, y: node.y}
			})

			setNodes(children)
			window.requestAnimationFrame(() => {
				fitView()
			})
		})
	}, [])

	return {getLayoutedElements}
}

const questionEdgeStyle = {
	type: 'smoothstep',
	style: {
		strokeWidth: 3,
		stroke: '#149700',
	},
	markerEnd: {
		type: MarkerType.ArrowClosed,
		width: 16,
		height: 16,
		color: '#149700',
	},
}

const answerEdgeStyle = {
	type: 'smoothstep',
	style: {
		strokeWidth: 3,
		stroke: '#538ff6',
	},
	markerEnd: {
		type: MarkerType.ArrowClosed,
		width: 16,
		height: 16,
		color: '#538ff6',
	},
}

const questionEdgeStyle2 = {
	type: 'smoothstep',
	style: {
		strokeWidth: 3,
		stroke: '#f706ff',
	},
	markerEnd: {
		type: MarkerType.ArrowClosed,
		width: 16,
		height: 16,
		color: '#f706ff',
	},
}

const answerEdgeStyle2 = {
	type: 'smoothstep',
	style: {
		strokeWidth: 3,
		stroke: '#ff9900',
	},
	markerEnd: {
		type: MarkerType.ArrowClosed,
		width: 16,
		height: 16,
		color: '#ff9900',
	},
}

// First, try to answer it using this PDF content: https://franklintempletonprod.widen.net/content/vbmrytwpcs/pdf/fixed-income-views-1q24-victory-lap-u.pdf.
// If you can't find the answer there, then use your general knowledge and Google search to provide a complete response.
// if possible create a table for the answer and include a random funny image
const prompt = `
You are an expert chatbot in all subjects. Please answer the following question in less than 900 characters unless it starts with "describe" or "Describe". Never repeat the question. Take the previous context into account and if you are missing a value, refer to the previous message response.


Question: 
`

export const ReactFlowAutoLayout: React.FC = () => {
	const {fitView} = useReactFlow()
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

	const [isLoading, setIsLoading] = useState(false)
	const [openSnackBar, setOpenSnackBar] = useState(false)
	const [open, setOpen] = useState(false)
	const [isSelectable, setIsSelectable] = useState(false)
	const [question, setQuestion] = useState('')
	const [selectedNode, setSelectedNode] = useState<NodeWithData>()

	const [selectedLayout, setSelectedLayout] = useState({
		'elk.algorithm': 'layered',
		'elk.direction': 'DOWN',
	})

	const {getLayoutedElements} = useLayoutedElements()
	const initialFitDone = useRef(false)
	useEffect(() => {
		if (!initialFitDone.current) {
			const timeout = setTimeout(() => {
				// getLayoutedElements({
				// 	'elk.algorithm': 'layered',
				// 	'elk.direction': 'DOWN',
				// })
				// fitView()
				reLayout()
				initialFitDone.current = true
			}, 200) // Adjust the delay as needed
			return () => clearTimeout(timeout)
		}
	}, [nodes, fitView])

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
						data: {message, content: message.content, nodeType, isSelected: false},
						position: {x: 100 * index, y: 100 + 50 * newNodes.length},
					}
					newNodes.push(messageNode)

					if (index === 0) return
					if (message.parentId) {
						nodeType === 'question'
							? newEdges.push({
									id: `edge-${conversation.id}-${message.id}`,
									source: `msg-${message.parentId}`,
									target: messageNode.id,
									...questionEdgeStyle,
							  })
							: newEdges.push({
									id: `edge-${conversation.id}-${message.id}`,
									source: `msg-${message.parentId}`,
									target: messageNode.id,
									...answerEdgeStyle,
							  })
					}
				})
			})

			setNodes(newNodes)
			setEdges(newEdges)
		}

		fetchData()
	}, [setEdges, setNodes])

	useEffect(() => {
		setNodes(nds =>
			nds.map(node => ({
				...node,
				data: {
					...node.data,
					isSelectable,
				},
			})),
		)
	}, [isSelectable])

	useEffect(() => {
		reLayout()
	}, [edges])

	// todo: make it the user choice
	const reLayout = () => {
		getLayoutedElements(selectedLayout)
		fitView()
	}

	const handleCheckboxChange = (id: string, isSelected: boolean) => {
		setNodes(nds =>
			nds.map(node =>
				node.id === id
					? {
							...node,
							data: {
								...node.data,
								isSelected,
							},
					  }
					: node,
			),
		)
	}

	const handleCloseSnackbar = () => {
		setOpenSnackBar(false)
	}

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
				//image: data.image,
				nodeType: isQuestion ? 'question' : 'answer',
				isSelected: false,
			},
			position,
		}
		setNodes(nds => [...nds, newNode])
		return newNode
	}

	const updateNode = (
		id: string,
		newData: Partial<MarkdownNodeDataProps>,
		newPosition?: {x: number; y: number},
	): void => {
		setNodes(nds =>
			nds.map(node =>
				node.id === id
					? {
							...node,
							data: {...node.data, ...newData},
							position: newPosition ? newPosition : node.position,
					  }
					: node,
			),
		)
	}

	const linkNodes = (
		{id: source}: NodeProps<MarkdownNodeDataProps>,
		{id: target}: NodeWithData,
	) => {
		const newEdge: Edge = {
			id: uuidv4(),
			source,
			target,
			...answerEdgeStyle,
		}
		setEdges(eds => [...eds, newEdge])
	}

	const handleEditSubmit = async (
		node: NodeProps<MarkdownNodeDataProps>,
		questionContent: string,
	) => {
		try {
			setIsLoading(true)
			// Update the current node's content
			updateNode(node.id, {
				content: questionContent,
				message: {
					...node.data.message,
					content: questionContent,
				},
			})
			// Step 1: Identify child nodes
			const childNodes = edges
				.filter(edge => edge.source === node.id)
				.map(edge => edge.target)

			// Step 2: Fetch new answer from ChatGPT

			const {answer, image} = await fetchOpenAIResponse([
				{role: 'user', content: prompt + questionContent},
			])

			//console.log('are we here: 1')

			// Step 3: Update child nodes
			for (const childNodeId of childNodes) {
				const childNode = nodes.find(n => n.id === childNodeId)
				if (childNode && childNode.data.message.id) {
					// Update the content of the child node
					await updateMessage(childNode.data.message.id, answer, 'assistant')
					updateNode(childNode.id, {
						content: answer,
						message: {
							...childNode.data.message,
							content: answer,
							//image,
						},
					})
				}
			}
		} catch (error) {
			console.error('Error in handleEditSubmit:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleSubmitQuestion = async (
		node: NodeProps<MarkdownNodeDataProps>,
		questionContent: string,
	) => {
		setIsLoading(true)
		try {
			const newPosition = calculateNodePosition(node)
			let convId = node?.data?.message?.conversationId!
			let messageContext: GptMessage[] = []

			updateNode(node.id, {
				...node.data,
				content: questionContent,
				message: {
					...node.data.message,
					content: questionContent,
				},
			})

			// Create a new conversation if user clicked on the canvas
			if (!convId) {
				convId = (await createConversation(questionContent)).id
			}

			const hasParent = node?.data?.message?.parentId

			const newQuestion = await createMessage(
				questionContent,
				'user',
				convId,
				hasParent ? hasParent : node?.data?.message?.id,
			)

			console.log('----------hasParent: ', hasParent)
			console.log('----------newQuestion.id: ', newQuestion?.id)
			console.log('----------node?.data: ', node?.data)
			//  && node?.data?.message?.id
			if (hasParent && newQuestion?.id) {
				console.log('are we here 4444')
				messageContext = (await getParentMessages(newQuestion.id))
					.reverse()
					.map<GptMessage>(({role, content}) => ({
						role: role as GptMessage['role'],
						content,
					}))
			}

			messageContext.push({role: 'user', content: questionContent})

			console.log('handle submit question: ', messageContext)

			messageContext[messageContext.length - 1].content =
				prompt + messageContext[messageContext.length - 1].content

			const {answer} = await fetchOpenAIResponse(messageContext)

			// const {answer, image} = await fetchOpenAIResponse([
			// 	{role: 'user', content: prompt + questionContent},
			// ])

			//console.log('are we here: 2')
			const newAnswer = await createMessage(
				answer,
				'assistant',
				convId,
				//image,
				newQuestion.id,
			)

			const answerNode = addNode(newAnswer, {x: newPosition.x + 200, y: newPosition.y}, false)

			linkNodes(node, answerNode)
		} catch (error: any) {
			console.error(error.message, error)
		} finally {
			setIsLoading(false)
		}

		handleClose()
	}

	const handleNodeRefresh = async (node: NodeProps<MarkdownNodeDataProps>) => {
		setIsLoading(true)
		try {
			if (node?.data?.message?.content) {
				console.log('handle node refresh: ', node?.data?.message?.content)
				const [answer] = await Promise.all([
					fetchOpenAIResponse([
						{role: 'user', content: prompt + node?.data?.message?.content},
					]),
				])
				//console.log('are we here: 3')
				if (node?.data?.message?.id) {
					updateMessage(node?.data?.message?.id, answer, 'assistant')
				}
				updateNode(node.id, {
					...node.data,
					content: answer,
					message: {
						...node.data.message,
						content: answer,
					},
				})
			}
		} catch (error: any) {
			console.error(error.message, error)
		} finally {
			setIsLoading(false)
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

			if (node?.data?.message?.id) {
				await deleteMessageWithChildren(node?.data?.message?.id)
			}

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

	const addQuestionNode = (node?: NodeProps<MarkdownNodeDataProps>) => {
		const newNodeID = uuidv4()
		const position = node
			? {x: node.xPos + 200, y: node.yPos + 100}
			: {x: Math.random() * 400, y: Math.random() * 400} // Adjust position if no node is passed

		const newNode: NodeWithData = {
			id: newNodeID,
			type: 'markdownNode',
			data: {
				content: '',
				nodeType: 'question',
				message: node
					? {
							parentId: node?.data?.message?.id,
							conversationId: node?.data?.message?.conversationId,
					  }
					: {parentId: undefined, conversationId: undefined}, // Adjust data if no node is passed
				isSelected: false,
			},
			position,
		}

		setNodes(nds => nds.concat(newNode))
		if (node) {
			console.log('d node d: ', node)
			setEdges(eds =>
				eds.concat({
					id: uuidv4(),
					source: node.id,
					target: newNode.id,
					...questionEdgeStyle,
					//...(node.data.nodeType === 'question' ? answerEdgeStyle : questionEdgeStyle),
				}),
			)
		}
	}

	const sxStyles = {
		globalIcons: {
			width: '100vw',
			position: 'absolute',
			bottom: 10,
			display: 'flex',
			justifyContent: 'center',
		},
		btn: {
			width: '50px',
			color: '#000000',
			margin: '10px',
			backgroundColor: 'rgba(0,0,0,0.1)',
			'&:hover': {
				backgroundColor: 'rgba(0,0,0,0.2)',
			},
		},
	}

	const deleteAllNodes = async () => {
		try {
			// Extract all node IDs that need to be deleted from the database
			const nodeIds = nodes
				.map(node => node.data.message.id)
				.filter(id => id !== undefined) as number[]

			// Delete nodes from the database
			await Promise.all(nodeIds.map(id => deleteMessageWithChildren(id)))

			// Clear nodes and edges from the state
			setNodes([])
			setEdges([])
			setOpen(false)
		} catch (error: any) {
			console.error('Error deleting nodes:', error.message, error)
		}
	}

	const createStringFromSelectedNodes = () => {
		const selectedNodesContent = nodes
			.filter(node => node.data.isSelected)
			.map(node => {
				const nodeType = node.data.nodeType === 'question' ? 'question' : 'answer'
				return `${nodeType}: ${node.data.content}`
			})
			.join('\n')

		navigator.clipboard
			.writeText(selectedNodesContent)
			.then(() => {
				console.log('Content copied to clipboard')
			})
			.catch(err => {
				console.error('Failed to copy: ', err)
			})
		setOpenSnackBar(true)
		setTimeout(() => {
			setOpenSnackBar(false)
		}, 3000)
		setIsSelectable(!isSelectable)
	}

	return (
		<>
			{isLoading && (
				<Box
					sx={{
						margin: -1,
						width: '100%',
						height: '100%',
						position: 'absolute',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						zIndex: 1000,
						backgroundColor: 'rgba(0,0,0,0.1)',
					}}
				>
					<CircularProgress />
				</Box>
			)}
			<Box sx={{flexGrow: 1}}>
				<ReactFlow
					proOptions={proOptions}
					nodes={nodes}
					onNodesChange={onNodesChange}
					edges={edges}
					onEdgesChange={onEdgesChange}
					nodeTypes={React.useMemo(() => {
						return {
							markdownNode: props => (
								<MarkdownNode
									{...props}
									data={props.data}
									onEdit={handleEditNode}
									onAddQuestion={addQuestionNode}
									onDelete={handleDeleteNode}
									submitQuestion={handleSubmitQuestion}
									onRefresh={handleNodeRefresh}
									isSelectable={isSelectable}
									onCheckboxChange={handleCheckboxChange} // Add this line
									submitEdit={handleEditSubmit}
								/>
							),
						}
					}, [])}
					//fitView
					fitView={false}
					zoomOnDoubleClick={false}
				>
					<MiniMap
						nodeStrokeWidth={3}
						zoomable
						pannable
						ariaLabel="Mini Map"
						nodeStrokeColor={node => {
							if (node.data.nodeType === 'question') return '#255fc5'
							if (node.data.nodeType !== 'question') return '#0e8f6d'
							return 'green'
						}}
						nodeColor={node => {
							if (node.data.nodeType === 'question') return '#89b4fe'
							if (node.data.nodeType !== 'question') return '#54fbce'
							return 'blue'
						}}
					/>
					<Controls />
					<Background />
					<Panel position="top-right">
						<ButtonGroup
							variant="contained"
							aria-label="Basic button group"
							size="small"
							color="secondary"
							sx={{
								'&  button': {
									// backgroundColor: '#ffffff',
									// color: '#5e5e5e',
									// borderColor: '#c5c5c5 !important',

									paddingTop: '6px',
								},
								'&  button:hover': {
									backgroundColor: '#aeaeae',
									color: '#252525',
									borderColor: '#c5c5c5 !important',
								},
							}}
						>
							<Button
								onClick={() => {
									getLayoutedElements({
										'elk.algorithm': 'layered',
										'elk.direction': 'DOWN',
									})
									setSelectedLayout({
										'elk.algorithm': 'layered',
										'elk.direction': 'DOWN',
									})
								}}
							>
								vertical
							</Button>
							<Button
								onClick={() => {
									getLayoutedElements({
										'elk.algorithm': 'layered',
										'elk.direction': 'RIGHT',
										'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
									})
									setSelectedLayout({
										'elk.algorithm': 'layered',
										'elk.direction': 'RIGHT',
									})
								}}
							>
								horizontal
							</Button>
							<Button
								onClick={() => {
									getLayoutedElements({
										'elk.algorithm': 'org.eclipse.elk.force',
									})
									setSelectedLayout({
										'elk.algorithm': 'org.eclipse.elk.force',
										'elk.direction': 'RIGHT',
									})
								}}
							>
								force
							</Button>
						</ButtonGroup>
					</Panel>
					<Panel position="bottom-center">
						<ButtonGroup
							variant="contained"
							aria-label="Basic button group"
							color="primary"
							size="small"
							sx={{
								'&  button': {
									// backgroundColor: '#ffffff',
									// color: '#5e5e5e',
									// borderColor: '#c5c5c5 !important',

									paddingTop: '6px',
								},
								'&  button:hover': {
									backgroundColor: '#aeaeae',
									color: '#252525',
									borderColor: '#c5c5c5 !important',
								},
							}}
						>
							<Button onClick={() => addQuestionNode()}>
								<FiPlus size={24} />
							</Button>
							<Button onClick={() => setOpen(true)}>
								<FiTrash2 size={24} />
							</Button>
							{isSelectable ? (
								<Button onClick={createStringFromSelectedNodes}>
									<FiCopy size={24} />
								</Button>
							) : (
								<Button>
									<BiSelectMultiple
										onClick={() => setIsSelectable(!isSelectable)}
										size={24}
									/>
								</Button>
							)}
						</ButtonGroup>
					</Panel>
				</ReactFlow>

				<Dialog open={open} onClose={handleClose}>
					<DialogTitle>Delete record</DialogTitle>
					<DialogContent>
						<Typography variant="body1" paragraph>
							Are you sure you want to delete all nodes?
						</Typography>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleClose}>Cancel</Button>
						<Button onClick={deleteAllNodes}>Delete</Button>
					</DialogActions>
				</Dialog>
				<Snackbar
					anchorOrigin={{vertical: 'top', horizontal: 'center'}}
					open={openSnackBar}
					onClose={handleCloseSnackbar}
					message="Text copied to clipboard"
					key={'top' + 'center'}
				/>
			</Box>
		</>
	)
}

export const ReactFlowWrapper = () => {
	return (
		<ReactFlowProvider>
			<ReactFlowAutoLayout />
		</ReactFlowProvider>
	)
}
