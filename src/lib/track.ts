import { site } from './site';

// The exact inline handler the site has always used for phone taps, so GA4 keeps receiving the same
// call_click event with the same category and per-placement label.
export function callClick(label: string): string | undefined {
  if (!site.site.gaMeasurementId) return undefined;
  const safe = label.replace(/[^a-z0-9_]/gi, '_');
  return `if(typeof gtag==='function')gtag('event','call_click',{'event_category':'engagement','event_label':'${safe}'})`;
}

// "/about.html", "/about/" and "/about" all become "/about"; the homepage is "/".
export function cleanPath(pathname: string): string {
  const p = pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/+$/, '');
  return p === '' ? '/' : p;
}
