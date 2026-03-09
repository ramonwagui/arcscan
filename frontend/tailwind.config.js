/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#e8e8ff',
                    100: '#d1d1ff',
                    200: '#a3a3ff',
                    300: '#7575ff',
                    400: '#4747ff',
                    500: '#1111d4',
                    600: '#0d0da6',
                    700: '#0a0a78',
                    800: '#07074a',
                    900: '#04041d',
                    950: '#02020f',
                },
                surface: {
                    50: '#ffffff',
                    100: '#fafafa',
                    200: '#f4f4f5',
                    300: '#e4e4e7',
                    400: '#d4d4d8',
                    500: '#a1a1aa',
                    600: '#71717a',
                    700: '#52525b',
                    800: '#3f3f46',
                    900: '#27272a',
                    950: '#18181b',
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'pulse-slow': 'pulse 2s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
