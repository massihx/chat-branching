import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	const conversation = await prisma.conversation.create({
		data: {
			title: 'Test Conversation',
		},
	})

	console.log(`Created conversation with id: ${conversation.id}`)
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
