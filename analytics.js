(() => {
  const config = window.SITE_CONFIG?.analytics || {};
  const panel = document.querySelector('#metricas');
  if (!panel || config.enabled !== true || !/^G-[A-Z0-9]{6,20}$/.test(config.measurementId || '')) return;
  const id = config.measurementId;
  const status = panel.querySelector('[data-consent-status]');
  let active = false;
  panel.hidden = false;
  const send = (name, detail) => {
    if (active && ['cta_click', 'checkout_click'].includes(name)) {
      window.gtag('event', name, {placement: detail.placement, mode: detail.mode || 'checkout', transport_type: 'beacon'});
    }
  };
  window.addEventListener('lote:metric', ({detail}) => send(detail.name, detail));
  panel.querySelector('[data-consent="allow"]').addEventListener('click', () => {
    if (active) return;
    active = true;
    // A URL livre nunca é enviada ao coletor: só caminho local e campanhas filtradas.
    const safeUrl = new URL(location.pathname, location.origin);
    const utm = window.LOTE_METRICS?.find(event => event.name === 'page_view')?.utm || {};
    Object.entries(utm).forEach(([key,value]) => safeUrl.searchParams.set(key,value));
    history.replaceState(null,'',safeUrl.href);
    let referrer = '';
    try {referrer = new URL(document.referrer).origin;} catch {}
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    window.gtag('js',new Date());
    window.gtag('set',{page_location:safeUrl.href,page_referrer:referrer});
    window.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'none',cookie_expires:2592000,page_location:safeUrl.href,page_referrer:referrer});
    window.gtag('event','page_view',{page_location:safeUrl.href,page_referrer:referrer,page_title:document.title});
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    script.onerror = () => {active=false; status.textContent='Não foi possível carregar as métricas. Você pode continuar usando a página.';};
    document.head.append(script);
    status.textContent='Métricas permitidas nesta página. A escolha será solicitada novamente ao recarregar.';
    panel.querySelector('[data-consent="allow"]').disabled = true;
    panel.querySelector('[data-consent="deny"]').textContent = 'Desativar métricas';
  });
  panel.querySelector('[data-consent="deny"]').addEventListener('click', () => {
    if (active || window.gtag) {
      window[`ga-disable-${id}`] = true;
      active = false;
      document.cookie.split(';').map(cookie=>cookie.split('=')[0].trim()).filter(name=>/^_ga(?:_|$)|^_gid$/.test(name)).forEach(name=>{document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax`;});
      location.replace(new URL(location.pathname,location.origin).href);
      return;
    }
    status.textContent='Métricas opcionais recusadas. A página continua funcionando normalmente.';
  });
})();
