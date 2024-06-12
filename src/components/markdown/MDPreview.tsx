'use client'

import React from 'react'
import {Box} from '@mui/material'
import Markdown from 'markdown-to-jsx'
import './wmde.css'

export const MarkdownViewer = ({value}: {value: string}) => {
	return (
		<Box className="md-table wmde-markdown" sx={{}}>
			<Markdown>{value}</Markdown>
		</Box>
	)
}
