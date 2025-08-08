'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

import { usePeerActions, usePeerStore } from '../store/usePeerStore'
import ThemeButton from './ThemeButton'
import { ConnectionStatus } from './app/ConnectionStatus'
import { DashboardHeader } from './app/DashboardHeader'
import { FileReceiver } from './app/FileReceiver'
import { FileSender } from './app/FileSender'
import { SessionControl } from './app/SessionControl'
import { useEffect } from 'react'

export function PeerManagerUI() {
	const {
		peerId,
		connections,
		selectedConnection,
		stagedFile,
		uploadProgress,
		downloadProgress,
		isLoading,
		isConnecting,
		isStarted,
	} = usePeerStore()

	const {
		startPeer,
		connectToPeer,
		addStagedFile,
		sendStagedFile,
		clearCompletedUpload,
		initializeWithQueryParam,
		stopPeer,
	} = usePeerActions()

	useEffect(() => {
		if (!isStarted) {
			initializeWithQueryParam()
		}
	}, [isStarted, initializeWithQueryParam])

	const handleManualConnect = async (targetId: string) => {
		toast.info('Starting local session...')
		const selfId = await startPeer()
		if (selfId) {
			toast.info('Local session started, connecting to peer...')
			await connectToPeer(targetId)
		} else {
			toast.error('Failed to start local session. Cannot connect.')
		}
	}

	return (
		<div className="p-4 sm:p-6 md:p-10">
			<Card className="mx-auto w-full max-w-lg">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>P2P File Transfer</CardTitle>
					<ThemeButton />
				</CardHeader>

				{!isStarted ? (
					<SessionControl
						isLoading={isLoading}
						isConnecting={isConnecting}
						onStart={startPeer}
						onConnect={handleManualConnect}
					/>
				) : (
					<CardContent className="space-y-6">
						<DashboardHeader peerId={peerId} onStop={stopPeer} />
						<Separator />
						<ConnectionStatus connections={connections} />
						<Separator />

						{downloadProgress ? (
							<FileReceiver fileName={downloadProgress.name} progress={downloadProgress.progress} />
						) : selectedConnection ? (
							<FileSender
								stagedFile={stagedFile}
								uploadProgress={uploadProgress}
								onFileAdded={addStagedFile}
								onSend={sendStagedFile}
								onClearCompleted={clearCompletedUpload}
							/>
						) : (
							<div className="py-4 text-center">
								<p className="text-muted-foreground text-sm">
									Waiting for connection to send or receive files...
								</p>
							</div>
						)}
					</CardContent>
				)}
			</Card>
		</div>
	)
}
