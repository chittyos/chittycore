/**
 * ChittyOS Brand - Branding and theming utilities
 */

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  destructive: string
  success: string
  warning: string
  info: string
}

export interface BrandTheme {
  name: string
  colors: {
    light: BrandColors
    dark: BrandColors
  }
  fonts: {
    display: string
    sans: string
    serif: string
    mono: string
  }
  radius: string
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
}

export const CHITTY_COLORS = {
  light: {
    primary: '#4F46E5',
    secondary: '#6366F1',
    accent: '#8B5CF6',
    background: '#FFFFFF',
    foreground: '#1E1B4B',
    muted: '#EEF2FF',
    mutedForeground: '#6B7280',
    border: '#E0E7FF',
    destructive: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#6366F1'
  },
  dark: {
    primary: '#818CF8',
    secondary: '#A5B4FC',
    accent: '#C4B5FD',
    background: '#0F0F1A',
    foreground: '#F5F3FF',
    muted: '#1E1B4B',
    mutedForeground: '#A5B4FC',
    border: '#312E81',
    destructive: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#818CF8'
  }
} as const

export const CHITTY_THEME: BrandTheme = {
  name: 'ChittyOS Default',
  colors: CHITTY_COLORS,
  fonts: {
    display: '"Syne", system-ui, sans-serif',
    sans: '"Figtree", system-ui, -apple-system, "Segoe UI", sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", "Cascadia Mono", monospace'
  },
  radius: '0.5rem',
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
}

export const LOGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="chitty-mark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#chitty-mark-grad)"/>
  <text x="50" y="68" font-family="Syne,system-ui,sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">C</text>
</svg>`

export const LOGO_WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 60">
  <defs>
    <linearGradient id="chitty-wm-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" x="6" y="6" fill="url(#chitty-wm-grad)"/>
  <text x="30" y="42" font-family="Syne,system-ui,sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle">C</text>
  <text x="70" y="42" font-family="Syne,system-ui,sans-serif" font-size="32" font-weight="700" fill="currentColor">ChittyOS</text>
</svg>`

export const BRAND_CONFIG = {
  name: 'ChittyOS',
  tagline: 'Making proof as frictionless as speech',
  description: 'Trust infrastructure and intelligent operating system for verification, identity, and evidence',
  logo: {
    text: 'ChittyOS',
    mark: LOGO_MARK_SVG,
    wordmark: LOGO_WORDMARK_SVG,
  },
  get copyright() { return `© ${new Date().getFullYear()} ChittyOS. All rights reserved.` },
  social: {
    github: 'https://github.com/chittyos',
    twitter: null as string | null,
    linkedin: null as string | null,
    discord: null as string | null
  },
  support: {
    email: 'support@chitty.cc',
    docs: 'https://docs.chitty.cc',
    status: 'https://status.chitty.cc'
  }
}

/**
 * Get CSS variables for theme colors
 */
export function getCSSVariables(theme: 'light' | 'dark' = 'light'): string {
  const colors = CHITTY_COLORS[theme]
  const vars: string[] = []

  for (const [key, value] of Object.entries(colors)) {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    vars.push(`--chitty-${cssKey}: ${value};`)
  }

  // Add font variables
  vars.push(`--chitty-font-display: ${CHITTY_THEME.fonts.display};`)
  vars.push(`--chitty-font-sans: ${CHITTY_THEME.fonts.sans};`)
  vars.push(`--chitty-font-serif: ${CHITTY_THEME.fonts.serif};`)
  vars.push(`--chitty-font-mono: ${CHITTY_THEME.fonts.mono};`)

  // Add spacing variables
  for (const [key, value] of Object.entries(CHITTY_THEME.spacing)) {
    vars.push(`--chitty-spacing-${key}: ${value};`)
  }

  // Add radius
  vars.push(`--chitty-radius: ${CHITTY_THEME.radius};`)

  return vars.join('\n  ')
}

/**
 * Generate a style tag with ChittyOS theme
 */
export function generateStyleTag(theme: 'light' | 'dark' = 'light'): string {
  return `
<style id="chittyos-theme">
  :root {
    ${getCSSVariables(theme)}
  }

  .chitty-theme {
    color: var(--chitty-foreground);
    background-color: var(--chitty-background);
    font-family: var(--chitty-font-sans);
  }

  .chitty-primary {
    color: var(--chitty-primary);
  }

  .chitty-secondary {
    color: var(--chitty-secondary);
  }

  .chitty-accent {
    color: var(--chitty-accent);
  }

  .chitty-muted {
    color: var(--chitty-muted-foreground);
    background-color: var(--chitty-muted);
  }

  .chitty-border {
    border-color: var(--chitty-border);
  }

  .chitty-btn {
    padding: var(--chitty-spacing-sm) var(--chitty-spacing-md);
    border-radius: var(--chitty-radius);
    background-color: var(--chitty-primary);
    color: var(--chitty-background);
    border: none;
    cursor: pointer;
    font-family: var(--chitty-font-sans);
  }

  .chitty-btn:hover {
    opacity: 0.9;
  }

  .chitty-card {
    padding: var(--chitty-spacing-md);
    border-radius: var(--chitty-radius);
    background-color: var(--chitty-background);
    border: 1px solid var(--chitty-border);
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }

  .chitty-input {
    padding: var(--chitty-spacing-sm);
    border-radius: var(--chitty-radius);
    background-color: var(--chitty-background);
    color: var(--chitty-foreground);
    border: 1px solid var(--chitty-border);
    font-family: var(--chitty-font-sans);
  }

  .chitty-input:focus {
    outline: none;
    border-color: var(--chitty-accent);
    box-shadow: 0 0 0 2px rgb(99 102 241 / 0.2);
  }

  .chitty-badge {
    padding: var(--chitty-spacing-xs) var(--chitty-spacing-sm);
    border-radius: calc(var(--chitty-radius) * 0.5);
    background-color: var(--chitty-muted);
    color: var(--chitty-muted-foreground);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .chitty-code {
    padding: var(--chitty-spacing-xs);
    border-radius: calc(var(--chitty-radius) * 0.5);
    background-color: var(--chitty-muted);
    color: var(--chitty-foreground);
    font-family: var(--chitty-font-mono);
    font-size: 0.875rem;
  }
</style>`
}

/**
 * Generate a React/JSX theme provider
 */
export function generateThemeProvider(): string {
  return `
import React, { createContext, useContext, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  colors: ${JSON.stringify(CHITTY_COLORS.light, null, 2)}
})

export function ChittyThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const colors = theme === 'light'
    ? ${JSON.stringify(CHITTY_COLORS.light, null, 2)}
    : ${JSON.stringify(CHITTY_COLORS.dark, null, 2)}

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useChittyTheme = () => useContext(ThemeContext)
`
}

/**
 * Generate Tailwind config for ChittyOS theme
 */
export function generateTailwindConfig(): object {
  return {
    theme: {
      extend: {
        colors: {
          chitty: {
            primary: 'var(--chitty-primary)',
            secondary: 'var(--chitty-secondary)',
            accent: 'var(--chitty-accent)',
            background: 'var(--chitty-background)',
            foreground: 'var(--chitty-foreground)',
            muted: 'var(--chitty-muted)',
            'muted-foreground': 'var(--chitty-muted-foreground)',
            border: 'var(--chitty-border)',
            destructive: 'var(--chitty-destructive)',
            success: 'var(--chitty-success)',
            warning: 'var(--chitty-warning)',
            info: 'var(--chitty-info)'
          }
        },
        fontFamily: {
          'chitty-display': CHITTY_THEME.fonts.display.split(',').map(f => f.trim().replace(/^["']|["']$/g, '')),
          'chitty-sans': CHITTY_THEME.fonts.sans.split(',').map(f => f.trim().replace(/^["']|["']$/g, '')),
          'chitty-serif': CHITTY_THEME.fonts.serif.split(',').map(f => f.trim().replace(/^["']|["']$/g, '')),
          'chitty-mono': CHITTY_THEME.fonts.mono.split(',').map(f => f.trim().replace(/^["']|["']$/g, '')),
        },
        borderRadius: {
          'chitty': CHITTY_THEME.radius
        },
        spacing: {
          'chitty-xs': CHITTY_THEME.spacing.xs,
          'chitty-sm': CHITTY_THEME.spacing.sm,
          'chitty-md': CHITTY_THEME.spacing.md,
          'chitty-lg': CHITTY_THEME.spacing.lg,
          'chitty-xl': CHITTY_THEME.spacing.xl
        }
      }
    }
  }
}

/**
 * ASCII art logo
 */
export const ASCII_LOGO = `
   _____ _     _ _   _        ____   _____
  / ____| |   (_) | | |      / __ \\ / ____|
 | |    | |__  _| |_| |_ _  _| |  | | (___
 | |    | '_ \\| | __| __| | | | |  | |\\___ \\
 | |____| | | | | |_| |_| |_| | |__| |____) |
  \\_____|_| |_|_|\\__|\\__|\\__, |\\____/|_____/
                          __/ |
                         |___/
`

export default {
  CHITTY_COLORS,
  CHITTY_THEME,
  BRAND_CONFIG,
  LOGO_MARK_SVG,
  LOGO_WORDMARK_SVG,
  getCSSVariables,
  generateStyleTag,
  generateThemeProvider,
  generateTailwindConfig,
  ASCII_LOGO
}