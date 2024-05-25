'use client'

import {BranchingComponent} from '@/components/branching'
import {Box} from '@mui/material'

export default function Page() {
	return (
		<Box sx={{display: 'flex', flexDirection: 'column', height: '98vh'}}>
			<h1>Conversation Tree</h1>
			<BranchingComponent />
			{/* <ConversationTree conversationId={1} /> */}
		</Box>
	)
}
