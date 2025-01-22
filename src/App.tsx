// import { FluidCursor } from '@/components/ui/fluid-cursor'
import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'

import { CardApp } from './components/card-app'

function App() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center px-8">
      <CardApp className="z-10" />
      {/* <FluidCursor /> */}
      <ShootingStars />
      <StarsBackground />
    </div>
  )
}

export default App
