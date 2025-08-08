import { PeerManagerUI } from './components/PeerManagerUi'
import { ThemeProvider } from './components/themeProvider'
import { Toaster } from './components/ui/sonner'

function App() {
	return (
		<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
			<PeerManagerUI />
			<Toaster />
		</ThemeProvider>
	)
}

export default App
