import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { FileUp, Send, UploadCloud, X } from 'lucide-react'

import { type DragEvent, useState } from 'react'

interface FileSenderProps {
	stagedFiles: File[]
	uploadProgress: Map<string, number>
	onFilesAdded: (files: FileList | null) => void
	onFileRemoved: (name: string) => void
	onSend: () => void
	onClearCompleted: (name: string) => void
}

export function FileSender({
	stagedFiles,
	uploadProgress,
	onFilesAdded,
	onFileRemoved,
	onSend,
	onClearCompleted,
}: FileSenderProps) {
	const [isDraggingOver, setIsDraggingOver] = useState(false)

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault()
	const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setIsDraggingOver(true)
	}
	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setIsDraggingOver(false)
	}
	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setIsDraggingOver(false)
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			onFilesAdded(e.dataTransfer.files)
			e.dataTransfer.clearData()
		}
	}

	return (
		<div>
			<h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
				<FileUp size={20} />
				Send Files
			</h3>
			<div className="space-y-4">
				<div
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className={`block w-full rounded-md border-2 border-dashed p-6 text-center transition-colors ${
						isDraggingOver ? 'border-primary bg-accent' : 'border-border'
					} ${stagedFiles.length >= 3 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
				>
					<label
						htmlFor="file-upload"
						className={`flex h-full w-full flex-col items-center justify-center gap-2 ${stagedFiles.length >= 3 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
					>
						<UploadCloud className="text-muted-foreground" />
						<span className="text-muted-foreground text-sm">Click or drag files here (Max 3)</span>
					</label>
					<Input
						id="file-upload"
						type="file"
						multiple
						onChange={(e) => onFilesAdded(e.target.files)}
						className="hidden"
						disabled={stagedFiles.length >= 3}
					/>
				</div>

				{(stagedFiles.length > 0 || uploadProgress.size > 0) && (
					<div className="space-y-3">
						<Separator />
						<h4 className="text-muted-foreground text-sm font-semibold">Upload Queue:</h4>
						{stagedFiles.map((file) => (
							<div
								key={file.name}
								className="bg-muted/50 flex items-center justify-between rounded-md p-2"
							>
								<span className="truncate pr-2 text-sm">{file.name}</span>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => onFileRemoved(file.name)}
								>
									<X size={16} />
								</Button>
							</div>
						))}

						{Array.from(uploadProgress.entries()).map(([name, progress]) => (
							<div key={name} className="bg-muted/50 rounded-md p-2">
								<div className="flex items-center justify-between">
									<span className="truncate pr-2 text-sm">{name}</span>
									{progress === 100 && (
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={() => onClearCompleted(name)}
										>
											<X size={16} />
										</Button>
									)}
								</div>
								<Progress value={progress} className="mt-2 h-2" />
							</div>
						))}

						{stagedFiles.length > 0 && (
							<Button onClick={onSend} className="w-full">
								<Send className="mr-2 h-4 w-4" /> Send {stagedFiles.length} File(s)
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
