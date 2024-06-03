'use server'

import {Message, PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

export const getMessageById = async (id: number) => {
	return await prisma.message.findUnique({
		where: {id},
		include: {
			children: true,
		},
	})
}

export const getMessagesByConversationId = async (conversationId: number): Promise<Message[]> => {
	const messages = await prisma.message.findMany({
		where: {conversationId},
		include: {
			children: true,
		},
	})

	// ? Ensure each message has a children property
	return messages.map(message => ({
		...message,
		children: message.children as Message[],
	})) as Message[]
}

export const createMessage = async (
	content: string,
	role: string,
	conversationId: number,
	parentId?: number,
): Promise<Message> => {
	// Check if the conversationId exists
	const conversationExists = await prisma.conversation.findUnique({
		where: {id: conversationId},
	})

	if (!conversationExists) {
		throw new Error(`Conversation with id ${conversationId} does not exist.`)
	}

	// Check if the parentId exists if it's provided
	if (parentId) {
		const parentMessageExists = await prisma.message.findUnique({
			where: {id: parentId},
		})

		if (!parentMessageExists) {
			throw new Error(`Parent message with id ${parentId} does not exist.`)
		}
	}

	return (await prisma.message.create({
		data: {
			content,
			role,
			parentId,
			conversationId,
		},
	})) as Message
}

export const updateMessage = async (id: number, content: string, role: string) => {
	return await prisma.message.update({
		where: {id},
		data: {content, role},
	})
}

export const deleteMessage = async (id: number) => {
	return await prisma.message.delete({
		where: {id},
	})
}
