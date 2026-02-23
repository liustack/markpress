/**
 * Copy rendered HTML to system clipboard via @crosscopy/clipboard.
 *
 * Uses native system clipboard API (Rust + napi-rs) to write HTML
 * directly as text/html format for rich-text paste into WeChat editor.
 * No browser required.
 */
export async function copyToClipboard(html: string): Promise<void> {
    const { setHtml } = await import('@crosscopy/clipboard');
    await setHtml(html);
}
