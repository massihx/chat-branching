import React, {useState} from 'react'
import {Handle, Position, Node as ReactFlowNode, NodeProps} from 'reactflow'
import {FiEdit, FiPlus, FiTrash2} from 'react-icons/fi'
import styles from './MarkdownNode.module.css'
import {MarkdownViewer} from '../markdown/MDPreview'

export interface MarkdownNodeData<T> {
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

	const nodeStyle = data.nodeType === 'question' ? styles.questionNode : styles.answerNode

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
					<FiEdit onClick={() => onEdit(node)} />
					<FiPlus onClick={() => onCopy(node)} />
					<FiTrash2 onClick={() => onDelete(node)} />
				</div>
			)}
			<Handle type="source" position={Position.Top} />
			<Handle type="target" position={Position.Bottom} />
		</div>
	)
}

export const MarkdownNodeType = {markdownNode: MarkdownNode}
