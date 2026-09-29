const STORAGE_KEY = 'preferred-language';

const FLAGS = {
  en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 10" aria-hidden="true">
    <rect width="19" height="10" fill="#b22234"/>
    <path fill="#fff" d="M0 1h19v1H0zm0 2h19v1H0zm0 2h19v1H0zm0 2h19v1H0zm0 2h19v1H0z"/>
    <rect width="8" height="5.5" fill="#3c3b6e"/>
  </svg>`,
  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" aria-hidden="true">
    <rect width="3" height="2" fill="#c60b1e"/>
    <rect width="3" height="1" y="0.5" fill="#ffc400"/>
  </svg>`,
};

const LANGUAGES = [
  { id: 'es', label: 'Spanish', lang: 'es' },
  { id: 'en', label: 'English', lang: 'en' },
];

function readLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.some((language) => language.id === stored)) return stored;
  } catch {
    // Storage can be blocked; English stays selected.
  }
  return 'en';
}

function storeLanguage(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Ignore storage failures and keep the choice for this page.
  }
}

function createFlag(id) {
  const flag = document.createElement('span');
  flag.className = 'nav-lang-flag';
  flag.setAttribute('aria-hidden', 'true');
  flag.innerHTML = FLAGS[id];
  return flag;
}

/**
 * Language menu shown after My Account.
 * @param {HTMLElement} navTools
 */
export default function renderLanguageSwitcher(navTools) {
  const wrapper = document.createElement('div');
  wrapper.className = 'language-wrapper nav-tools-wrapper';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-language-button';
  button.setAttribute('aria-haspopup', 'menu');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'nav-language-menu');

  const currentFlag = createFlag('en');
  const label = document.createElement('span');
  label.className = 'nav-tool-label';
  button.append(currentFlag, label);

  const panel = document.createElement('div');
  panel.className = 'nav-lang-panel nav-tools-panel';
  panel.id = 'nav-language-menu';

  const menu = document.createElement('ul');
  menu.className = 'nav-lang-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Language');

  LANGUAGES.forEach((language) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'nav-lang-option';
    option.setAttribute('role', 'menuitemradio');
    option.dataset.lang = language.id;
    option.append(createFlag(language.id), document.createTextNode(language.label));
    item.append(option);
    menu.append(item);
  });

  panel.append(menu);
  wrapper.append(button, panel);
  navTools.append(wrapper);

  const options = [...menu.querySelectorAll('.nav-lang-option')];

  function setOpen(open) {
    panel.classList.toggle('nav-tools-panel--show', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function applyLanguage(id) {
    const language = LANGUAGES.find((entry) => entry.id === id) || LANGUAGES[1];
    label.textContent = language.label;
    button.setAttribute('aria-label', `Language, ${language.label}`);
    currentFlag.innerHTML = FLAGS[language.id];
    document.documentElement.lang = language.lang;
    options.forEach((option) => {
      const selected = option.dataset.lang === language.id;
      option.setAttribute('aria-checked', selected ? 'true' : 'false');
    });
    storeLanguage(language.id);
  }

  applyLanguage(readLanguage());

  button.addEventListener('click', () => {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      applyLanguage(option.dataset.lang);
      setOpen(false);
      button.focus();
    });
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
}
