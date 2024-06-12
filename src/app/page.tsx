import {Box, Button, Container, Typography} from '@mui/material'
import Link from 'next/link'

import BranchingComponent from '@/components/chat-branching/index'

export default function Home() {
	return (
		<Box
			sx={{
				height: 'calc(100vh - 20px)',

				m: 0,
				p: 0,
				//border: '10px solid purple',
			}}
		>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					//height: '98vh',
					height: '100%',
					border: '10px solid blue',
				}}
			>
				<h1>Conversation Tree</h1>
				<BranchingComponent />
			</Box>
		</Box>
	)
}
