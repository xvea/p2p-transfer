import { toast } from 'sonner'
import { create } from 'zustand'

import { type PeerDataType, PeerManager } from '../helpers/peer'

interface ProgressState {
	name: string
	progress: number
}

interface PeerState {
	peerId: string | null
	connections: string[]
	selectedConnection: string | null
	stagedFile: File | null
	uploadProgress: number | null
	downloadProgress: ProgressState | null
	isLoading: boolean
	isConnecting: boolean
	isStarted: boolean
	actions: {
		startPeer: () => Promise<string | null>
		connectToPeer: (targetId: string) => Promise<void>
		addStagedFile: (file: File | null) => void
		sendStagedFile: () => Promise<void>
		clearCompletedUpload: () => void
		initializeWithQueryParam: () => Promise<void>
		stopPeer: () => void
	}
}

export const usePeerStore = create<PeerState>((set, get) => {
	const handleIncomingData = (message: PeerDataType) => {
		switch (message.type) {
			case 'metadata':
				set({ downloadProgress: { name: message.payload.name, progress: 0 } })
				break
			case 'progress':
				set({ downloadProgress: message.payload })
				break
			case 'end':
				setTimeout(() => set({ downloadProgress: null }), 2000)
				break
			default:
				break
		}
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
		stagedFile: null,
		uploadProgress: null,
		downloadProgress: null,
		isLoading: false,
		isConnecting: false,
		isStarted: false,
		actions: {
			startPeer: async () => {
				if (get().isLoading || get().isStarted) return null
				set({ isLoading: true })
				try {
					const id = await PeerManager.startPeerSession()
					set({ peerId: id, isStarted: true, isLoading: false })
					PeerManager.onIncomingConnection((conn) => {
						const newPeerId = conn.peer
						toast.info(`Incoming connection from: ${newPeerId}`)
						set({
							connections: [newPeerId],
							selectedConnection: newPeerId,
						})
						PeerManager.setupConnectionHandlers(conn, handleIncomingData, () => handleDisconnect(newPeerId))
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
				set({ isConnecting: true })
				try {
					const conn = await PeerManager.connectToPeer(targetId)
					toast.success(`Successfully connected to ${targetId}`)
					set({
						connections: [targetId],
						selectedConnection: targetId,
					})
					PeerManager.setupConnectionHandlers(conn, handleIncomingData, () => handleDisconnect(targetId))
				} catch (error: any) {
					console.error('Connection Error:', error)
					if (error.type === 'peer-unavailable') {
						toast.error(`Peer "${targetId}" is not available or offline.`)
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
					toast.info('Attempting to connect via URL...')
					const { startPeer, connectToPeer } = get().actions
					const selfId = await startPeer()
					if (selfId) {
						await connectToPeer(connectToId)
					}
				}
			},

			addStagedFile: (file: File | null) => {
				if (file && get().stagedFile) {
					toast.error('You can only upload one file at a time.')
					return
				}
				set({ stagedFile: file, uploadProgress: null })
			},

			sendStagedFile: async () => {
				const { selectedConnection, stagedFile } = get()
				if (!selectedConnection) {
					toast.error('Please select a connection first.')
					return
				}
				if (!stagedFile) {
					toast.warning('No file selected to send.')
					return
				}

				set({ uploadProgress: 0 })

				await PeerManager.sendFile(selectedConnection, stagedFile, (progress) => {
					set({ uploadProgress: progress })
				})
			},

			clearCompletedUpload: () => {
				set({ stagedFile: null, uploadProgress: null })
			},

			stopPeer: () => {
				PeerManager.stopPeerSession()
				set({
					peerId: null,
					isStarted: false,
					connections: [],
					selectedConnection: null,
					stagedFile: null,
					uploadProgress: null,
					downloadProgress: null,
				})
				toast.info('Peer session stopped.')
			},
		},
	}
})

export const usePeerActions = () => usePeerStore((state) => state.actions)
