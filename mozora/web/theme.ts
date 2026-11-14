// Same theme mechanism as the host (brief section 2): data-theme on <html>, forced value in
// localStorage key `mokza_theme_forced`, otherwise the OS preference. No second mechanism.
// Loaded as a module in <head> instead of an inline script so the page CSP can forbid inline code.
let forced: string | null = null;
try {
  forced = localStorage.getItem('mokza_theme_forced');
} catch {
  forced = null;
}
const theme =
  forced === 'light' || forced === 'dark'
    ? forced
    : window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
document.documentElement.setAttribute('data-theme', theme);
