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
                    50: '#f6f6f8',
                    100: '#eef0f4',
                    200: '#e2e5e9',
                    300: '#cbd1d8',
                    400: '#94a1b0',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1a1a3a',
                    900: '#101022',
                    950: '#0a0a16',
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
