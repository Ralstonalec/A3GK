/**
 * Development-only accessibility checker (axe-core).
 * Loaded dynamically from _app in `next dev`; never part of a production bundle.
 * Logs WCAG 2.1 A/AA violations to the console after each navigation settles.
 */
export async function startAxeWatcher(router) {
  const { default: axe } = await import('axe-core');
  let timer;
  const run = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const results = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
      if (results.violations.length === 0) {
        console.info('%c[a11y] no WCAG 2.1 AA violations found', 'color:#5ee08a');
        return;
      }
      console.groupCollapsed(`%c[a11y] ${results.violations.length} violation(s) on ${location.pathname}`, 'color:#ff7a7a');
      for (const v of results.violations) {
        console.warn(`${v.impact}: ${v.help} (${v.id})`, v.helpUrl, v.nodes.map((n) => n.target.join(' ')));
      }
      console.groupEnd();
    }, 1200);
  };
  router.events.on('routeChangeComplete', run);
  run();
  return () => router.events.off('routeChangeComplete', run);
}
