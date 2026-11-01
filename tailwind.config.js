/** @type {import('tailwindcss').Config} */
export default {
  // タッチ端末で hover スタイルが貼り付き「1回目のタップが hover 扱い」になる問題を防ぐ
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // テーマ「映画祭パス」
      colors: {
        background: '#ffffff',
        surface: '#ffffff',
        'surface-light': '#eef5f4',
        ink: '#0c2b2a',      // 文字・罫線・タブバー
        teal: '#0a7a6f',     // メインカラー（パス）
        coral: '#ff5a3c',    // 上位作品・強調
        sun: '#ffcf3c',      // 殿堂入り・タブの現在地
        mist: '#eef5f4',     // 面
        line: '#d5e3e1',     // 薄い罫線
        muted: '#4b6664',    // 補助テキスト
        accent: '#0a7a6f',
        genre: {
          anime: '#0a7a6f',
          movie: '#ff5a3c',
          manga: '#c13b7a',
          drama: '#e2a400',
          game: '#3c5bd6',
          music: '#7a8a89',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', '"Zen Kaku Gothic New"', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
