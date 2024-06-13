import React, {useEffect, useRef, useState} from 'react'
import {Handle, Position, NodeProps, NodeResizeControl, NodeResizer} from 'reactflow'
import {FiEdit, FiPlus, FiRefreshCcw, FiTrash2} from 'react-icons/fi'
import {Button, TextareaAutosize, Checkbox, Dialog, DialogActions, DialogTitle} from '@mui/material'

import {MarkdownViewer} from '../markdown/MDPreview'
import {Box} from '@mui/material'

export interface MarkdownNodeData<T> {
	content: string
	message: T
	image?: string
	nodeType: 'answer' | 'question'
	isSelected: boolean
}

export interface MarkdownNodeProps<T> extends NodeProps {
	onEdit: (node: NodeProps<MarkdownNodeData<T>>) => void
	onDelete: (node: NodeProps<MarkdownNodeData<T>>) => void
	onAddQuestion: (node: NodeProps<MarkdownNodeData<T>>) => void
	submitQuestion: (node: NodeProps<MarkdownNodeData<T>>, questionContent: string) => void
	submitEdit: (node: NodeProps<MarkdownNodeData<T>>, questionContent: string) => void
	onRefresh: (node: NodeProps<MarkdownNodeData<T>>) => void
	isSelectable: boolean
	onCheckboxChange: (id: string, isSelected: boolean) => void
}

export const MarkdownNode = <T,>({
	onEdit,
	onDelete,
	onAddQuestion,
	submitQuestion,
	onRefresh,
	isSelectable,
	onCheckboxChange,
	submitEdit,
	...node
}: MarkdownNodeProps<T>) => {
	// console.log('node: ', node)
	const {id, data} = node
	const [isHovered, setIsHovered] = useState(false)
	const [isEditable, setIsEditable] = useState(false)
	const [isTextarea, setIsTextarea] = useState(false)
	const [question, setQuestion] = useState('')
	const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)
	const [dimensions, setDimensions] = useState({width: 0, height: 0})
	const contentRef = useRef<HTMLDivElement>(null)

	const isQuestionNode = data.nodeType === 'question'

	const maxWidth = 200
	const maxHeight = 500

	useEffect(() => {
		if (contentRef.current) {
			const contentWidth = contentRef.current.scrollWidth + 20 // 20px for padding
			const contentHeight = contentRef.current.scrollHeight + 20 // 20px for padding
			setDimensions({
				width: Math.min(maxWidth, contentWidth),
				height: Math.min(maxHeight, contentHeight),
			})
		}
	}, [data.content])

	const handleResize = (width: number, height: number) => {
		setDimensions({width, height})
	}

	const showConfirmDeleteDialog = () => {
		setConfirmDeleteDialog(true)
	}

	const closeConfirmDeleteDialog = () => {
		setConfirmDeleteDialog(false)
	}

	const sxStyles = {
		markdownNode: {
			position: 'relative',
			display: 'flex',
			alignItems: 'start',
			padding: '12px',
			borderRadius: '8px',
			boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
			height: '100%',
			width: '100%',
			maxWidth: '800px',
			'& textarea': {
				width: '99%',
				height: '100%',
				border: 'none',
				resize: 'none',
				outline: 'none',
				minHeight: '30px',
				fontSize: '16px',
			},
		},
		nodeStyle: isQuestionNode
			? {
					background: '#e8f0fe',
					color: '#1a73e8',
					border: '1px solid #d2e3fc',
					'& svg': {
						cursor: 'pointer',
					},
			  }
			: {
					background: '#f1f3f4',
					color: '#202124',
					border: '1px solid #dadce0',
					'& svg': {
						color: '#202124',
					},
			  },
		markdownNodeContent: {
			padding: '7px',
		},
		markdownNodeActions: {
			position: 'absolute',
			top: '-20px',
			right: '-20px',
			display: 'flex',
			gap: '8px',
			background: 'rgba(255, 255, 255, 0.9)',
			borderRadius: '8px',
			padding: '5px',
			boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
			'& svg': {
				cursor: 'pointer',
			},
		},
		contentContainer: {
			overflow: 'auto',
			width: '100%',
			height: '100%',
			'&::-webkit-scrollbar': {
				width: '6px', // Adjust the width of the scrollbar
			},
			'&::-webkit-scrollbar-thumb': {
				backgroundColor: '#888', // Change the color of the scrollbar thumb
				borderRadius: '10px', // Round the corners of the scrollbar thumb
			},
			'&::-webkit-scrollbar-thumb:hover': {
				backgroundColor: '#555', // Change the color on hover
			},
			'&::-webkit-scrollbar-track': {
				backgroundColor: '#f1f1f1', // Change the background color of the scrollbar track
			},
		},
	}

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			submitQuestion(node, question)
			setIsTextarea(true)
			// Add your desired action here, such as submitting the content
		}
	}

	const handleEditKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			submitEdit(node, question)
			console.log('enter')
			setIsEditable(false)
			// Add your desired action here, such as submitting the content
		}
	}

	const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		onCheckboxChange(id, event.target.checked)
	}

	return (
		<>
			<Box
				sx={{
					...sxStyles.markdownNode,
					...sxStyles.nodeStyle,
					backgroundColor: isQuestionNode ? '#E8F0FE' : '#E6F4EA',
					borderRadius: '8px',

					// minWidth: '88px',
					minWidth: '220px',

					// width: `${dimensions.width}px`,
					minHeight: `${dimensions.height}px`,
				}}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* <NodeResizeControl minWidth={20} minHeight={20}></NodeResizeControl> */}
				<NodeResizer
					color="#0015ff"
					isVisible={node.selected}
					minWidth={20} // Minimum width to allow small content
					minHeight={20} // Minimum height to allow small content
					onResize={(event, {width, height}) => handleResize(width, height)}
					handleStyle={{
						width: '8px',
						height: '8px',
						//border: '1px solid #ea80ff',
						background: '#9b4bcd',
						zIndex: 1,
					}}
				/>
				{data?.isSelectable && (
					<Checkbox checked={data.isSelected} onChange={handleCheckboxChange} />
				)}
				<Box sx={sxStyles.contentContainer}>
					<Box sx={sxStyles.markdownNodeContent}>
						{isEditable ? (
							<TextareaAutosize
								onKeyDown={handleEditKeyDown}
								onChange={e => setQuestion(e.target.value)}
								minRows={1}
								defaultValue={data.content}
							/>
						) : !data.content && data.nodeType === 'question' ? (
							<TextareaAutosize
								onKeyDown={handleKeyDown}
								onChange={e => setQuestion(e.target.value)}
								minRows={1}
								defaultValue={data.content}
							/>
						) : (
							<MarkdownViewer value={data.content || question} />
						)}
						{/* {data?.image && (
							<Box sx={{mt: '20px'}}>
								<img src={data.image} alt="image" />
							</Box>
						)} */}
					</Box>
					{isHovered && (
						<Box sx={sxStyles.markdownNodeActions}>
							{data.nodeType !== 'question' ? (
								<>
									<FiPlus onClick={() => onAddQuestion(node)} />
									{/* <FiRefreshCcw onClick={() => onRefresh(node)} />
									<FiTrash2 onClick={() => onDelete(node)} /> */}
								</>
							) : (
								<>
									{/* <FiPlus onClick={() => onAddQuestion(node)} /> */}
									{/* <FiEdit onClick={() => setIsEditable(true)} /> */}
									<FiTrash2 onClick={() => onDelete(node)} />
								</>
							)}
						</Box>
					)}
					{isQuestionNode ? (
						<>
							<Handle type="target" position={Position.Top} />
							<Handle type="source" position={Position.Bottom} />
							{/* <Handle type="target" position={Position.Left} />
							<Handle type="source" position={Position.Right} /> */}
						</>
					) : (
						<>
							<Handle type="target" position={Position.Top} />
							<Handle type="source" position={Position.Bottom} />
							{/* <Handle type="target" position={Position.Left} />
							<Handle type="source" position={Position.Right} /> */}
						</>
					)}
				</Box>
				<Dialog open={confirmDeleteDialog} onClose={closeConfirmDeleteDialog}>
					<DialogTitle>Are you sure to delete this conversation?</DialogTitle>
					<DialogActions>
						<Button onClick={closeConfirmDeleteDialog}>No</Button>
						<Button
							onClick={() => {
								onDelete(node)
								closeConfirmDeleteDialog()
							}}
						>
							Yes
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
		</>
	)
}

export const MarkdownNodeType = {markdownNode: MarkdownNode}
