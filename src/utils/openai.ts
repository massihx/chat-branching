'use client'

type GPT_ROLE = 'user' | 'assistant'
export type GptMessage = {role: GPT_ROLE; content: string}

const openaiApiKey = process.env.OPENAI_API_KEY

interface OpenAIResponse {
	data: Array<{url: string}>
}

export const fetchOpenAIResponse = async (messages: GptMessage[]) => {
	if (!openaiApiKey) {
		throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY in .env')
	}

	console.log('Messaging: ', messages)

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${openaiApiKey}`,
		},
		body: JSON.stringify({
			model: 'gpt-4o',
			messages: messages,
		}),
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(error)
	}

	const data = await response.json()
	console.log('data: ', data)
	const messageContent = data.choices[0].message.content

	const lastMessageContent = messages[messages.length - 1].content

	// const imagePrompt = `Generate a visually appealing image based on the following concept. Do not include any text in the image:

	// : ${messageContent}`

	// 	const imagePrompt = `
	// Generate a visually appealing image based on the following concept. Do not include any text in the image:
	// Refer to the context provided and focus on the most intriguing part of it, whether it's a building, place, or concept, and create an image of it.
	// Context: ${messageContent}
	// `

	const imagePrompt = `
Create a visually appealing image based on the most intriguing part of the following context (e.g., a building, place, or concept). Do not include any text in the image.
Context: ${messageContent}
`

	console.log('image Prompt: ', imagePrompt)

	//const imageUrl = await generateImage(imagePrompt)

	console.log('Message Content: ', messageContent)
	//console.log('Image Url: ', imageUrl)

	return {
		answer: messageContent,
		//image: imageUrl,
		image: '',
	}
}

const generateImage = async (prompt: string): Promise<string> => {
	const response = await fetch('https://api.openai.com/v1/images/generations', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${openaiApiKey}`,
		},
		body: JSON.stringify({
			prompt: prompt,
			n: 1, // Number of images to generate
			size: '512x512', // Size of the generated images
		}),
	})

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}

	const data: OpenAIResponse = await response.json()
	return data.data[0].url // Return the URL of the generated image
}
