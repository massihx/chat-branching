'use client'
import React, {useState, useEffect, useRef} from 'react'

import {
	Box,
	TextareaAutosize,
	Checkbox,
	Dialog,
	DialogActions,
	DialogTitle,
	Typography,
	Button,
} from '@mui/material'

import {Handle, Position, Node, NodeProps} from 'reactflow'
import {NodeResizer} from '@reactflow/node-resizer'
import '@reactflow/node-resizer/dist/style.css'
import {MarkdownViewer} from '../markdown/MDPreview'

import RefreshIcon from '@mui/icons-material/Refresh'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'

interface AnswerNodeProps {
	// } extends Node {

	label: string
	selected: boolean
	node: NodeProps
	onNewQuestion: (node: Node) => void
	onRefresh: (node: Node) => Promise<void>
	onDelete: (node: Node) => Promise<void>
}

const AnswerNode: React.FC<AnswerNodeProps> = ({
	label,
	selected,
	node,
	onNewQuestion,
	onRefresh,
	onDelete,
}) => {
	console.log('pre node: ', node)
	const maxWidth = 200
	const maxHeight = 200

	const [isHovered, setIsHovered] = useState(true)

	const [dimensions, setDimensions] = useState({width: 0, height: 0})
	const contentRef = useRef<HTMLDivElement>(null)

	const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)

	useEffect(() => {
		if (contentRef.current) {
			const contentWidth = contentRef.current.scrollWidth + 20 // 20px for padding
			const contentHeight = contentRef.current.scrollHeight + 20 // 20px for padding
			setDimensions({
				width: Math.min(maxWidth, contentWidth),
				height: Math.min(maxHeight, contentHeight),
			})
		}
	}, [label])

	const handleResize = (width: number, height: number) => {
		setDimensions({width, height})
	}

	const showConfirmDeleteDialog = () => {
		setConfirmDeleteDialog(true)
	}

	const closeConfirmDeleteDialog = () => {
		setConfirmDeleteDialog(false)
	}

	return (
		<Box
			sx={{
				position: 'relative',
				borderRadius: '8px',
				backgroundColor: '#ffffff',
				p: '0 0px 4px',
				//border: '1px solid #eaeaea',

				// backgroundColor: '#E6F4EA',
				// border: '1px solid #5ab873',
				width: `${dimensions.width}px`,
				height: `${dimensions.height}px`,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				minWidth: '220px',
				//fontSize: '12px',
				//minWidth: '100px',
				//minHeight: '30px',
				//overflow: 'hidden',
			}}
			onWheel={e => e.stopPropagation()} // This stops the mouse wheel from scrolling
		>
			<NodeResizer
				color="#0015ff"
				isVisible={selected}
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
			<Handle type="source" position={Position.Top} />
			<Handle type="target" position={Position.Top} />
			<Box
				ref={contentRef}
				sx={{
					m: '3px 4px',
					//border: '2px solid yellow',
					flex: 1,
					overflowY: 'auto', // Enable vertical scrolling only if necessary
					padding: '4px 6px',
					boxSizing: 'border-box',
					minWidth: '100px',
					'&::-webkit-scrollbar': {
						width: '4px',
						height: '4px',
					},
					'&::-webkit-scrollbar-thumb': {
						background: '#888',
						borderRadius: '0px',
					},
					'&::-webkit-scrollbar-thumb:hover': {
						background: '#555',
					},
				}}
			>
				{/* <Typography
					sx={{
						//border: '2px solid green',

						//fontSize: '.6rem',
						fontSize: '10px',
					}}
				>
					Answer: {data?.label}
				</Typography> */}
				{/* data.content || */}
				{/* {label} */}
				<MarkdownViewer value={label} />
				{isHovered && (
					<Box
						sx={{
							position: 'absolute',
							// top: '-20px',
							// right: '-20px',

							top: '-10px',
							right: '12px',

							fontSize: '12px',

							display: 'flex',
							gap: '8px',
							background: '#c0c0c0',
							//border: '1px solid #858585',
							//borderRadius: '8px',
							//padding: '5px',
							//boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',

							p: '2px 4px',
							'& svg': {
								cursor: 'pointer',
							},
						}}
					>
						<>
							<ContactSupportIcon
								onClick={() => onNewQuestion(node)}
								sx={{
									fontSize: '12px',
									color: '#333',
									'&:hover': {
										color: '#ff8282',
									},
								}}
							/>
							<RefreshIcon
								onClick={() => onRefresh(node)}
								sx={{
									fontSize: '12px',
									color: '#333',
									'&:hover': {
										color: '#1a881a',
									},
								}}
							/>
						</>
					</Box>
				)}
			</Box>
			<Handle type="source" position={Position.Bottom} />
			<Handle type="target" position={Position.Bottom} />
			<Handle type="source" position={Position.Left} />
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />
			<Handle type="target" position={Position.Right} />

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

export default AnswerNode
