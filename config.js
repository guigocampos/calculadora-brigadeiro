// Só habilite o checkout após cumprir o checklist de lançamento no README.
window.SITE_CONFIG = {
  checkoutUrl: '',
  launchReady: false,
  siteUrl: '',
  // Só códigos de campanha, nunca nomes, e-mails ou outros dados pessoais.
  utmAllowlist: {
    utm_source: ['instagram', 'youtube'],
    utm_medium: ['organic', 'social'],
    utm_campaign: ['primeiro_teste'],
    utm_content: ['lote', 'desconto', 'embalagem'],
    utm_term: []
  },
  analytics: {
    enabled: false,
    measurementId: ''
  }
};
