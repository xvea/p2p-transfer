import { Progress } from '@/components/ui/progress'
import { DownloadCloud } from 'lucide-react'

interface FileReceiverProps {
	fileName: string
	progress: number
}

export function FileReceiver({ fileName, progress }: FileReceiverProps) {
	return (
		<div>
			<h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
				<DownloadCloud size={20} /> Receiving File
			</h3>
			<div className="bg-muted/50 space-y-2 rounded-md p-3">
				<div className="flex items-center justify-between">
					<span className="truncate pr-2 text-sm">{fileName}</span>
					<span className="text-muted-foreground text-xs">{Math.round(progress)}%</span>
				</div>
				<Progress value={progress} className="h-2" />
			</div>
		</div>
	)
}
