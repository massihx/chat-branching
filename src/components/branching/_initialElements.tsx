'use client'
import {Node, Edge, MarkerType} from 'reactflow'

export const initialNodes: Node[] = [
	{
		id: '1',
		data: {
			label: "Describe the fund's investment distribution across different sectors and their corresponding values as detailed in the Schedule of Investments",
			expanded: true,
		},
		position: {x: 0, y: 0},
		type: 'question',
	},
	{
		id: '2',
		data: {
			content: `
### **Core Concepts**
- **Domain:** Represents a collection of use cases under a specific organizational context.
- **Usecase:** Specific functionality or process within a domain.
- **Embed:** Process of converting uploaded files into a usable format for analysis.
- **Pilot:** A test instance that combines a usecase with specific embedded data for evaluation.

### **Pages Overview**
1. **Domain Creation Page**
	- **Functionality:** Create new domains with options to edit or delete existing ones.
	
2. **Domain List Page**
	- **Functionality:** Display all domains with options to edit or delete.

3. **Usecase Creation Page**
	- **Functionality:** Create new usecases within a domain with options to edit or delete existing ones.

4. **Usecase List Page**
	- **Functionality:** Display all usecases within a domain with options to edit or delete.

5. **File Upload/Management Page**
	- **Functionality:** Manage file uploads and embedding for a specific usecase.

6. **Pilot Creation Page**
	- **Functionality:** Create new pilots involving specific usecases and embedded data.

7. **List of Pilots Page**
	- **Functionality:** View all pilots with options to manage (create, update, or delete).

8. **Chat Page**
	- **Functionality:** Allows users to interact with the AI models based on selected pilots.

9. **Comparison Page**
	- **Functionality:** Enables users to compare two pilots side-by-side to evaluate different outputs.
`,
		},
		position: {x: 100, y: 100},
		//type: 'output',
		type: 'answer',
	},
	{
		id: '3',
		data: {
			label: 'What are the Us and European economic forecasts, and how do they compare? ',
			expanded: false,
		},
		position: {x: 200, y: 200},
		selected: true,
		type: 'question',
	},
	{
		id: '31',
		data: {
			content: `
This project uses [next/font](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

# Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

You want to keep track of questions and answers exchanged with the GPT API in a tree structure, allowing for branching conversations where each node can reference a specific context or history of the conversation. This would enable you to navigate back to any previous point in the conversation and continue from there, maintaining the correct context.

Concept Overview
Conversations: Represents an overall session or topic.
Messages: Represents individual exchanges (questions and answers).
Tree Structure: Each message can have child messages, representing branches in the conversation.
	`,
		},
		position: {x: 300, y: 300},
		type: 'answer',
	},
	{
		id: '32',
		data: {
			content: `
### **Additional Considerations**
-   **Schema Provision:**
	-   The front-end application (Next.js) will have access to a standalone schema that can be utilized independently. This schema provides the necessary structure for the front-end to interface effectively with the data, enhancing UI components and data handling without direct backend interaction.
-   **API Access:**
	-   **Google Cloud Storage:** Backend APIs facilitate access to Google Cloud Storage, essential for the File Upload/Management Page. These APIs handle secure file transfers and storage management.
	-   **Embedding, Chat, and Evaluation:** Separate backend APIs are provided to support embedding operations, chat functionalities, and performance evaluations. These APIs handle data processing and interactions that are not managed directly by the front end.
- **Cascading Deletions:** Deleting higher-level items like domains will automatically delete all associated lower-level records, such as usecases, embeddings, and pilots, to ensure data integrity.
		`,
		},
		position: {x: 400, y: 200},
		type: 'answer',
	},
]

export const initialEdges: Edge[] = [
	{
		id: '1-2',
		source: '1',
		target: '2',
		//label: 'answer',
		type: 'smoothstep',
		//animated: true,
		// style: {
		// 	strokeWidth: 2,
		// 	stroke: '#FF0072',
		// },
		// markerEnd: {
		// 	type: MarkerType.ArrowClosed,
		// 	width: 10,
		// 	height: 10,
		// 	color: '#FF0072',
		// },
	},
	{
		id: '2-3',
		source: '2',
		target: '3',
		//label: 'question ►',
		type: 'smoothstep',
		//animated: true,
		//markerStart: 'a',
		// style: {
		// 	strokeWidth: 2,
		// 	stroke: '#2be3ff',
		// },
		// markerEnd: {
		// 	type: MarkerType.ArrowClosed,
		// 	width: 10,
		// 	height: 10,
		// 	color: '#2be3ff',
		// },
	},
	{
		id: '3-31',
		source: '3',
		target: '31',
		//label: 'answer ↠',
		type: 'smoothstep',
		//selected: true,
		//animated: true,
	},
	{
		id: '3-32',
		source: '3',
		target: '32',
		//label: 'answer ↣',
		type: 'smoothstep',
		//animated: true,
	},
]

export const initialNodes3 = [
	{
		id: '1',
		type: 'question',
		data: {label: 'input'},
		position: {x: 0, y: 0},
	},
	{
		id: '2',
		data: {label: 'node 2'},
		position: {x: 0, y: 100},
	},
	{
		id: '2a',
		type: 'question',
		data: {label: 'node 2a'},
		position: {x: 0, y: 200},
	},
	{
		id: '2b',
		data: {label: 'node 2b'},
		position: {x: 0, y: 300},
	},
	{
		id: '2c',
		data: {label: 'node 2c'},
		position: {x: 0, y: 400},
	},
	{
		id: '2d',
		data: {label: 'node 2d'},
		position: {x: 0, y: 500},
	},
	{
		id: '3',
		type: 'question',
		data: {label: 'node 3'},
		position: {x: 200, y: 100},
	},
]

export const initialEdges3 = [
	{id: 'e12', source: '1', target: '2', animated: true},
	{id: 'e13', source: '1', target: '3', animated: true},
	{id: 'e22a', source: '2', target: '2a', animated: true},
	{id: 'e22b', source: '2', target: '2b', animated: true},
	{id: 'e22c', source: '2', target: '2c', animated: true},
	{id: 'e2c2d', source: '2c', target: '2d', animated: true},
]
