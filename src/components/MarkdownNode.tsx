import React, {useEffect, useState} from 'react'
import {Handle, Position, NodeProps, NodeResizeControl} from 'reactflow'
import {FiEdit, FiPlus, FiRefreshCcw, FiTrash2} from 'react-icons/fi'
import {Button, Dialog, DialogActions, DialogTitle} from '@mui/material'

import {MarkdownViewer} from './markdown/MDPreview'
import {Box, TextareaAutosize} from '@mui/material'

export interface MarkdownNodeData<T> {
	content: string
	message: T
	nodeType: 'answer' | 'question'
}

export interface MarkdownNodeProps<T> extends NodeProps {
	onEdit: (node: NodeProps<MarkdownNodeData<T>>) => void
	onDelete: (node: NodeProps<MarkdownNodeData<T>>) => void
	onAddQuestion: (node: NodeProps<MarkdownNodeData<T>>) => void
	submitQuestion: (node: NodeProps<MarkdownNodeData<T>>, questionContent: string) => void
	onRefresh: (node: NodeProps<MarkdownNodeData<T>>) => void
}

export const MarkdownNode = <T,>({
	onEdit,
	onDelete,
	onAddQuestion,
	submitQuestion,
	onRefresh,
	...node
}: MarkdownNodeProps<T>) => {
	const {id, data} = node
	const [isHovered, setIsHovered] = useState(false)
	const [isEditable, setIsEditable] = useState(false)
	const [isTextarea, setIsTextarea] = useState(false)
	const [question, setQuestion] = useState('')
	const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)

	const isQuestionNode = data.nodeType === 'question'

	const showConfirmDeleteDialog = () => {
		setConfirmDeleteDialog(true)
	}

	const closeConfirmDeleteDialog = () => {
		setConfirmDeleteDialog(false)
	}

	const sxStyles = {
		markdownNode: {
			position: 'relative',
			padding: '12px',
			borderRadius: '8px',
			boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
			minWidth: 200,
			maxWidth: 800,
			'& textarea': {
				width: '100%',
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
			padding: '5px',
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
	}

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			console.log('Enter key pressed!')
			submitQuestion(node, question)
			setIsTextarea(true)
			// Add your desired action here, such as submitting the content
		}
	}

	// useEffect(() => {
	// 	console.log({node})
	// }, [node])

	return (
		<>
			<Box
				sx={{...sxStyles.markdownNode, ...sxStyles?.nodeStyle}}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* {console.log({data: data.content})} */}
				<NodeResizeControl minWidth={200} minHeight={100}>
					{/* <ResizeIcon /> */}
				</NodeResizeControl>
				<Box sx={sxStyles.markdownNodeContent}>
					{isEditable ? (
						<TextareaAutosize minRows={3} defaultValue={data.content} />
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
				</Box>
				{isHovered && (
					<Box sx={sxStyles.markdownNodeActions}>
						<FiEdit onClick={() => setIsEditable(true)} />
						<FiPlus onClick={() => onAddQuestion(node)} />
						<FiTrash2 onClick={() => onDelete(node)} />
						{data.nodeType !== 'question' && (
							<FiRefreshCcw onClick={() => onRefresh(node)} />
						)}
					</Box>
				)}
				<Handle type="source" position={Position.Top} />
				<Handle type="target" position={Position.Bottom} />
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
