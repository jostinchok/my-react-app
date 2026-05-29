export const MOBILE_CERTIFICATE_VIEWPORT =
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3, viewport-fit=cover" />';

export const MOBILE_CERTIFICATE_STYLE_BLOCK = `<style id="sfc-mobile-certificate-view">
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    -webkit-text-size-adjust: 100%;
    background: #fffdf5 !important;
  }
  .page {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
    width: 100% !important;
    max-width: 100vw !important;
    min-height: 100vh !important;
    padding: 8px !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }
  .certificate {
    position: relative !important;
    box-sizing: border-box !important;
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
    min-width: 0 !important;
    min-height: unset !important;
    height: auto !important;
    aspect-ratio: 920 / 620 !important;
    margin: 0 auto !important;
    padding: 15% 7% 17% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    background-size: cover !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
    overflow: hidden !important;
  }
  .logo {
    top: 5% !important;
    left: 4% !important;
    width: 44px !important;
    height: 44px !important;
  }
  .content {
    width: 90% !important;
    max-width: 90% !important;
    margin-top: 8% !important;
    flex-shrink: 0 !important;
  }
  .org {
    font-size: 0.62rem !important;
    letter-spacing: 0.06em !important;
    line-height: 1.35 !important;
  }
  h1 {
    margin-top: 8px !important;
    font-size: 1.2rem !important;
    line-height: 1.2 !important;
  }
  .label {
    margin-top: 10px !important;
    font-size: 0.78rem !important;
  }
  .recipient {
    margin-top: 4px !important;
    font-size: 1.2rem !important;
    line-height: 1.15 !important;
    word-break: break-word !important;
  }
  .course {
    margin-top: 4px !important;
    font-size: 0.98rem !important;
    line-height: 1.25 !important;
    word-break: break-word !important;
  }
  .meta {
    margin-top: 12px !important;
    font-size: 0.7rem !important;
    line-height: 1.45 !important;
    word-break: break-word !important;
    padding-bottom: 2px !important;
  }
</style>`;

export const prepareMobileCertificateHtml = (html) => {
  let output = String(html || "");
  if (output.includes('id="sfc-mobile-certificate-view"')) return output;

  output = output.replace(/<meta[^>]*name=["']viewport["'][^>]*>/i, MOBILE_CERTIFICATE_VIEWPORT);
  if (!/name=["']viewport["']/i.test(output)) {
    output = output.replace(/<head>/i, `<head>\n  ${MOBILE_CERTIFICATE_VIEWPORT}`);
  }
  return output.replace(/<\/head>/i, `${MOBILE_CERTIFICATE_STYLE_BLOCK}\n</head>`);
};
