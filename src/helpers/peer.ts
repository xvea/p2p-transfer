import download from 'js-file-download'
import { nanoid } from 'nanoid'
import Peer, { DataConnection } from 'peerjs'
import { toast } from 'sonner'

export interface FileData {
	fileName: string
	fileType: string
	file: ArrayBuffer | string | Blob
}

export type PeerDataType =
	| { type: 'metadata'; payload: { name: string; type: string; size: number } }
	| { type: 'chunk'; payload: { name: string; data: ArrayBuffer } }
	| { type: 'progress'; payload: { name: string; progress: number } }
	| { type: 'end'; payload: { name: string } }

class PeerConnectionManager {
	private peer: Peer | null = null
	private connections: Map<string, DataConnection> = new Map()
	private fileBuffers: Map<string, { chunks: ArrayBuffer[]; metadata: any }> = new Map()

	public async startPeerSession(): Promise<string> {
		if (this.peer) this.peer.destroy()

		const maxRetries = 5
		for (let i = 0; i < maxRetries; i++) {
			const newId = nanoid(6)
			try {
				const newPeer = await this.initializePeer(newId)
				this.peer = newPeer
				console.log('PeerJS session started with ID:', newId)
				return newId
			} catch (error: any) {
				if (error.type === 'unavailable-id') {
					console.warn(`ID "${newId}" is unavailable. Retrying... (${i + 1}/${maxRetries})`)
					continue
				}
				throw error
			}
		}

		throw new Error(`Failed to create a unique peer ID after ${maxRetries} attempts.`)
	}

	private initializePeer(id: string): Promise<Peer> {
		return new Promise((resolve, reject) => {
			const peer = new Peer(id)
			peer.on('open', () => resolve(peer))
			peer.on('error', (err) => reject(err))
		})
	}

	public connectToPeer(peerId: string): Promise<DataConnection> {
		return new Promise((resolve, reject) => {
			if (!this.peer) return reject(new Error('Peer session not started.'))
			if (!peerId) return reject(new Error('Peer ID cannot be empty.'))

			const conn = this.peer.connect(peerId, { reliable: true })

			const timer = setTimeout(() => {
				reject({ type: 'peer-unavailable' })
				conn.close()
			}, 10000)

			conn.on('open', () => {
				clearTimeout(timer)
				this.connections.set(peerId, conn)
				resolve(conn)
			})

			conn.on('error', (err) => {
				clearTimeout(timer)
				reject(err)
			})
		})
	}

	public onIncomingConnection(callback: (conn: DataConnection) => void) {
		this.peer?.on('connection', (conn) => {
			this.connections.set(conn.peer, conn)
			callback(conn)
		})
	}

	public async sendFile(peerId: string, file: File, onUploadProgress: (progress: number) => void) {
		const conn = this.connections.get(peerId)
		if (!conn) {
			toast.error(`Not connected to peer: ${peerId}`)
			onUploadProgress(100)
			return
		}

		const metadata: PeerDataType = {
			type: 'metadata',
			payload: { name: file.name, type: file.type, size: file.size },
		}
		conn.send(metadata)

		const chunkSize = 65536
		let offset = 0

		const readAndSend = () => {
			const slice = file.slice(offset, offset + chunkSize)
			const reader = new FileReader()

			reader.onload = () => {
				const chunk: PeerDataType = {
					type: 'chunk',
					payload: { name: file.name, data: reader.result as ArrayBuffer },
				}
				conn.send(chunk)

				offset += slice.size
				const progress = (offset / file.size) * 100

				onUploadProgress(progress)

				const progressMessage: PeerDataType = { type: 'progress', payload: { name: file.name, progress } }
				conn.send(progressMessage)

				if (offset < file.size) {
					if (conn.dataChannel.bufferedAmount < conn.dataChannel.bufferedAmountLowThreshold) {
						readAndSend()
					} else {
						conn.dataChannel.onbufferedamountlow = () => {
							conn.dataChannel.onbufferedamountlow = null
							readAndSend()
						}
					}
				} else {
					const endSignal: PeerDataType = { type: 'end', payload: { name: file.name } }
					conn.send(endSignal)
					toast.success(`"${file.name}" sent successfully to ${peerId}`)
					onUploadProgress(100)
				}
			}
			reader.readAsArrayBuffer(slice)
		}
		readAndSend()
	}

	public setupConnectionHandlers(conn: DataConnection, onData: (data: PeerDataType) => void, onClose: () => void) {
		conn.on('data', (data: any) => {
			const message = data as PeerDataType

			onData(message)

			if (message.type === 'metadata') {
				this.fileBuffers.set(message.payload.name, { chunks: [], metadata: message.payload })
			} else if (message.type === 'chunk') {
				this.fileBuffers.get(message.payload.name)?.chunks.push(message.payload.data)
			} else if (message.type === 'end') {
				const finalBuffer = this.fileBuffers.get(message.payload.name)
				if (finalBuffer) {
					const completeFile = new Blob(finalBuffer.chunks, { type: finalBuffer.metadata.type })
					download(completeFile, finalBuffer.metadata.name, finalBuffer.metadata.type)
					this.fileBuffers.delete(message.payload.name)
				}
			}
		})

		conn.on('close', onClose)
		conn.on('error', onClose)
	}

	public stopPeerSession() {
		this.peer?.destroy()
		this.connections.clear()
		this.peer = null
	}
}

export const PeerManager = new PeerConnectionManager()
