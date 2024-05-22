'use client'

import {BranchingComponent} from '@/components/branching'

export default function Page() {
	return (
		<main>
			<h1>Conversation Tree</h1>
			<BranchingComponent />
			{/* <ConversationTree conversationId={1} /> */}
		</main>
	)
}
