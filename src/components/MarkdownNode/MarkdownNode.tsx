import React, {useState} from 'react'
import {Handle, Position} from 'reactflow'
import {FiEdit, FiCopy, FiTrash2} from 'react-icons/fi'
import styles from './MarkdownNode.module.css'
import {MarkdownViewer} from '../markdown/MDPreview'

export type MarkdownNodeProps = {
	id: string
	data: {content: string; nodeType: 'answer' | 'question'}
}

export const MarkdownNode = ({id, data}: MarkdownNodeProps) => {
	const [isHovered, setIsHovered] = useState(false)
	const [isEditable, setIsEditable] = useState(false)

	const nodeStyle = data.nodeType === 'question' ? styles.questionNode : styles.answerNode

	const handleEditClick = () => {
		setIsEditable(true)
	}

	const handleCopyClick = () => {
		// Implement the copy logic here
		console.log('Copy node', id)
	}

	const handleDeleteClick = () => {
		// Implement the delete logic here
		console.log('Delete node', id)
	}

	return (
		<div
			className={`${styles.markdownNode} ${nodeStyle}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className={styles.markdownNodeContent}>
				{isEditable ? (
					<textarea defaultValue={data.content} />
				) : (
					<MarkdownViewer value={data.content} />
				)}
			</div>
			{isHovered && (
				<div className={styles.markdownNodeActions}>
					<FiEdit onClick={handleEditClick} />
					<FiCopy onClick={handleCopyClick} />
					<FiTrash2 onClick={handleDeleteClick} />
				</div>
			)}
			<Handle type="source" position={Position.Top} />
			<Handle type="target" position={Position.Bottom} />
		</div>
	)
}

export const MarkdownNodeType = {markdownNode: MarkdownNode}
