import { bootstrap, bindLeagueSwitch, bindTeamModalEvents, renderAll, renderClock } from './app.js'
import { initThemeSwitcher } from './theme.js'

initThemeSwitcher()
bindLeagueSwitch()
bindTeamModalEvents()
bootstrap()
setInterval(renderClock, 1000)
setInterval(renderAll, 30_000)
setInterval(() => bootstrap({ silent: true, force: true }), 60_000)
