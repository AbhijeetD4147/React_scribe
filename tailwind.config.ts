import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
			},
			fontSize: {
				xs: '12px',
				sm: '13px',
				base: '14px',
				lg: '16px',
			},
			borderRadius: {
				sm: '8px',
				md: '12px',
				lg: '16px',
				xl: '20px',
			},
			boxShadow: {
				card: '0 2px 8px rgba(0,0,0,.08)',
				elevated: '0 4px 16px rgba(0,0,0,.12)',
			},
			colors: {
				// App colors
				'bg-app': '#0F0310',
				'frame-border': '#4B0E2E',
				'panel-bg': '#FFFFFF',
				'panel-alt': '#F7F5F8',
				'scroll-track': '#EDE7EF',
				'scroll-thumb': '#C8A8C1',
				
				// Plum colors
				plum: {
					900: '#3A0A24',
					800: '#4E1032',
					700: '#5F173E',
					600: '#741F4E',
					500: '#8B2A60',
				},
				
				// Pink colors
				pink: {
					500: '#EA4C89',
					400: '#F0649B',
					200: '#F9B3CF',
				},
				
				// Green
				green: {
					500: '#22C55E',
				},
				
				// Orange/Warning
				orange: {
					500: '#F59E0B',
				},
				
				// Text colors
				text: {
					primary: '#2A2A2A',
					secondary: '#5E5E5E',
					muted: '#8B8B8B',
					inverse: '#FFFFFF',
				},
				
				// Icon colors
				icon: {
					default: '#6B6B6B',
				},

				// Keep existing shadcn colors for compatibility
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
