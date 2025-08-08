import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { FileUp, Send, UploadCloud, X } from 'lucide-react'

import { type DragEvent } from 'react'

interface FileSenderProps {
	stagedFile: File | null
	uploadProgress: number | null
	onFileAdded: (file: File | null) => void
	onSend: () => void
	onClearCompleted: () => void
}

export function FileSender({ stagedFile, uploadProgress, onFileAdded, onSend, onClearCompleted }: FileSenderProps) {
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onFileAdded(e.target.files ? e.target.files[0] : null)
		e.target.value = ''
	}

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			onFileAdded(e.dataTransfer.files[0])
			e.dataTransfer.clearData()
		}
	}

	const isUploading = uploadProgress !== null && uploadProgress < 100
	const isUploadComplete = uploadProgress === 100

	if (stagedFile) {
		return (
			<div>
				<h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
					<FileUp size={20} />
					Send File
				</h3>
				<div className="bg-muted/50 space-y-3 rounded-md p-3">
					<div className="flex items-center justify-between">
						<span className="truncate pr-2 text-sm">{stagedFile.name}</span>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={onClearCompleted}
							disabled={isUploading}
						>
							<X size={16} />
						</Button>
					</div>
					{uploadProgress !== null && <Progress value={uploadProgress} className="h-2" />}
					<Button onClick={onSend} className="w-full" disabled={isUploading || isUploadComplete}>
						<Send className="mr-2 h-4 w-4" />
						{isUploading ? `Sending... ${Math.round(uploadProgress)}%` : 'Send File'}
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div>
			<h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
				<FileUp size={20} />
				Send File
			</h3>
			<div
				onDragEnter={(e) => e.preventDefault()}
				onDragLeave={(e) => e.preventDefault()}
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}
				className="border-border hover:border-primary hover:bg-accent block w-full rounded-md border-2 border-dashed p-6 text-center transition-colors"
			>
				<label
					htmlFor="file-upload"
					className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2"
				>
					<UploadCloud className="text-muted-foreground" />
					<span className="text-muted-foreground text-sm">Click or drag a file here</span>
				</label>
				<Input id="file-upload" type="file" onChange={handleFileChange} className="hidden" />
			</div>
		</div>
	)
}
