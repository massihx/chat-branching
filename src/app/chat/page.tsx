// components/Chat.tsx
import React, {useState} from 'react'
import {fetchOpenAIResponse} from '@/utils/openai'
import {Box} from '@mui/material'
import Chat from '@/components/chat'

export default function Page() {
	return (
		<Box>
			<Chat />
		</Box>
	)
}
