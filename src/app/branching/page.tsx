'use client'

import {ReactFlowWrapper} from '@/components/branching'
import {Box} from '@mui/material'

export default function Page() {
	return (
		<Box sx={{display: 'flex', flexDirection: 'column', height: '98vh'}}>
			<ReactFlowWrapper />
			{/* <ConversationTree conversationId={1} /> */}
		</Box>
	)
}
