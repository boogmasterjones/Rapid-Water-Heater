const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function emHtml(text: string): string { return escape(text).replace(/\*([^*]+)\*/g, '<em>$1</em>'); }
