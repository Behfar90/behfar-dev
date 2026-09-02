import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import './cookieConsent.css';

CookieConsent.run({
  guiOptions: {
    consentModal: {
      layout: 'box',
      position: 'bottom right',
      equalWeightButtons: true,
    },
  },
  categories: {
    necessary: { readOnly: true },
    analytics: {},
  },
  language: {
    default: 'en',
    translations: {
      en: {
        consentModal: {
          title: 'A quick note',
          description: 'This site uses Google Analytics to understand traffic. Nothing is sold or shared beyond that.',
          acceptAllBtn: 'Accept',
          acceptNecessaryBtn: 'Decline',
        },
      },
    },
  },
});
