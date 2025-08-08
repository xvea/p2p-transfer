import { nanoid } from 'nanoid'
import Peer, { DataConnection } from 'peerjs'
import { toast } from 'sonner'

export interface FileData {
	fileName: string
	fileType: string
	file: ArrayBuffer | string | Blob
}

type PeerDataType =
	| { type: 'metadata'; payload: { name: string; type: string; size: number } }
	| { type: 'chunk'; payload: { name: string; data: ArrayBuffer } }
	| { type: 'end'; payload: { name: string } }

class PeerConnectionManager {
	private peer: Peer | null = null
	private connections: Map<string, DataConnection> = new Map()
	private fileBuffers: Map<string, { chunks: ArrayBuffer[]; metadata: any }> = new Map()

	public async startPeerSession(): Promise<string> {
		if (this.peer) this.peer.destroy()

		const maxRetries = 5
		for (let i = 0; i < maxRetries; i++) {
			const newId = nanoid(6) // Membuat ID 6 karakter
			try {
				const newPeer = await this.initializePeer(newId)
				this.peer = newPeer
				console.log('PeerJS session started with ID:', newId)
				return newId // Berhasil, kembalikan ID
			} catch (error: any) {
				if (error.type === 'unavailable-id') {
					console.warn(`ID "${newId}" is unavailable. Retrying... (${i + 1}/${maxRetries})`)
					continue // Coba lagi dengan ID baru
				}
				// Error lain, langsung gagal
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

	public async sendFile(peerId: string, file: File, onProgress: (progress: number) => void) {
		const conn = this.connections.get(peerId)
		if (!conn) {
			toast.error(`Not connected to peer: ${peerId}`)
			onProgress(100)
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
				onProgress((offset / file.size) * 100)
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
					onProgress(100)
				}
			}
			reader.readAsArrayBuffer(slice)
		}
		readAndSend()
	}

	public setupConnectionHandlers(conn: DataConnection, onData: (data: FileData) => void, onClose: () => void) {
		conn.on('data', (data: any) => {
			const peerId = conn.peer
			const message = data as PeerDataType
			switch (message.type) {
				case 'metadata':
					this.fileBuffers.set(message.payload.name, { chunks: [], metadata: message.payload })
					toast.info(`Receiving file: "${message.payload.name}" from ${peerId}`)
					break
				case 'chunk':
					this.fileBuffers.get(message.payload.name)?.chunks.push(message.payload.data)
					break
				case 'end':
					const finalBuffer = this.fileBuffers.get(message.payload.name)
					if (finalBuffer) {
						const completeFile = new Blob(finalBuffer.chunks, { type: finalBuffer.metadata.type })
						onData({
							fileName: finalBuffer.metadata.name,
							fileType: finalBuffer.metadata.type,
							file: completeFile,
						})
						this.fileBuffers.delete(message.payload.name)
					}
					break
			}
		})
		conn.on('close', () => {
			this.connections.delete(conn.peer)
			onClose()
		})
		conn.on('error', () => {
			this.connections.delete(conn.peer)
			onClose()
		})
	}

	public stopPeerSession() {
		this.peer?.destroy()
		this.connections.clear()
		this.peer = null
	}
}

export const PeerManager = new PeerConnectionManager()
