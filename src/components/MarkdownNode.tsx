import React, {useState} from 'react'
import {Handle, Position, Node as ReactFlowNode, NodeProps} from 'reactflow'
import {FiEdit, FiPlus, FiTrash2} from 'react-icons/fi'
import {MarkdownViewer} from './markdown/MDPreview'
import {Box} from '@mui/material'

interface MarkdownNodeData<T> {
	content: string
	message: T
	nodeType: 'answer' | 'question'
}

export interface MarkdownNodeProps<T> extends NodeProps {
	onEdit: (node: NodeProps<MarkdownNodeData<T>>) => void
	onCopy: (node: NodeProps<MarkdownNodeData<T>>) => void
	onDelete: (node: NodeProps<MarkdownNodeData<T>>) => void
}

export const MarkdownNode = <T,>({onEdit, onCopy, onDelete, ...node}: MarkdownNodeProps<T>) => {
	const {id, data} = node
	const [isHovered, setIsHovered] = useState(false)
	const [isEditable, setIsEditable] = useState(false)

	const sxStyles = {
		markdownNode: {
			position: 'relative',
			padding: '12px',
			borderRadius: '8px',
			boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
		},
		nodeStyle:
			data.nodeType === 'question'
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
			<Box sx={sxStyles.markdownNodeContent}>
				{isEditable ? (
					<textarea defaultValue={data.content} />
				) : (
					<MarkdownViewer value={data.content} />
				)}
			</Box>
			{isHovered && (
				<Box sx={sxStyles.markdownNodeActions}>
					<FiEdit onClick={() => onEdit(node)} />
					<FiPlus onClick={() => onCopy(node)} />
					<FiTrash2 onClick={() => onDelete(node)} />
				</Box>
			)}
			<Handle type="source" position={Position.Top} />
			<Handle type="target" position={Position.Bottom} />
		</Box>
	)
}

export const MarkdownNodeType = {markdownNode: MarkdownNode}
