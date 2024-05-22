'use client'

import React, {useState} from 'react'
import {
	Box,
	TextField,
	Button,
	List,
	ListItem,
	ListItemText,
	Paper,
	Typography,
	AppBar,
	Toolbar,
	Container,
} from '@mui/material'
import {fetchOpenAIResponse} from '@/utils/openai'
import {MarkdownViewer} from './markdown/MDPreview'

export default function Chat() {
	const [messages, setMessages] = useState<{role: string; content: string}[]>([])
	const [input, setInput] = useState('')

	const sendMessage = async () => {
		if (!input.trim()) return

		const userMessage = {role: 'user', content: input.trim()}
		const updatedMessages = [...messages, userMessage]
		setMessages(updatedMessages)
		setInput('')

		try {
			const botMessageContent = await fetchOpenAIResponse(updatedMessages)
			const botMessage = {role: 'assistant', content: botMessageContent}
			setMessages(prevMessages => [...prevMessages, botMessage])
		} catch (error) {
			console.error('Error sending message:', error)
			setMessages(prevMessages => [
				...prevMessages,
				{role: 'assistant', content: 'Error fetching response from OpenAI'},
			])
		}
	}

	return (
		<Container
			maxWidth="sm"
			sx={{display: 'flex', flexDirection: 'column', height: '100vh', padding: 0}}
		>
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6">Chat with OpenAI</Typography>
				</Toolbar>
			</AppBar>
			<Box sx={{flexGrow: 1, overflowY: 'auto', padding: 2}}>
				<List>
					{messages.map((msg, index) => (
						<ListItem key={index}>
							<Paper
								elevation={2}
								sx={{
									padding: 2,
									backgroundColor: msg.role === 'user' ? '#e6e5e5' : '#e9eafd',
								}}
							>
								<MarkdownViewer value={msg.content} />
							</Paper>
						</ListItem>
					))}
				</List>
			</Box>
			<Box sx={{padding: 2, borderTop: '1px solid #e0e0e0'}}>
				<TextField
					fullWidth
					placeholder="Type your message..."
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyPress={e => {
						if (e.key === 'Enter') sendMessage()
					}}
					variant="outlined"
					sx={{marginBottom: 1}}
				/>
				<Button variant="contained" color="primary" fullWidth onClick={sendMessage}>
					Send
				</Button>
			</Box>
		</Container>
	)
}
