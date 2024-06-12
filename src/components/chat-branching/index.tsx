'use client'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import ReactFlow, {
	MarkerType,
	ReactFlowProvider,
	useReactFlow,
	useNodesState,
	useEdgesState,
	Background,
	Controls,
	MiniMap,
	BackgroundVariant,
	Edge,
	Node,
	Panel,
	NodeMouseHandler,
	NodeProps,
} from 'reactflow'
import {v4 as uuidv4} from 'uuid'
import {
	createMessage,
	deleteMessageWithChildren,
	getParentMessages,
	updateMessage,
} from '@/dbm/message.dbm'

import {fetchOpenAIResponse, GptMessage} from '@/utils/openai'

import 'reactflow/dist/style.css'
import {initialEdges, initialNodes} from './initialElements'
import QuestionNode from './questionNode'
import AnswerNode from './answerNode'
import {createConversation} from '@/dbm/conversation.dbm'
import {Box, Button, ButtonGroup} from '@mui/material'

import Dagre from '@dagrejs/dagre'
import ELK from 'elkjs/lib/elk.bundled.js'
import useExpandCollapse from './useExpandCollapse'
import useAnimatedNodes from './useAnimatedNodes'

const elk = new ELK()

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

const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

const getLayoutedElements2 = (nodes: Node[], edges: Edge[], options: {direction: any}) => {
	g.setGraph({rankdir: options.direction})

	edges.forEach((edge: Edge) => g.setEdge(edge.source, edge.target))
	// nodes.forEach((node: Node) => g.setNode(node.id, node))

	nodes.forEach((node: Node) => {
		g.setNode(node.id, {
			...node,
			label: node.data?.label || node.id, // Ensure label is always a string
			width: node.width ?? 0, // Ensure width is always a number
			height: node.height ?? 0, // Ensure height is always a number
		})
	})

	Dagre.layout(g)

	return {
		nodes: nodes.map(node => {
			const position = g.node(node.id)
			// We are shifting the dagre node position (anchor=center center) to the top left
			// so it matches the React Flow node anchor point (top left).
			const x = position.x - (node?.width || 0) / 2
			const y = position.y - (node?.height || 0) / 2

			return {...node, position: {x, y}}
		}),
		edges,
	}
}

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

function ReactFlowAutoLayout() {
	const [isLoading, setIsLoading] = useState(false)

	const {fitView} = useReactFlow()

	const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(initialEdges)

	const initialFitDone = useRef(false)

	const {getLayoutedElements} = useLayoutedElements()

	useEffect(() => {
		if (!initialFitDone.current) {
			const timeout = setTimeout(() => {
				getLayoutedElements({
					'elk.algorithm': 'layered',
					'elk.direction': 'DOWN',
				})
				fitView()
				initialFitDone.current = true
			}, 100) // Adjust the delay as needed
			return () => clearTimeout(timeout)
		}
	}, [nodes, fitView])

	// ---------------------
	const addNewQuestion = (node: NodeProps) => {
		console.log('node: ', node)
		const newNodeID = uuidv4()
		const position = node
			? {x: node.xPos + 250, y: node.yPos + 250}
			: {x: Math.random() * 400, y: Math.random() * 400} // Adjust position if no node is passed

		const newNode: Node = {
			id: newNodeID,
			type: 'question',

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
			setEdges(eds =>
				eds.concat({
					id: uuidv4(),
					source: node.id,
					target: newNode.id,
					type: 'smoothstep',
				}),
			)
		}

		// initialIsEditable: true,
	}

	const onDeleteNode = async (node: NodeProps) => {
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

	const handleEditSubmit = async (node: Node, questionContent: string) => {
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
			const answer = await fetchOpenAIResponse([{role: 'user', content: questionContent}])

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
	// ======================

	const addNode = (
		data: {content: string; id: number},
		position: {x: number; y: number},
		isQuestion: boolean,
	) => {
		const newNode: Node = {
			id: uuidv4(),
			type: isQuestion ? 'question' : 'answer',
			data: {
				message: data,
				content: data.content,
				nodeType: isQuestion ? 'question' : 'answer',
				isSelected: false,
			},
			position,
		}
		setNodes(nds => [...nds, newNode])
		return newNode
	}
	const updateNode = (id: string, newData: any, newPosition?: {x: number; y: number}): void => {
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
	const linkNodes = ({id: source}: NodeProps, {id: target}: Node) => {
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
	// ----------------------
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

	const onSubmitQuestion = async (node: NodeProps, question: string) => {
		setIsLoading(true)

		try {
			let convId = node?.data?.message?.conversationId!
			if (!convId) {
				convId = (await createConversation(question)).id
			}
			const hasParent = node?.data?.message?.parentId

			// create message in db
			const newQuestion = await createMessage(
				question,
				'user',
				convId,
				hasParent ? hasParent : node?.data?.message?.id,
			)

			// fetch answer from open ai
			const answer = await fetchOpenAIResponse([{role: 'user', content: question}])

			const newAnswer = await createMessage(answer, 'assistant', convId, newQuestion.id)

			updateNode(node.id, {
				...node.data,
				content: question,
				message: {
					...node.data.message,
					content: question,
				},
			})
			const newPosition = calculateNodePosition(node)
			const answerNode = addNode(newAnswer, {x: newPosition.x + 200, y: newPosition.y}, false)
			linkNodes(node, answerNode)
			getLayoutedElements({
				'elk.algorithm': 'layered',
				'elk.direction': 'DOWN',
			})
			fitView()
		} catch (error: any) {
			console.error(error.message, error)
		} finally {
			setIsLoading(false)
		}

		// handleClose()
	}

	return (
		<Box sx={{backgroundColor: '#e3e3e3', width: '100%', height: '100%'}}>
			<ReactFlow
				nodes={nodes}
				onNodesChange={onNodesChange}
				edges={edges}
				onEdgesChange={onEdgesChange}
				nodeTypes={useMemo(
					() => ({
						question: props => (
							<QuestionNode
								//data={props.data}
								label={props.data.label}
								//selected={props.data.selected}
								initialIsEditable={!props.data.label}
								node={props}
								//isEditable={true}
								onSubmitQuestion={onSubmitQuestion}
								onDelete={onDeleteNode}
								{...props}
							/>
						),
						answer: props => (
							<AnswerNode
								// data={props.data}
								label={props.data.content || props.data.label}
								//selected={props.data.selected}
								onNewQuestion={addNewQuestion}
								// node={props.data.node}
								node={props}
								onRefresh={() => console.log('fredi')}
								onDelete={onDeleteNode}
								{...props}
							/>
						),
					}),
					[],
				)}
				fitView={false}
				zoomOnDoubleClick={false} // Prevent zooming on double click
				//onNodeClick={onNodeClick}
				proOptions={proOptions}
				// nodesDraggable={false}
				// nodesConnectable={false}
				// elementsSelectable={false}
			>
				{/* <Background id="1" gap={10} color="#b0b0b0" variant={BackgroundVariant.Dots} /> 
				
				d8d8d8
				*/}
				<Background id="1" gap={10} color="#888888" variant={BackgroundVariant.Dots} />
				{/* <Background id="2" gap={100} color="#ccc" variant={BackgroundVariant.Lines} /> */}
				<Controls />
				<Panel position="top-right">
					{/* <button onClick={() => onLayout('TB')}>vertical layout</button>
					<button onClick={() => onLayout('LR')}>horizontal layout</button>

					<Button>Vertical Layout</Button> */}

					<ButtonGroup
						variant="contained"
						aria-label="Basic button group"
						size="small"
						sx={{
							'&  button': {
								backgroundColor: '#ffffff',
								color: '#5e5e5e',
								borderColor: '#c5c5c5 !important',

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
							onClick={() =>
								getLayoutedElements({
									'elk.algorithm': 'layered',
									'elk.direction': 'DOWN',
								})
							}
						>
							vertical
						</Button>
						<Button
							onClick={() =>
								getLayoutedElements({
									'elk.algorithm': 'layered',
									'elk.direction': 'RIGHT',
								})
							}
						>
							horizontal
						</Button>
						<Button
							onClick={() =>
								getLayoutedElements({
									'elk.algorithm': 'org.eclipse.elk.radial',
								})
							}
						>
							radial
						</Button>
						<Button
							onClick={() =>
								getLayoutedElements({
									'elk.algorithm': 'org.eclipse.elk.force',
								})
							}
						>
							force
						</Button>
					</ButtonGroup>
				</Panel>
				<MiniMap
					nodeStrokeWidth={3}
					zoomable
					pannable
					ariaLabel="Mini Map"
					nodeStrokeColor={node => {
						if (node.type === 'question') return '#888888'
						if (node.type === 'answer') return '#060606'
						return '#eee'
					}}
					nodeColor={node => {
						if (node.type === 'question') return '#888888'
						if (node.type === 'answer') return '#ffffff'
						return '#fff'
					}}
				/>
			</ReactFlow>
		</Box>
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
