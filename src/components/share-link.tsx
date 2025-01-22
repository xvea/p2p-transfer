import { Link2, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

import { useTheme } from './theme-provider'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'

export function ShareLink({ code }: { code?: string }) {
  const { theme } = useTheme()
  const handleCopyClick = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?code=${code}`)
    toast.success('Link Copied')
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={code ? false : true}>
          <QrCode />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>Anyone with this link can make a P2P connection with you</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center">
          <div className="flex w-full flex-col items-center justify-center gap-y-5">
            <div className="flex w-fit justify-center rounded-md border p-2">
              <QRCodeSVG
                value={`${window.location.origin}/?code=${code}`}
                size={128}
                bgColor={theme === 'dark' ? '#000000' : '#ffffff'}
                fgColor={theme === 'dark' ? '#ffffff' : '#000000'}
                level={'L'}
                marginSize={0}
              />
            </div>
            <div className="flex w-full justify-center gap-x-2">
              <Input id="link" defaultValue={`${window.location.origin}/?code=${code}`} readOnly />
              <Button type="button" onClick={handleCopyClick} className="px-3">
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
