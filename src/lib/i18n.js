import { ref, computed } from 'vue'

const LANGS = {
  en: {
    nav_gallery:'Gallery', nav_next_event:'Next Event', nav_history:'History',
    nav_calendar:'Calendar', nav_results:'Results', nav_join:'Join Us',
    nav_contribute:'✦ Contribute',
    logo_subtitle:'Fan Club · Founded in Helsinki',
    logo_tagline:"Ici c'est Paris — from the North",
    section_next_event:'Next Event', section_gallery:'Gallery',
    section_results:'Results', section_calendar:'Calendar', section_history:'History',
    history_add:'+ Share Your Memory',
    join_title:'Join the Family',
    join_title_span:'Family',
    join_sub:'Scan the QR code below to join the Helsinki PSG Supporters Club. Become part of the community, get notified of events, and watch matches with fellow Parisiens in Helsinki.',
    qr_label:'Scan to join · Helsinki PSG Fan Club',
    cal_home:'Home', cal_away:'Away', cal_neutral:'Neutral',
    event_badge:'⚑ Next Event', map_link:'View on Google Maps', map_sm:'Map →',
    modal_title:'Contribute', modal_sub:'Enter your email to access the member area. Only approved members can submit content.',
    modal_email_label:'Your Email Address', modal_email_placeholder:'your@email.com',
    modal_continue:'Continue →', modal_not_found:'This email is not registered. Please join via the QR code first.',
    modal_what:'What to share?', modal_what_sub:'Choose the type of content you want to submit.',
    modal_publish:'Publish Now', modal_back:'← Back',
    modal_success:'Submitted successfully!', modal_success_sub:'Thank you for contributing to the Helsinki PSG fan club.',
    type_history:'Memory / History', type_history_desc:'A story, photo or video from your fan life',
    type_gallery:'Gallery Photo', type_gallery_desc:'A photo for the fan club gallery',
    type_comment:'Match Comment', type_comment_desc:'Your reaction to a recent match',
    type_event:'Suggest an Event', type_event_desc:'Propose a fan club gathering',
  },
  fr: {
    nav_gallery:'Galerie', nav_next_event:'Prochain Événement', nav_history:'Histoire',
    nav_calendar:'Calendrier', nav_results:'Résultats', nav_join:'Rejoindre',
    nav_contribute:'✦ Contribuer',
    logo_subtitle:'Fan Club · Fondé à Helsinki',
    logo_tagline:"Ici c'est Paris — depuis le Nord",
    section_next_event:'Prochain Événement', section_gallery:'Galerie',
    section_results:'Résultats', section_calendar:'Calendrier', section_history:'Histoire',
    history_add:'+ Partager un Souvenir',
    join_title:'Rejoins la Famille',
    join_title_span:'Famille',
    join_sub:"Scanne le QR code pour rejoindre le Helsinki PSG Supporters Club. Rejoins la communauté, sois informé des événements et regarde les matchs avec d'autres Parisiens à Helsinki.",
    qr_label:'Scanner pour rejoindre · Helsinki PSG',
    cal_home:'Domicile', cal_away:'Extérieur', cal_neutral:'Neutre',
    event_badge:'⚑ Prochain Événement', map_link:'Voir sur Google Maps', map_sm:'Carte →',
    modal_title:'Contribuer', modal_sub:"Entrez votre email pour accéder à l'espace membre. Seuls les membres approuvés peuvent soumettre du contenu.",
    modal_email_label:'Votre adresse email', modal_email_placeholder:'votre@email.com',
    modal_continue:'Continuer →', modal_not_found:"Cet email n'est pas enregistré. Rejoignez d'abord via le QR code.",
    modal_what:'Que partager ?', modal_what_sub:'Choisissez le type de contenu à soumettre.',
    modal_publish:'Publier', modal_back:'← Retour',
    modal_success:'Soumis avec succès !', modal_success_sub:'Merci de contribuer au fan club Helsinki PSG.',
    type_history:'Souvenir / Histoire', type_history_desc:'Une histoire, photo ou vidéo de ta vie de supporter',
    type_gallery:'Photo Galerie', type_gallery_desc:'Une photo pour la galerie du fan club',
    type_comment:'Commentaire de match', type_comment_desc:'Ta réaction après un match récent',
    type_event:'Suggérer un événement', type_event_desc:'Proposer un rassemblement du fan club',
  },
  fi: {
    nav_gallery:'Galleria', nav_next_event:'Seuraava Tapahtuma', nav_history:'Historia',
    nav_calendar:'Kalenteri', nav_results:'Tulokset', nav_join:'Liity',
    nav_contribute:'✦ Osallistu',
    logo_subtitle:'Fanikerho · Perustettu Helsingissä',
    logo_tagline:"Ici c'est Paris — pohjoisesta",
    section_next_event:'Seuraava Tapahtuma', section_gallery:'Galleria',
    section_results:'Tulokset', section_calendar:'Kalenteri', section_history:'Historia',
    history_add:'+ Jaa Muistosi',
    join_title:'Liity Perheeseen',
    join_title_span:'Perheeseen',
    join_sub:'Skannaa QR-koodi liittyäksesi Helsinki PSG Supporters Club -yhteisöön. Ole osa yhteisöä, saa tietoa tapahtumista ja katso otteluita muiden helsinkiläisten PSG-fanien kanssa.',
    qr_label:'Skannaa liittyäksesi · Helsinki PSG',
    cal_home:'Kotipeli', cal_away:'Vieraspeli', cal_neutral:'Neutraali',
    event_badge:'⚑ Seuraava Tapahtuma', map_link:'Näytä Google Mapsissa', map_sm:'Kartta →',
    modal_title:'Osallistu', modal_sub:'Anna sähköpostiosoitteesi päästäksesi jäsenalueelle. Vain hyväksytyt jäsenet voivat lähettää sisältöä.',
    modal_email_label:'Sähköpostiosoitteesi', modal_email_placeholder:'sinun@email.com',
    modal_continue:'Jatka →', modal_not_found:'Tätä sähköpostia ei ole rekisteröity. Liity ensin QR-koodin kautta.',
    modal_what:'Mitä jakaa?', modal_what_sub:'Valitse sisältötyyppi, jonka haluat lähettää.',
    modal_publish:'Julkaise', modal_back:'← Takaisin',
    modal_success:'Lähetetty onnistuneesti!', modal_success_sub:'Kiitos panoksestasi Helsinki PSG fanikerholle.',
    type_history:'Muisto / Historia', type_history_desc:'Tarina, kuva tai video fanituksesta',
    type_gallery:'Galleriakuva', type_gallery_desc:'Kuva fanikerhon galleriaan',
    type_comment:'Ottelukommentti', type_comment_desc:'Reaktiosi viimeisimpään otteluun',
    type_event:'Ehdota tapahtumaa', type_event_desc:'Ehdota fanikerhokokoontumista',
  },
  sv: {
    nav_gallery:'Galleri', nav_next_event:'Nästa Evenemang', nav_history:'Historia',
    nav_calendar:'Kalender', nav_results:'Resultat', nav_join:'Gå med',
    nav_contribute:'✦ Bidra',
    logo_subtitle:'Fanklubb · Grundad i Helsingfors',
    logo_tagline:"Ici c'est Paris — från norr",
    section_next_event:'Nästa Evenemang', section_gallery:'Galleri',
    section_results:'Resultat', section_calendar:'Kalender', section_history:'Historia',
    history_add:'+ Dela ett Minne',
    join_title:'Gå med i Familjen',
    join_title_span:'Familjen',
    join_sub:'Skanna QR-koden för att gå med i Helsinki PSG Supporters Club. Bli en del av gemenskapen, få information om evenemang och titta på matcher med andra PSG-fans i Helsingfors.',
    qr_label:'Skanna för att gå med · Helsinki PSG',
    cal_home:'Hemma', cal_away:'Borta', cal_neutral:'Neutral',
    event_badge:'⚑ Nästa Evenemang', map_link:'Visa på Google Maps', map_sm:'Karta →',
    modal_title:'Bidra', modal_sub:'Ange din e-postadress för att komma åt medlemsområdet. Endast godkända medlemmar kan skicka in innehåll.',
    modal_email_label:'Din e-postadress', modal_email_placeholder:'din@email.com',
    modal_continue:'Fortsätt →', modal_not_found:"Den här e-postadressen är inte registrerad. Gå med via QR-koden först.",
    modal_what:'Vad vill du dela?', modal_what_sub:'Välj vilken typ av innehåll du vill skicka in.',
    modal_publish:'Publicera', modal_back:'← Tillbaka',
    modal_success:'Skickat!', modal_success_sub:'Tack för ditt bidrag till Helsinki PSG fanklubb.',
    type_history:'Minne / Historia', type_history_desc:'En berättelse, bild eller video från fanlivet',
    type_gallery:'Gallerifoto', type_gallery_desc:'Ett foto till fanklubbens galleri',
    type_comment:'Matchkommentar', type_comment_desc:'Din reaktion på en nyligen spelad match',
    type_event:'Föreslå evenemang', type_event_desc:'Föreslå en sammankomst för fanklubben',
  },
}

export const currentLang = ref(localStorage.getItem('hpsg_lang') || 'en')

export function t(key) {
  return (LANGS[currentLang.value] || LANGS.en)[key] || LANGS.en[key] || key
}

export function setLang(lang) {
  currentLang.value = lang
  localStorage.setItem('hpsg_lang', lang)
}

export const LANG_KEYS = ['en', 'fr', 'fi', 'sv']

export function useI18n() {
  const translate = computed(() => (key) => t(key))
  return { t: translate, currentLang, setLang, LANG_KEYS }
}
