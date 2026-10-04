/** Copy and share. KNOWN never sends anything for her. */

/** Copies text. Returns true on success; false means the browser refused (the caller selects the text instead). */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** The system share sheet exists only on some browsers (most phones). No share button otherwise. */
export const canShare = () => typeof navigator.share === 'function';

export async function shareText(text) {
  try {
    await navigator.share({ text });
  } catch {
    /* She closed the sheet; nothing was sent. */
  }
}
