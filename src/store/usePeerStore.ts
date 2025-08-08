import download from 'js-file-download'
import { toast } from 'sonner'
import { create } from 'zustand'

import { type FileData, PeerManager } from '../helpers/peer'

interface PeerState {
	peerId: string | null
	connections: string[]
	selectedConnection: string | null
	stagedFiles: File[]
	uploadProgress: Map<string, number>
	isLoading: boolean
	isConnecting: boolean
	isStarted: boolean
	actions: {
		startPeer: () => Promise<string | null>
		connectToPeer: (targetId: string) => Promise<void>
		selectConnection: (id: string) => void
		addStagedFile: (files: FileList | null) => void
		removeStagedFile: (fileName: string) => void
		sendStagedFiles: () => Promise<void>
		clearCompletedUpload: (fileName: string) => void
		initializeWithQueryParam: () => Promise<void>
		stopPeer: () => void
	}
}

export const usePeerStore = create<PeerState>((set, get) => {
	const handleReceiveFile = (file: FileData) => {
		toast.info(`Receiving file "${file.fileName}"...`)
		download(file.file, file.fileName, file.fileType)
	}

	const handleDisconnect = (peerId: string) => {
		toast.info(`Connection closed: ${peerId}`)
		set({
			connections: [],
			selectedConnection: null,
		})
	}

	return {
		peerId: null,
		connections: [],
		selectedConnection: null,
		stagedFiles: [],
		uploadProgress: new Map(),
		isLoading: false,
		isConnecting: false,
		isStarted: false,
		actions: {
			startPeer: async () => {
				if (get().isLoading || get().isStarted) return null
				console.log('Attempting to start peer session...')
				set({ isLoading: true })
				try {
					const id = await PeerManager.startPeerSession()
					console.log('Peer session successfully started with ID:', id)
					set({ peerId: id, isStarted: true, isLoading: false })
					PeerManager.onIncomingConnection((conn) => {
						const newPeerId = conn.peer
						toast.info(`Incoming connection from: ${newPeerId}`)
						set({
							connections: [newPeerId],
							selectedConnection: newPeerId,
						})
						PeerManager.setupConnectionHandlers(conn, handleReceiveFile, () => handleDisconnect(newPeerId))
					})
					return id
				} catch (error: any) {
					toast.error('Failed to start peer session:', error.message)
					set({ isLoading: false })
					return null
				}
			},

			connectToPeer: async (targetId: string) => {
				if (!targetId) {
					toast.warning('Please enter a Peer ID.')
					return
				}
				if (get().connections.length > 0) {
					toast.warning('A peer is already connected.')
					return
				}
				console.log(`Attempting to connect to peer: ${targetId}`)
				set({ isConnecting: true })
				try {
					const conn = await PeerManager.connectToPeer(targetId)
					console.log('Connection successful to:', targetId)
					toast.success(`Successfully connected to ${targetId}`)
					set({
						connections: [targetId],
						selectedConnection: targetId,
					})
					PeerManager.setupConnectionHandlers(conn, handleReceiveFile, () => handleDisconnect(targetId))
				} catch (error: any) {
					console.error('Connection Error:', error)
					if (error.type === 'peer-unavailable') {
						toast.error(`Peer "${targetId}" is not available or has closed the session.`)
					} else {
						toast.error(`Failed to connect to ${targetId}.`)
					}
				} finally {
					set({ isConnecting: false })
				}
			},

			initializeWithQueryParam: async () => {
				const params = new URLSearchParams(window.location.search)
				const connectToId = params.get('connect')
				if (connectToId) {
					toast.info('URL parameter found, attempting to connect...')
					const { startPeer, connectToPeer } = get().actions

					const selfId = await startPeer()
					if (selfId) {
						console.log(`Local session started (${selfId}), now connecting to ${connectToId}`)
						await connectToPeer(connectToId)
					} else {
						toast.error('Could not start a local session, connection aborted.')
					}
				}
			},

			selectConnection: (id: string) => set({ selectedConnection: id }),

			addStagedFile: (files: FileList | null) => {
				if (!files) return
				set((state) => {
					const currentFiles = state.stagedFiles
					const newFiles = Array.from(files)
					const totalFiles = currentFiles.length + newFiles.length
					if (totalFiles > 3) {
						toast.error('You can only select a maximum of 3 files.')
						const needed = 3 - currentFiles.length
						const uniqueNewFiles = newFiles
							.filter((nf) => !currentFiles.some((cf) => cf.name === nf.name))
							.slice(0, needed)
						return { stagedFiles: [...currentFiles, ...uniqueNewFiles] }
					}
					const uniqueNewFiles = newFiles.filter((nf) => !currentFiles.some((cf) => cf.name === nf.name))
					return { stagedFiles: [...currentFiles, ...uniqueNewFiles] }
				})
			},

			removeStagedFile: (fileName: string) => {
				set((state) => ({
					stagedFiles: state.stagedFiles.filter((f) => f.name !== fileName),
				}))
			},

			sendStagedFiles: async () => {
				const { selectedConnection, stagedFiles } = get()
				if (!selectedConnection) {
					toast.error('Please select a connection first.')
					return
				}
				if (stagedFiles.length === 0) {
					toast.warning('No files to send.')
					return
				}

				const filesToSend = [...stagedFiles]
				set({ stagedFiles: [] })

				for (const file of filesToSend) {
					set((state) => ({
						uploadProgress: new Map(state.uploadProgress).set(file.name, 0),
					}))
					await PeerManager.sendFile(selectedConnection, file, (progress) => {
						set((state) => ({
							uploadProgress: new Map(state.uploadProgress).set(file.name, progress),
						}))
					})
				}
			},

			clearCompletedUpload: (fileName: string) => {
				set((state) => {
					const newProgress = new Map(state.uploadProgress)
					newProgress.delete(fileName)
					return { uploadProgress: newProgress }
				})
			},

			stopPeer: () => {
				PeerManager.stopPeerSession()
				set({
					peerId: null,
					isStarted: false,
					connections: [],
					selectedConnection: null,
					stagedFiles: [],
					uploadProgress: new Map(),
				})
				toast.info('Peer session stopped.')
			},
		},
	}
})

export const usePeerActions = () => usePeerStore((state) => state.actions)
