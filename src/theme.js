export const THEME_KEY = 'lpl-theme'

export const THEMES = [
  { id: 'gold', name: '冠军金', swatch: '#e4bf62', scheme: 'dark' },
  { id: 'violet', name: '星辉紫', swatch: '#d4b3ff', scheme: 'dark' },
  { id: 'cyan', name: '海克斯', swatch: '#3ee0d0', scheme: 'dark' },
  { id: 'crimson', name: '无畏红', swatch: '#ff6b7a', scheme: 'dark' },
  { id: 'azure', name: '极光蓝', swatch: '#7eb6ff', scheme: 'dark' },
  { id: 'ivory', name: '象牙昼', swatch: '#f3eee3', scheme: 'light' },
]

export function currentThemeId() {
  try {
    const id = localStorage.getItem(THEME_KEY)
    if (THEMES.some((theme) => theme.id === id)) return id
  } catch {
    /* ignore */
  }
  return 'gold'
}

export function applyTheme(id) {
  const theme = THEMES.find((item) => item.id === id) || THEMES[0]
  document.documentElement.setAttribute('data-theme', theme.id)
  const meta = document.querySelector('meta[name="color-scheme"]')
  if (meta) meta.setAttribute('content', theme.scheme)
  try {
    localStorage.setItem(THEME_KEY, theme.id)
  } catch {
    /* ignore */
  }
  document.querySelectorAll('.theme-dot').forEach((btn) => {
    const active = btn.dataset.theme === theme.id
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-checked', active ? 'true' : 'false')
  })
}

export function initThemeSwitcher() {
  applyTheme(currentThemeId())
  const root = document.querySelector('#theme-switch')
  if (!root) return
  root.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-theme]')
    if (!btn) return
    applyTheme(btn.dataset.theme)
  })
}
