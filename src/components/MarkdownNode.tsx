import React, {useState} from 'react'
import {Handle, Position, NodeProps, NodeResizeControl} from 'reactflow'
import {FiEdit, FiPlus, FiTrash2} from 'react-icons/fi'
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
	onExtend: (node: NodeProps<MarkdownNodeData<T>>) => void
	onDelete: (node: NodeProps<MarkdownNodeData<T>>) => void
}

export const MarkdownNode = <T,>({onEdit, onExtend, onDelete, ...node}: MarkdownNodeProps<T>) => {
	const {id, data} = node
	const [isHovered, setIsHovered] = useState(false)
	const [isEditable, setIsEditable] = useState(false)
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
			// minHeight: 30,
			'& textarea': {
				width: '100%',
				border: 'none',
				resize: 'none',
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

	return (
		<Box
			sx={{...sxStyles.markdownNode, ...sxStyles?.nodeStyle}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<NodeResizeControl minWidth={200} minHeight={100}>
				{/* <ResizeIcon /> */}
			</NodeResizeControl>
			<Box sx={sxStyles.markdownNodeContent}>
				{isEditable ? (
					<TextareaAutosize minRows={3} defaultValue={data.content} />
				) : (
					<MarkdownViewer value={data.content} />
				)}
			</Box>
			{isHovered && (
				<Box sx={sxStyles.markdownNodeActions}>
					{isQuestionNode ? (
						<>
							<FiTrash2 onClick={showConfirmDeleteDialog} />
						</>
					) : (
						<>
							<FiEdit onClick={() => onEdit(node)} />
							<FiPlus onClick={() => onExtend(node)} />
						</>
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
	)
}

export const MarkdownNodeType = {markdownNode: MarkdownNode}
