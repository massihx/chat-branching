'use client'
import {
	TextareaAutosize,
	Typography,
	Dialog,
	DialogActions,
	DialogTitle,
	Button,
	Box,
	Input,
	TextField,
} from '@mui/material'
import React, {useState} from 'react'
import {Handle, Position, NodeProps} from 'reactflow'
import {Node} from 'reactflow'
import QuestionIcon from '@mui/icons-material/ContactSupport'
import DeleteIcon from '@mui/icons-material/Delete'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import EditIcon from '@mui/icons-material/Edit'
import EditOffIcon from '@mui/icons-material/EditOff'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

export interface QuestionNodeProps {
	label: string
	//isEditable: boolean
	node: NodeProps
	onDelete: (node: NodeProps) => Promise<void>
	onSubmitQuestion: (node: NodeProps, question: string) => void
	initialIsEditable: boolean
}

const QuestionNode: React.FC<QuestionNodeProps> = ({
	label,
	node,
	onSubmitQuestion,
	onDelete,
	initialIsEditable,
}) => {
	const [question, setQuestion] = useState('')
	const [isHovered, setIsHovered] = useState(true)
	const [isEditable, setIsEditable] = useState(initialIsEditable)
	const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)

	const showConfirmDeleteDialog = () => {
		setConfirmDeleteDialog(true)
	}

	const closeConfirmDeleteDialog = () => {
		setConfirmDeleteDialog(false)
	}

	const handleEditKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		// Use a type assertion to narrow down the event target type
		//const target = event.target as HTMLTextAreaElement

		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			onSubmitQuestion(node, question)
			setQuestion(question)
			console.log('enter')
			setIsEditable(false)
		} else if (event.key === 'Escape') {
			// Handle the Escape key press
			console.log('Escape key pressed')
		}
	}

	return (
		<Box
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			sx={{
				// padding: '10px',
				padding: '6px 12px',
				// backgroundColor: '#E8F0FE',
				// border: '1px solid #8ebefc',

				//backgroundColor: '#dcdcdc',
				//border: '1px solid #a4a4a4',
				backgroundColor: '#d2d2d2',
				borderRadius: '8px',

				minWidth: '88px',
			}}
		>
			{/* <Handle type="source" position={Position.Top} /> */}
			<Handle type="target" position={Position.Top} />
			<Box
				sx={{
					// backgroundColor: 'pink',

					p: 0,
					m: 0,
					mt: '2px',
				}}
			>
				{isEditable ? (
					<TextField
						onKeyDown={handleEditKeyDown}
						onChange={e => setQuestion(e.target.value)}
						minRows={1}
						maxRows={10}
						multiline
						defaultValue={label}
						variant="outlined"
						InputProps={{
							style: {fontSize: 10, padding: 0},
						}}
						sx={{
							fontSize: '12px',
							margin: 0,
							padding: 0,
							// border: 'none',
							width: '100%', // Adjust width as needed
							maxWidth: '400px', // Set maximum width

							'& .MuiInputBase-root': {
								padding: 0,
								margin: 0,
								// border: 'none',
							},
							'& .MuiOutlinedInput-input': {
								padding: '0 4px',
								margin: 0,
								// border: 'none',
								backgroundColor: '#c8c8c8',
								borderRadius: '4px',
								overflowWrap: 'break-word', // Ensure text wraps within the input
							},
							'& .MuiInputBase-inputMultiline': {
								padding: 0,
								margin: 0,
								fontSize: '12px',
								overflowWrap: 'break-word', // Ensure text wraps within the textarea

								// border: 'none',
							},
							'& .MuiInputBase-root fieldset': {
								border: 'none',
								padding: 0,
								margin: 0,
								//backgroundColor: '#c8c8c8',
								color: 'green',
							},
						}}
					/>
				) : (
					<Typography fontSize="12px">
						<strong>Question:</strong> {label || question}
					</Typography>
				)}
			</Box>
			{isHovered && (
				<Box
					sx={{
						position: 'absolute',
						// top: '-20px',
						// right: '-20px',

						top: '-10px',
						right: '6px',

						fontSize: '12px',

						display: 'flex',
						gap: '8px',
						background: '#fff',
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
						{isEditable ? (
							<EditOffIcon
								onClick={() => setIsEditable(false)}
								sx={{
									fontSize: '12px',
									color: '#333',
									'&:hover': {
										color: 'green',
									},
								}}
							/>
						) : (
							<EditIcon
								onClick={() => setIsEditable(true)}
								sx={{
									fontSize: '12px',
									color: '#333',
									'&:hover': {
										color: '#1a881a',
									},
								}}
							/>
						)}
						<DeleteForeverIcon
							onClick={() => onDelete(node)}
							sx={{
								fontSize: '12px',
								color: '#333',
								'&:hover': {
									color: '#ff8282',
								},
							}}
						/>
					</>
				</Box>
			)}

			<Handle type="source" position={Position.Bottom} />
			{/* <Handle type="target" position={Position.Bottom} /> */}
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

export default QuestionNode
