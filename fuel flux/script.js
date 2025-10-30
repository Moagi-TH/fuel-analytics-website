// FUEL FLUX — minimal interactivity

(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.menu');
  const year = document.getElementById('year');
  const demoOpen = document.querySelector('[data-open-demo]');
  const modal = document.querySelector('[data-modal]');
  const modalClose = document.querySelector('[data-close]');
  // Auth modal controls
  const openAuthBtn = document.querySelector('[data-open-auth]');
  const authModal = document.querySelector('[data-auth-modal]');
  const closeAuthBtn = document.querySelector('[data-close-auth]');
  const authForm = document.querySelector('[data-auth-form]');
  const toggleAuthBtn = document.querySelector('[data-toggle-auth]');
  const authSubmitBtn = document.querySelector('[data-auth-submit]');
  const authModeLabel = document.querySelector('[data-auth-mode-label]');
  const authError = document.getElementById('auth-error');
  const authSuccess = document.getElementById('auth-success');
  const authHint = document.getElementById('auth-hint');
  const passwordField = document.querySelector('[data-password-field]');
  const toggleMagicBtn = document.querySelector('[data-toggle-magic]');
  const signedOutEls = document.querySelectorAll('.auth-when-signed-out');
  const signedInContainer = document.querySelector('[data-account]');
  const userEmailEl = document.querySelector('[data-user-email]');
  const signoutBtn = document.querySelector('[data-signout]');
  // Config modal
  const openConfigBtn = document.querySelector('[data-open-config]');
  const configModal = document.querySelector('[data-config-modal]');
  const closeConfigBtn = document.querySelector('[data-close-config]');
  const configForm = document.querySelector('[data-config-form]');
  const clearConfigBtn = document.querySelector('[data-clear-config]');
  const configNote = document.getElementById('config-note');

  // Supabase client (placeholder keys)
  function getStored(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
  }
  function setStored(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  }
  function clearStored(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }

  const SUPABASE_URL = window.SUPABASE_URL || getStored('fi_supabase_url', 'https://YOUR-PROJECT.ref.supabase.co');
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || getStored('fi_supabase_key', 'YOUR-ANON-KEY');
  const supabase = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
  let authMode = 'sign-in'; // or 'sign-up'
  let useMagic = false;

  // Footer year
  if (year) year.textContent = new Date().getFullYear();

  // Mobile menu toggle
  if (navToggle && menu) {
    navToggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close when clicking a link
    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Smooth scroll for in-page anchors
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Demo modal
  if (demoOpen && modal && typeof modal.showModal === 'function') {
    demoOpen.addEventListener('click', () => modal.showModal());
  }
  if (modal && modalClose) {
    modalClose.addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => {
      const dialogRect = modal.querySelector('.modal-body').getBoundingClientRect();
      if (e.clientX < dialogRect.left || e.clientX > dialogRect.right || e.clientY < dialogRect.top || e.clientY > dialogRect.bottom) {
        modal.close();
      }
    });
  }

  // Auth modal open/close
  if (openAuthBtn && authModal && typeof authModal.showModal === 'function') {
    openAuthBtn.addEventListener('click', () => {
      authMode = 'sign-in';
      if (authModeLabel) authModeLabel.textContent = 'Welcome back. Enter your details.';
      if (authSubmitBtn) authSubmitBtn.textContent = 'Sign in';
      if (authError) authError.style.display = 'none';
      if (authSuccess) authSuccess.style.display = 'none';
      authModal.showModal();
    });
  }
  if (closeAuthBtn && authModal) {
    closeAuthBtn.addEventListener('click', () => authModal.close());
  }
  if (toggleAuthBtn) {
    toggleAuthBtn.addEventListener('click', () => {
      authMode = authMode === 'sign-in' ? 'sign-up' : 'sign-in';
      toggleAuthBtn.textContent = authMode === 'sign-in' ? 'Need an account? Create one' : 'Have an account? Sign in';
      if (authModeLabel) authModeLabel.textContent = authMode === 'sign-in' ? 'Welcome back. Enter your details.' : 'Create your account to get started.';
      if (authSubmitBtn) authSubmitBtn.textContent = authMode === 'sign-in' ? 'Sign in' : 'Create account';
      if (useMagic && passwordField) passwordField.style.display = 'none';
    });
  }

  if (toggleMagicBtn) {
    toggleMagicBtn.addEventListener('click', () => {
      useMagic = !useMagic;
      if (passwordField) passwordField.style.display = useMagic ? 'none' : 'grid';
      if (authSubmitBtn) authSubmitBtn.textContent = useMagic ? 'Send magic link' : (authMode === 'sign-in' ? 'Sign in' : 'Create account');
      toggleMagicBtn.textContent = useMagic ? 'Use password' : 'Use magic link';
      if (authHint) {
        authHint.style.display = useMagic ? 'block' : 'none';
        authHint.textContent = useMagic ? 'We will email you a secure link to sign in. No password needed.' : '';
      }
    });
  }

  // Config modal behavior
  if (openConfigBtn && configModal && typeof configModal.showModal === 'function') {
    openConfigBtn.addEventListener('click', () => configModal.showModal());
  }
  if (closeConfigBtn && configModal) {
    closeConfigBtn.addEventListener('click', () => configModal.close());
  }
  if (configForm) {
    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData(configForm);
      const url = String(form.get('url') || '').trim();
      const key = String(form.get('key') || '').trim();
      if (!url || !key) return;
      setStored('fi_supabase_url', url);
      setStored('fi_supabase_key', key);
      if (configNote) { configNote.style.display = 'block'; }
      setTimeout(() => window.location.reload(), 400);
    });
  }
  if (clearConfigBtn) {
    clearConfigBtn.addEventListener('click', () => {
      clearStored('fi_supabase_url');
      clearStored('fi_supabase_key');
      window.location.reload();
    });
  }

  function setSignedInUI(email) {
    if (signedOutEls) signedOutEls.forEach(el => el.style.display = 'none');
    if (signedInContainer) signedInContainer.style.display = 'inline-flex';
    if (userEmailEl) userEmailEl.textContent = email || '';
  }
  function setSignedOutUI() {
    if (signedOutEls) signedOutEls.forEach(el => el.style.display = 'inline-flex');
    if (signedInContainer) signedInContainer.style.display = 'none';
    if (userEmailEl) userEmailEl.textContent = '';
  }

  async function loadSession() {
    if (!supabase) return setSignedOutUI();
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      setSignedInUI(session.user.email);
    } else {
      setSignedOutUI();
    }
  }
  loadSession();

  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) setSignedInUI(session.user.email);
      else setSignedOutUI();
    });
  }

  if (authForm && supabase) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (authError) authError.style.display = 'none';
      if (authSuccess) authSuccess.style.display = 'none';
      const form = new FormData(authForm);
      const email = String(form.get('email') || '').trim();
      const password = String(form.get('password') || '');
      try {
        if (useMagic) {
          const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
          if (error) throw error;
          if (authSuccess) { authSuccess.textContent = 'Magic link sent. Check your email.'; authSuccess.style.display = 'block'; }
        } else if (authMode === 'sign-in') {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (authSuccess) { authSuccess.textContent = 'Signed in successfully.'; authSuccess.style.display = 'block'; }
          setTimeout(() => { authModal.close(); window.location.href = 'dashboard.html'; }, 500);
        } else {
          const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
          if (error) throw error;
          if (authSuccess) { authSuccess.textContent = 'Account created. Check your email to confirm.'; authSuccess.style.display = 'block'; }
        }
      } catch (err) {
        if (authError) { authError.textContent = err.message || 'Something went wrong'; authError.style.display = 'block'; }
      }
    });
  }

  if (signoutBtn && supabase) {
    signoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      // If on dashboard, bounce to home
      if (location.pathname.endsWith('dashboard.html')) {
        window.location.href = 'index.html';
      }
    });
  }
})();


