'use server'
// export const fetchOpenAIResponse = async (message: string) => {
export const fetchOpenAIResponse = async (messages: {role: string; content: string}[]) => {
	const openaiApiKey = process.env.OPENAI_API_KEY

	if (!openaiApiKey) {
		throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY in .env')
	}

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${openaiApiKey}`,
		},
		body: JSON.stringify({
			model: 'gpt-4o',
			// messages: [{role: 'user', content: message}],
			messages: messages,
		}),
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(error)
	}

	const data = await response.json()
	return data.choices[0].message.content
}
