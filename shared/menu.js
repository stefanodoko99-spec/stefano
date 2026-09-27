// The menu ("Menuja"): every service and its starting price, in euros, the
// same 24 lines as the flyers and the Instagram carousel (flyer/menuja.html,
// flyer/instagram.html). The site's rate card starts from it (shared/settings.js
// defaults), and the admin's rates panel can put it back as a draft. The
// Albanian is the flyers' own; the English and the Italian say the same.
// Five lines were added on 2026-09-25 at estimated prices, not confirmed: fixing
// a site, the full identity, the flyer or poster, the posting calendar and the
// email campaign.
const r = (group, price, name, desc, unit) => ({ group, price, from: true, best: false, name, desc, unit: unit || { en: '', sq: '', it: '' } });
// the best options: the lines the front page offers first (2026-09-28), ticked
// in the admin; the menu starts with a site to begin with, the business's site
// (like barmartiri.com) and the online shop (like elixir.al)
const best = (it) => ({ ...it, best: true });

export const MENU_CURRENCY = 'EUR';

export const MENU = [
  best(r('sites', 150,
    { en: 'The front page', sq: 'Faqja e parë', it: 'La prima pagina' },
    { en: 'A single page: buttons for WhatsApp and the phone, and a map on Google.', sq: 'Një faqe e vetme: butona për WhatsApp dhe telefon, harta në Google.', it: 'Una pagina sola: pulsanti per WhatsApp e il telefono, e la mappa su Google.' })),
  best(r('sites', 400,
    { en: 'The business', sq: 'Biznesi', it: 'L’attività' },
    { en: '4 to 6 pages in up to three languages, a menu or price list, a gallery and a Google Maps profile. Like barmartiri.com.', sq: '4–6 faqe, deri në tri gjuhë, menu ose çmimore, galeri, profil në Google Maps. Si barmartiri.com.', it: 'Da 4 a 6 pagine, fino a tre lingue, menù o listino, galleria e profilo su Google Maps. Come barmartiri.com.' })),
  r('sites', 1000,
    { en: 'Premium', sq: 'Premium', it: 'Premium' },
    { en: 'A design all its own, with motion, like this site: the one that sets you apart.', sq: 'Dizajn unik me animacion, si kjo faqe: faqja që të dallon nga të tjerët.', it: 'Un design tutto suo, con animazioni, come questo sito: quello che ti distingue dagli altri.' }),
  best(r('sites', 1200,
    { en: 'The online shop', sq: 'Dyqani online', it: 'Il negozio online' },
    { en: 'A product catalogue, a basket, and orders by WhatsApp or cash on delivery. Like elixir.al.', sq: 'Katalog produktesh, shportë, porosi me WhatsApp ose pagesë në dorëzim. Si elixir.al.', it: 'Catalogo prodotti, carrello, ordini via WhatsApp o pagamento alla consegna. Come elixir.al.' })),
  r('sites', 2500,
    { en: 'The shop with a panel', sq: 'Dyqani me panel', it: 'Il negozio con pannello' },
    { en: 'A panel for products and orders, an email for every order, and card payments through the bank.', sq: 'Panel për produktet dhe porositë, email për çdo porosi, pagesë me kartë përmes bankës.', it: 'Un pannello per prodotti e ordini, un’email per ogni ordine, pagamento con carta tramite la banca.' }),
  r('sites', 80,
    { en: 'Fixing a site', sq: 'Rregullimi i faqes', it: 'Sistemare un sito' },
    { en: 'For the site you already have: faster, right on the phone, and found on Google.', sq: 'Për faqen që ke tashmë: më e shpejtë, e rregullt në telefon dhe që gjendet në Google.', it: 'Per il sito che hai già: più veloce, a posto sul telefono e trovato su Google.' }),

  r('design', 100,
    { en: 'Logo', sq: 'Logo', it: 'Logo' },
    { en: 'A simple logo in the business’s own colours and letters.', sq: 'Logo e thjeshtë me ngjyrat dhe shkronjat e biznesit.', it: 'Un logo semplice con i colori e le lettere dell’attività.' }),
  r('design', 250,
    { en: 'The full identity', sq: 'Identiteti i plotë', it: 'L’identità completa' },
    { en: 'Logo, colours, type, a brand guide and the business card.', sq: 'Logo, ngjyrat, shkronjat, udhëzuesi i markës dhe kartëvizita.', it: 'Logo, colori, caratteri, una guida del marchio e il biglietto da visita.' }),
  r('design', 50,
    { en: 'Menu for print', sq: 'Menu për shtyp', it: 'Menù da stampare' },
    { en: 'For the bar or the restaurant, ready for the printer.', sq: 'Për barin ose restorantin, gati për shtypshkronjën.', it: 'Per il bar o il ristorante, pronto per la tipografia.' }),
  r('design', 40,
    { en: 'Flyer or poster', sq: 'Fletushkë ose poster', it: 'Volantino o poster' },
    { en: 'Ready for the printer, as a PDF.', sq: 'Gati për shtypshkronjën, në PDF.', it: 'Pronto per la tipografia, in PDF.' }),
  r('design', 50,
    { en: 'Instagram templates', sq: 'Shabllone për Instagram', it: 'Modelli per Instagram' },
    { en: 'Posts in the business’s style, ready to fill in.', sq: 'Postime me stilin e biznesit, gati për t’i mbushur.', it: 'Post nello stile dell’attività, pronti da riempire.' }),

  r('marketing', 30,
    { en: 'Google profile', sq: 'Profili në Google', it: 'Profilo su Google' },
    { en: 'Your Google Maps profile, opened and verified.', sq: 'Hapja dhe verifikimi i profilit në Google Maps.', it: 'Apertura e verifica del profilo su Google Maps.' }),
  r('marketing', 50,
    { en: 'Posting calendar', sq: 'Kalendari i postimeve', it: 'Calendario dei post' },
    { en: 'The month’s posts planned, with the captions written.', sq: 'Plani i postimeve të muajit, me tekstet gati.', it: 'I post del mese pianificati, con i testi pronti.' },
    { en: 'month', sq: 'muaj', it: 'mese' }),
  r('marketing', 40,
    { en: 'Email campaign', sq: 'Fushatë me email', it: 'Campagna email' },
    { en: 'The words and the design of one email to the business’s customers.', sq: 'Teksti dhe dizajni i një email-i për klientët e biznesit.', it: 'Testo e grafica di un’email ai clienti dell’attività.' }),

  r('extras', 80,
    { en: 'Another language', sq: 'Gjuhë shtesë', it: 'Un’altra lingua' },
    { en: 'Italian, German or any language your tourists speak.', sq: 'Italisht, gjermanisht ose çdo gjuhë për turistët.', it: 'Italiano, tedesco o qualsiasi lingua dei turisti.' }),
  r('extras', 30,
    { en: 'Another page', sq: 'Faqe shtesë', it: 'Un’altra pagina' },
    { en: 'A service, an offer or a new page.', sq: 'Një shërbim, një ofertë ose një faqe e re.', it: 'Un servizio, un’offerta o una pagina nuova.' }),
  r('extras', 50,
    { en: 'Product upload', sq: 'Ngarkim produktesh', it: 'Caricamento prodotti' },
    { en: 'Products put into the shop, with name, price and description.', sq: 'Produktet në dyqan, me emër, çmim dhe përshkrim.', it: 'I prodotti nel negozio, con nome, prezzo e descrizione.' },
    { en: '50 products', sq: '50 copë', it: '50 prodotti' }),
  r('extras', 1,
    { en: 'Product photos', sq: 'Fotot e produkteve', it: 'Foto dei prodotti' },
    { en: 'The background taken out and the photo cleaned, so the whole shop looks alike.', sq: 'Heqja e sfondit dhe pastrimi, që dyqani të duket i njëjtë.', it: 'Sfondo rimosso e foto ripulita, perché il negozio sembri tutto uguale.' },
    { en: 'photo', sq: 'foto', it: 'foto' }),

  r('monthly', 10,
    { en: 'Maintenance', sq: 'Mirëmbajtja', it: 'Manutenzione' },
    { en: 'Hosting, the domain, backups and small changes.', sq: 'Hostim, domain, kopje rezervë, ndryshime të vogla.', it: 'Hosting, dominio, copie di sicurezza e piccole modifiche.' }),
  r('monthly', 30,
    { en: 'Business care', sq: 'Kujdesi i biznesit', it: 'Cura dell’attività' },
    { en: 'Maintenance, plus an hour of changes and posts on Google.', sq: 'Mirëmbajtja, plus një orë ndryshime dhe postime në Google.', it: 'Manutenzione, più un’ora di modifiche e post su Google.' }),
  r('monthly', 60,
    { en: 'Shop care', sq: 'Kujdesi i dyqanit', it: 'Cura del negozio' },
    { en: 'New products, prices and offers, and a check on Google.', sq: 'Produkte të reja, çmime, oferta dhe kontroll në Google.', it: 'Nuovi prodotti, prezzi e offerte, e un controllo su Google.' }),
  r('monthly', 80,
    { en: 'Local SEO', sq: 'SEO lokale', it: 'SEO locale' },
    { en: 'More reviews, fresh content and a report every month.', sq: 'Më shumë vlerësime, përmbajtje e re dhe raport çdo muaj.', it: 'Più recensioni, contenuti nuovi e un resoconto ogni mese.' }),
  r('monthly', 100,
    { en: 'Instagram ads', sq: 'Reklama në Instagram', it: 'Pubblicità su Instagram' },
    { en: 'Ads on Instagram and Facebook. The ad budget is paid separately.', sq: 'Reklama në Instagram dhe Facebook. Buxheti i reklamave paguhet veçmas.', it: 'Annunci su Instagram e Facebook. Il budget pubblicitario si paga a parte.' }),

  r('season', 50,
    { en: 'The season package', sq: 'Paketa e sezonit', it: 'Il pacchetto di stagione' },
    { en: 'For beach bars, April to May: new prices, menu and photos before the summer.', sq: 'Për barët e plazhit, prill–maj: çmime, menu dhe foto të reja para verës.', it: 'Per i bar sulla spiaggia, aprile–maggio: prezzi, menù e foto nuovi prima dell’estate.' }),
];
