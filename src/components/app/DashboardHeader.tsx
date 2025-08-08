import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Copy, Power, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

interface DashboardHeaderProps {
	peerId: string | null
	onStop: () => void
}

export function DashboardHeader({ peerId, onStop }: DashboardHeaderProps) {
	const qrValue = peerId ? `${window.location.origin}?connect=${peerId}` : ''

	const handleCopy = () => {
		if (peerId) {
			navigator.clipboard.writeText(peerId)
			toast.success('Room ID copied to clipboard!')
		}
	}

	return (
		<div className="space-y-2">
			<h3 className="text-lg font-semibold">Session Status</h3>
			<div className="flex w-full items-center space-x-2">
				<div className="relative flex-grow">
					<Input value={peerId || ''} disabled className="pr-10 font-mono text-sm" />
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="text-muted-foreground absolute top-0 right-0 h-full w-10"
						onClick={handleCopy}
					>
						<Copy className="h-4 w-4" />
					</Button>
				</div>

				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline" size="icon">
							<QrCode className="h-5 w-5" />
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Scan to Connect</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col items-center gap-4 rounded-lg bg-transparent p-4">
							<QRCodeSVG value={qrValue} size={200} />
							<p className="text-muted-foreground text-center font-mono text-xs break-all">{qrValue}</p>
						</div>
					</DialogContent>
				</Dialog>

				<Button variant="destructive" size="icon" onClick={onStop}>
					<Power className="h-5 w-5" />
				</Button>
			</div>
		</div>
	)
}
