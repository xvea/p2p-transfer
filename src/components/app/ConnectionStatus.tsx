import { Input } from '@/components/ui/input'
import { User } from 'lucide-react'

interface ConnectionStatusProps {
	connections: string[]
}

export function ConnectionStatus({ connections }: ConnectionStatusProps) {
	const isConnected = connections.length > 0
	const peerId = isConnected ? connections[0] : ''

	return (
		<div>
			<h3 className="mb-2 text-lg font-semibold">Connection Status</h3>
			<div className="relative">
				<User
					className={`absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 ${isConnected ? 'text-blue-500' : 'text-muted-foreground'}`}
				/>
				<Input
					value={peerId}
					disabled
					placeholder="Waiting for a peer to connect..."
					className="pl-10 font-mono text-sm"
				/>
			</div>
		</div>
	)
}
