export interface Message {
	id: number
	content: string
	role: string
	parentId: number | null
	conversationId: number
	createdAt: Date
	children: Message[]
}

export interface ConversationFlowProps {
	conversationId: number
}
