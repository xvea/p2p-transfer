import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

import { useTheme } from './themeProvider'

const ThemeButton = () => {
	const { theme, setTheme } = useTheme()

	const toggleTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light')
	}

	return (
		<Button className="p-3" onClick={toggleTheme}>
			{theme === 'light' ? (
				<Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
			) : (
				<Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
			)}
		</Button>
	)
}

export default ThemeButton
