(() => {
  if (window.LOTE_METRICS) return;
  const config = window.SITE_CONFIG || {};
  const money = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  const cents = n => Math.round((n + Number.EPSILON) * 100) / 100;
  let checkout;
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const campaignCode = (key,value) => typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(value) && !/\d{6}/.test(value) && Array.isArray(config.utmAllowlist?.[key]) && config.utmAllowlist[key].includes(value);
  try {
    const url = new URL(config.checkoutUrl);
    if (url.protocol === 'https:' && url.hostname === 'pay.kiwify.com.br' && !url.port && !url.username && !url.password && /^\/[a-zA-Z0-9_-]{4,100}$/.test(url.pathname) && !url.hash && [...url.searchParams].every(([key,value]) => campaignKeys.includes(key) && campaignCode(key,value))) checkout = url;
  } catch {}
  const live = config.launchReady === true && Boolean(checkout);
  const utm = {};
  const params = new URLSearchParams(location.search);
  campaignKeys.forEach(key => {
    const value = params.get(key); if (params.getAll(key).length === 1 && campaignCode(key,value)) utm[key] = value;
  });
  // Histórico local de diagnóstico; analytics.js só envia após autorização explícita.
  const events = [];
  const track = (name, detail = {}) => {
    const event = { name, at: new Date().toISOString(), utm: { ...utm }, ...detail };
    events.push(event);
    if (events.length > 200) events.shift();
    window.dispatchEvent(new CustomEvent('lote:metric', { detail: event }));
  };
  window.LOTE_METRICS = events;
  track('page_view');
  if (live) {
    Object.entries(utm).forEach(([key, value]) => checkout.searchParams.set(key, value));
    document.querySelectorAll('[data-launch-status]').forEach(el => el.textContent = 'Compra disponível no checkout Kiwify.');
    document.querySelector('.mobile-bar small').textContent = 'pagamento único';
    document.querySelector('#pre-lancamento h2').textContent = 'Sua encomenda com a conta à vista.';
    document.querySelector('#pre-lancamento p:not(.eyebrow)').textContent = 'Confira as condições de entrega, suporte e reembolso antes de seguir ao checkout.';
  }
  document.querySelectorAll('[data-buy]').forEach(link => {
    link.href = live ? checkout.href : '#pre-lancamento';
    if (live) {link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';}
    link.addEventListener('click', () => {
      track('cta_click', { placement: link.dataset.buy, mode: live ? 'checkout' : 'prelaunch' });
      if (live) track('checkout_click', { placement: link.dataset.buy });
    });
  });
  const bar = document.querySelector('.mobile-bar');
  if (bar && 'IntersectionObserver' in window) {
    bar.hidden = true;
    new IntersectionObserver(([entry]) => { bar.hidden = entry.isIntersecting; }).observe(document.querySelector('.hero-actions'));
  }
  if (live && config.siteUrl) {
    try {
      const url = new URL(config.siteUrl);
      if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash) {
        const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link'); canonical.rel = 'canonical'; canonical.href = url.href; if (!canonical.isConnected) document.head.append(canonical);
        document.querySelector('[property="og:url"]').content = url.href;
        document.querySelector('[property="og:image"]').content = new URL('img/og.png', url).href;
      }
    } catch {}
  }
  const input = document.querySelector('#desconto');
  if (!input) return;
  const outputs = ['preco-final', 'taxa-final', 'sobra-final'];
  input.addEventListener('input', () => {
    const raw = input.value.trim(); const value = Number(raw.replace(',', '.'));
    const valid = /^\d{1,3}(?:[.,]\d{1,6})?$/.test(raw) && Number.isFinite(value) && value >= 0 && value <= 100;
    input.setAttribute('aria-invalid', String(!valid));
    document.querySelector('#demo-error').textContent = valid ? '' : 'Digite um desconto de 0 a 100.';
    if (!valid) { outputs.forEach(id => document.getElementById(id).textContent = '—'); document.querySelector('#sobra-final').classList.remove('negative'); return; }
    const discount = cents(50 * value / 100);
    const price = cents(50 - discount); const fee = cents(price * .05); const remainder = cents(price - fee - 35);
    [price, fee, remainder].forEach((n, i) => document.getElementById(outputs[i]).textContent = money(n));
    document.querySelector('#sobra-final').classList.toggle('negative', remainder < 0);
  });
})();
