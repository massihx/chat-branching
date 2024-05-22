import {Box, Button, Container, Typography} from '@mui/material'
import Link from 'next/link'

export default function Home() {
	return (
		<main>
			<h1>Home Page</h1>
			<Container maxWidth="sm">
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						//  alignItems: 'center',
						// justifyContent: 'center',
						height: '100vh',
					}}
				>
					<Link href="/chat" passHref>
						Linear Chat Page
					</Link>
					<Link href="/branching" passHref>
						Branching Chat Page
					</Link>
				</Box>
			</Container>
		</main>
	)
}
