/**
 * Tailwind config — design-mistral-prompt.md SoT
 * - SK Red → Mistral Orange 그라디언트 (시그니처 영역)
 * - 18 typography 토큰 (text-hero / text-display-lg / ...)
 * - 라운딩: xs 4 / sm 6 / md 8 / lg 12 / xl 16 / xxl 20 / full 9999
 * - shadow: chrome 그림자 X. card / mockup 만 활성
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SK + Mistral 융합
        'sk-red': '#EA002C',
        action: '#DC5A24',          // alias for primary
        'primary-deep': '#B8451A',

        // Sunshine palette
        'sunshine-300': '#F2C56B',
        'sunshine-500': '#ECA341',
        'sunshine-700': '#E0822F',
        'sunshine-800': '#C75D2C',
        'sunshine-900': '#A24818',
        'yellow-saturated': '#F7D14B',

        // Cream
        cream: '#F5EAD0',
        'cream-soft': '#FBF4E4',
        'cream-deeper': '#ECDCB0',
        'beige-deep': '#D4C28C',

        // Surface
        canvas: '#FFFFFF',
        surface: '#FAF8F5',
        'surface-cream': '#FBF4E4',
        'surface-code': '#1A1A1F',

        // Ink
        ink: '#1A1A1F',
        'ink-tint': '#2A2A30',
        charcoal: '#2D2D33',
        slate: '#4A4A52',
        steel: '#6B6B73',
        stone: '#8E8E96',

        // Hairline
        hairline: '#E5E0D6',
        'hairline-soft': '#EFEAE0',
        'hairline-strong': '#C8C2B4',

        // 중요도 (정보 표현용 — 인터랙티브 X 격리)
        urgent: '#B8451A',
        notable: '#A85F00',
        reference: '#5A6B57',
      },

      fontFamily: {
        display: ['Pretendard Variable', 'Inter', '-apple-system', '"Apple SD Gothic Neo"', 'system-ui', 'sans-serif'],
        body: ['Pretendard Variable', 'Inter', '-apple-system', '"Apple SD Gothic Neo"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },

      // Modern sans — display 는 weight 700 으로 강하게, body 는 400/500
      fontSize: {
        'hero':           ['84px', { lineHeight: '1.05', letterSpacing: '-2px',    fontWeight: '700' }],
        'display-lg':     ['64px', { lineHeight: '1.08', letterSpacing: '-1.5px',  fontWeight: '700' }],
        'heading-1':      ['52px', { lineHeight: '1.10', letterSpacing: '-1px',    fontWeight: '700' }],
        'stat-display':   ['48px', { lineHeight: '1.05', letterSpacing: '-1.5px',  fontWeight: '700' }],
        'heading-2':      ['36px', { lineHeight: '1.20', letterSpacing: '-0.5px',  fontWeight: '700' }],
        'heading-3':      ['28px', { lineHeight: '1.25', letterSpacing: '-0.3px',  fontWeight: '600' }],
        'heading-4':      ['22px', { lineHeight: '1.30', letterSpacing: '-0.2px',  fontWeight: '600' }],
        'heading-5':      ['18px', { lineHeight: '1.40', letterSpacing: '0',       fontWeight: '600' }],
        'subtitle':       ['18px', { lineHeight: '1.50', letterSpacing: '0',       fontWeight: '400' }],
        'body-md':        ['16px', { lineHeight: '1.55', letterSpacing: '0',       fontWeight: '400' }],
        'body-md-strong': ['16px', { lineHeight: '1.55', letterSpacing: '0',       fontWeight: '500' }],
        'body-sm':        ['14px', { lineHeight: '1.50', letterSpacing: '0',       fontWeight: '400' }],
        'body-sm-strong': ['14px', { lineHeight: '1.50', letterSpacing: '0',       fontWeight: '500' }],
        'caption':        ['13px', { lineHeight: '1.40', letterSpacing: '0',       fontWeight: '400' }],
        'caption-bold':   ['13px', { lineHeight: '1.40', letterSpacing: '0',       fontWeight: '600' }],
        'micro':          ['12px', { lineHeight: '1.40', letterSpacing: '0',       fontWeight: '500' }],
        'micro-eyebrow':  ['11px', { lineHeight: '1.40', letterSpacing: '1px',     fontWeight: '600' }],
        'btn-md':         ['14px', { lineHeight: '1.30', letterSpacing: '0',       fontWeight: '500' }],
        'fine-print':     ['10px', { lineHeight: '1.30', letterSpacing: '0',       fontWeight: '400' }],
        'code-md':        ['14px', { lineHeight: '1.50', letterSpacing: '0',       fontWeight: '400' }],
      },

      borderRadius: {
        none: '0',
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '20px',
        pill: '9999px',
      },

      // chrome 그림자 X. feature card / code mockup 만
      boxShadow: {
        DEFAULT: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        none: 'none',
        card: 'rgba(0, 0, 0, 0.04) 0px 4px 12px',
        mockup: 'rgba(0, 0, 0, 0.08) 0px 12px 24px -4px',
      },

      // 시그니처 그라디언트 3 종 (§3.G)
      backgroundImage: {
        'sk-mistral':    'linear-gradient(135deg, #EA002C 0%, #C73018 30%, #DC5A24 70%, #E0822F 100%)',
        'sunset-stripe': 'linear-gradient(90deg, #EA002C 0%, #DC5A24 18%, #E0822F 45%, #ECA341 70%, #F2C56B 88%, #F7E6C4 100%)',
        'auth-hero':     'linear-gradient(135deg, #EA002C 0%, #DC5A24 35%, #E0822F 65%, #ECA341 100%)',
      },
    },
  },
  plugins: [],
}
