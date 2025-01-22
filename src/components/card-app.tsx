import { toast } from 'sonner'

import { Fragment, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ButtonLoading } from '@/components/ui/button-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useAsyncState } from '@/helpers/hooks'
import { DataType, PeerConnection } from '@/helpers/peer'
import { cn } from '@/lib/utils'
import * as connectionAction from '@/store/connection/connectionActions'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { startPeer, stopPeerSession } from '@/store/peer/peerActions'

import { ShareLink } from './share-link'
import ThemeButton from './theme-button'
import { InputFile } from './ui/input-file'

export function CardApp({ className }: { className?: string }) {
  const peer = useAppSelector((state) => state.peer)
  const connection = useAppSelector((state) => state.connection)
  const dispatch = useAppDispatch()
  const [file, setFile] = useState<File | null>(null)
  const [sendLoading, setSendLoading] = useAsyncState(false)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const queryParameters = new URLSearchParams(window.location.search)
  const code = queryParameters.get('code')

  const handleStartSession = async () => {
    setLoading(true)
    try {
      await dispatch(startPeer())
    } catch (error) {
      console.error('Error starting session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStopSession = async () => {
    await PeerConnection.closePeerSession()
    dispatch(stopPeerSession())
  }

  const handleConnectOtherPeer = () => {
    if (inputValue) {
      dispatch(connectionAction.connectPeer(inputValue))
    } else {
      toast.warning('Please enter ID')
    }
  }

  useEffect(() => {
    if (code && inputValue === '') {
      handleStartSession()
      setInputValue(code)
    }
  }, [code])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    dispatch(connectionAction.changeConnectionInput(value))
  }

  const handleUpload = async () => {
    if (!file) {
      toast.warning('Please select file')
      return
    }
    if (!connection.selectedId) {
      toast.warning('Please select a connection')
      return
    }
    try {
      await setSendLoading(true)
      let blob = new Blob([file], { type: file.type })

      await PeerConnection.sendConnection(
        connection.selectedId,
        {
          dataType: DataType.FILE,
          file: blob,
          fileName: file.name,
          fileType: file.type,
        },
        dispatch,
      )
      await setSendLoading(false)
      toast.success('Send file successfully')
    } catch (err) {
      await setSendLoading(false)
      console.log(err)
      toast.error('Error when sending file')
    }
  }

  return (
    <div className={cn(className)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <p>P2P File Transfer</p>
            <ThemeButton />
          </CardTitle>
          <CardDescription>Connect to the same network for P2P to work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full items-center space-x-2">
            {!peer.started ? (
              loading ? (
                <div className="flex w-full items-center space-x-2">
                  <Input value="peer hasn't started" disabled />
                  <ShareLink />
                  <ButtonLoading className="w-[4.5rem]" />
                </div>
              ) : (
                <div className="flex w-full items-center space-x-2">
                  <Input value="peer hasn't started" disabled />
                  <ShareLink />
                  <Button className="w-[4.5rem]" onClick={handleStartSession} disabled={peer.loading}>
                    Start
                  </Button>
                </div>
              )
            ) : (
              <div className="flex w-full items-center space-x-2">
                <Input value={peer.id} disabled />
                <ShareLink code={peer.id} />
                <Button variant="destructive" className="w-[4.5rem]" onClick={handleStopSession}>
                  Stop
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex space-x-2">
              {!peer.started ? (
                <Fragment>
                  <Input
                    placeholder="Input Peer Token"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled
                  />
                  <Button variant="outline" disabled>
                    Connect
                  </Button>
                </Fragment>
              ) : (
                <Fragment>
                  <Input
                    placeholder="Input Peer Token"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    required
                  />
                  <Button variant="outline" onClick={handleConnectOtherPeer} disabled={connection.loading}>
                    Connect
                  </Button>
                </Fragment>
              )}
            </div>
            <div className="flex flex-col space-y-4">
              {connection.list.length === 0 ? (
                <div className="rounded-md border p-2 text-sm text-muted-foreground">
                  <span>Waiting for connection ...</span>
                </div>
              ) : (
                <div className="rounded-md border p-2 text-sm text-muted-foreground">
                  <span>{connection.selectedId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <InputFile
              id="file"
              className="p-0 pe-3 file:me-3 file:border-0 file:border-e"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button onClick={handleUpload} disabled={!file} className="w-full">
              {sendLoading ? 'Sending' : 'Send'}
            </Button>
            {peer.uploadProgress !== undefined && peer.uploadProgress < 100 && <Progress value={peer.uploadProgress} />}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
