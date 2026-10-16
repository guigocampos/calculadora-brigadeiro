(() => {
  const {analytics = {}} = window.SITE_CONFIG || {};
  if (analytics.enabled !== true || !/^G-[A-Z0-9]{6,20}$/.test(analytics.measurementId || '')) return;

  const id = analytics.measurementId;
  let referrer = '';
  try { referrer = new URL(document.referrer).origin; } catch {}

  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){window.dataLayer.push(arguments);};
  window.gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
  window.gtag('js', new Date());
  window.gtag('config', id, {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_domain: 'none'});

  window.addEventListener('lote:metric', ({detail}) => {
    if (!['page_view', 'cta_click', 'checkout_click'].includes(detail?.name)) return;
    const page = new URL(location.pathname, location.origin);
    Object.entries(detail.utm || {}).forEach(([key, value]) => page.searchParams.set(key, value));
    const params = {page_location: page.href, page_referrer: referrer, transport_type: 'beacon'};
    if (detail.name === 'page_view') params.page_title = document.title;
    else Object.assign(params, {placement: detail.placement, mode: detail.mode || 'checkout'});
    window.gtag('event', detail.name, params);
  });
})();
