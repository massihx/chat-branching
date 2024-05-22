// src/dbm/conversations.ts
'use server'

import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

// Get all conversations
export const getAllConversations = async () => {
	return await prisma.conversation.findMany()
}

// Get a conversation by ID
export const getConversationById = async (id: number) => {
	return await prisma.conversation.findUnique({
		where: {id},
		include: {messages: true},
	})
}

// Create a new conversation
export const createConversation = async (title: string) => {
	return await prisma.conversation.create({
		data: {title},
	})
}

// Update a conversation
export const updateConversation = async (id: number, title: string) => {
	return await prisma.conversation.update({
		where: {id},
		data: {title},
	})
}

// Delete a conversation
export const deleteConversation = async (id: number) => {
	return await prisma.conversation.delete({
		where: {id},
	})
}
