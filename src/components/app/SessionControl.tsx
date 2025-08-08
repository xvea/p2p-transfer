import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Link as LinkIcon } from 'lucide-react'

import { useState } from 'react'

interface SessionControlProps {
	isLoading: boolean
	isConnecting: boolean
	onStart: () => void
	onConnect: (id: string) => void
}

export function SessionControl({ isLoading, isConnecting, onStart, onConnect }: SessionControlProps) {
	const [targetId, setTargetId] = useState('')

	const showStartButton = targetId.trim() === ''

	return (
		<>
			<CardContent>
				<Input
					type="text"
					placeholder="Enter a friend's Room ID to connect"
					value={targetId}
					onChange={(e) => setTargetId(e.target.value)}
				/>
			</CardContent>
			<CardFooter>
				{showStartButton ? (
					<Button onClick={onStart} disabled={isLoading} className="w-full">
						{isLoading ? 'Starting...' : 'Start New Session'}
					</Button>
				) : (
					<Button onClick={() => onConnect(targetId)} disabled={isConnecting} className="w-full">
						<LinkIcon className="mr-2 h-4 w-4" />
						{isConnecting ? 'Connecting...' : `Connect to ${targetId}`}
					</Button>
				)}
			</CardFooter>
		</>
	)
}
