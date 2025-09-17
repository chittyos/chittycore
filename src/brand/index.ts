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
    primary: '#0F172A',
    secondary: '#64748B',
    accent: '#3B82F6',
    background: '#FFFFFF',
    foreground: '#0F172A',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    border: '#E2E8F0',
    destructive: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6'
  },
  dark: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    accent: '#60A5FA',
    background: '#0F172A',
    foreground: '#F8FAFC',
    muted: '#1E293B',
    mutedForeground: '#94A3B8',
    border: '#334155',
    destructive: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA'
  }
} as const

export const CHITTY_THEME: BrandTheme = {
  name: 'ChittyOS Default',
  colors: CHITTY_COLORS,
  fonts: {
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", monospace'
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

export const BRAND_CONFIG = {
  name: 'ChittyOS',
  tagline: 'Intelligent Business Operating System',
  description: 'Enterprise-grade distributed system for legal technology and business automation',
  logo: {
    text: 'ChittyOS',
    icon: '⚡',
    svg: null as string | null
  },
  copyright: `© ${new Date().getFullYear()} ChittyOS. All rights reserved.`,
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
} as const

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
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.1);
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
          'chitty-sans': CHITTY_THEME.fonts.sans.split(','),
          'chitty-serif': CHITTY_THEME.fonts.serif.split(','),
          'chitty-mono': CHITTY_THEME.fonts.mono.split(',')
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
  getCSSVariables,
  generateStyleTag,
  generateThemeProvider,
  generateTailwindConfig,
  ASCII_LOGO
}