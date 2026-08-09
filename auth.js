// Controle da sessao na pagina de autenticacao.
(function controlarAutenticacao() {
    const authPage = document.querySelector('[data-auth-page]');

    if (!authPage || authPage.dataset.authControllerReady === 'true') {
        return;
    }

    authPage.dataset.authControllerReady = 'true';

    const supabaseClient = window.CyberVoidSupabase;
    const tabs = authPage.querySelectorAll('[data-auth-tab]');
    const panels = authPage.querySelectorAll('[data-auth-panel]');
    const loginForm = authPage.querySelector('[data-login-form]');
    const signupForm = authPage.querySelector('[data-signup-form]');
    const loginMessage = authPage.querySelector('[data-login-message]');
    const signupMessage = authPage.querySelector('[data-signup-message]');
    const generalMessage = authPage.querySelector('[data-auth-general-message]');
    const returnPath = obterRetornoSeguro();
    const redirectTo = 'http://127.0.0.1:5500/auth.html?return=' + encodeURIComponent(returnPath);
    let loginSending = false;
    let signupSending = false;

    function obterRetornoSeguro() {
        const params = new URLSearchParams(window.location.search);
        const value = params.get('return') || '';

        if (!value) {
            return 'index.html';
        }

        try {
            const url = new URL(value, window.location.origin);

            if (url.origin !== window.location.origin) {
                return 'index.html';
            }

            const path = url.pathname.replace(/^\//, '');
            const allowed = ['index.html', 'cyberfeed.html', 'auth.html'];

            if (!allowed.includes(path)) {
                return 'index.html';
            }

            if (path === 'cyberfeed.html') {
                const view = url.searchParams.get('view') || 'feed';

                if (!['feed', 'me', 'profile'].includes(view)) {
                    return 'cyberfeed.html?view=feed';
                }
            }

            return path + url.search;
        } catch (_error) {
            return 'index.html';
        }
    }

    function limparTokensDaUrl() {
        if (window.location.hash) {
            const suffix = returnPath !== 'index.html' ? '?return=' + encodeURIComponent(returnPath) : '';
            const cleanUrl = window.location.origin + window.location.pathname + suffix;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    function mostrarMensagem(element, text, type) {
        if (!element) {
            return;
        }

        element.textContent = text;
        element.dataset.type = type || 'info';
    }

    function traduzirErro(message) {
        const text = String(message || '').toLowerCase();

        if (text.includes('invalid login credentials')) {
            return 'E-mail ou senha incorretos.';
        }

        if (text.includes('email not confirmed')) {
            return 'Confirme seu e-mail antes de entrar no Void.';
        }

        if (text.includes('user already registered') || text.includes('already registered')) {
            return 'Este e-mail já está cadastrado. Tente entrar na sua conta.';
        }

        if (text.includes('password')) {
            return 'Verifique a senha informada e tente novamente.';
        }

        if (text.includes('rate limit')) {
            return 'Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.';
        }

        return message || 'Não foi possível completar a ação agora.';
    }

    // Validacao dos formularios.
    function emailValido(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validarLogin(email, password) {
        if (!email || !password) {
            return 'Preencha e-mail e senha.';
        }

        if (!emailValido(email)) {
            return 'Informe um e-mail válido.';
        }

        return '';
    }

    function validarCadastro(name, email, password, confirmPassword) {
        if (!name || !email || !password || !confirmPassword) {
            return 'Preencha todos os campos.';
        }

        if (name.length < 1 || name.length > 50) {
            return 'O nome deve ter entre 1 e 50 caracteres.';
        }

        if (!emailValido(email)) {
            return 'Informe um e-mail válido.';
        }

        if (password.length < 8) {
            return 'A senha precisa ter pelo menos 8 caracteres.';
        }

        if (password !== confirmPassword) {
            return 'A confirmação precisa ser igual à senha.';
        }

        return '';
    }

    function alternarPainel(target) {
        tabs.forEach(function (tab) {
            const active = tab.dataset.authTab === target;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        panels.forEach(function (panel) {
            panel.hidden = panel.dataset.authPanel !== target;
        });

        mostrarMensagem(loginMessage, '', 'info');
        mostrarMensagem(signupMessage, '', 'info');
    }

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            alternarPainel(tab.dataset.authTab);
        });
    });

    if (!supabaseClient) {
        mostrarMensagem(generalMessage, 'Não foi possível preparar o acesso agora. Tente recarregar a página.', 'error');
        return;
    }

    supabaseClient.auth.getSession()
        .then(function (result) {
            limparTokensDaUrl();

            if (result.data.session) {
                window.location.href = returnPath;
            }
        })
        .catch(function () {
            mostrarMensagem(generalMessage, 'Não foi possível verificar sua sessão agora.', 'error');
        });

    // Login.
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        if (loginSending) {
            return;
        }

        const formData = new FormData(loginForm);
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '');
        const validationError = validarLogin(email, password);

        if (validationError) {
            mostrarMensagem(loginMessage, validationError, 'error');
            return;
        }

        loginSending = true;
        loginForm.querySelector('button[type="submit"]').disabled = true;
        mostrarMensagem(loginMessage, 'Entrando no Void...', 'info');

        supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        })
            .then(function (result) {
                if (result.error) {
                    mostrarMensagem(loginMessage, traduzirErro(result.error.message), 'error');
                    return;
                }

                window.location.href = returnPath;
            })
            .catch(function () {
                mostrarMensagem(loginMessage, 'Não foi possível entrar agora. Tente novamente.', 'error');
            })
            .finally(function () {
                loginSending = false;
                loginForm.querySelector('button[type="submit"]').disabled = false;
            });
    });

    // Cadastro.
    signupForm.addEventListener('submit', function (event) {
        event.preventDefault();

        if (signupSending) {
            return;
        }

        const formData = new FormData(signupForm);
        const displayName = String(formData.get('display_name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '');
        const confirmPassword = String(formData.get('confirm_password') || '');
        const validationError = validarCadastro(displayName, email, password, confirmPassword);

        if (validationError) {
            mostrarMensagem(signupMessage, validationError, 'error');
            return;
        }

        signupSending = true;
        signupForm.querySelector('button[type="submit"]').disabled = true;
        mostrarMensagem(signupMessage, 'Criando sua identidade...', 'info');

        supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: redirectTo,
                data: {
                    display_name: displayName
                }
            }
        })
            .then(function (result) {
                if (result.error) {
                    mostrarMensagem(signupMessage, traduzirErro(result.error.message), 'error');
                    return;
                }

                signupForm.reset();
                mostrarMensagem(
                    signupMessage,
                    'Cadastro realizado. Verifique seu e-mail para confirmar sua identidade no Void.',
                    'success'
                );
            })
            .catch(function () {
                mostrarMensagem(signupMessage, 'Não foi possível criar a conta agora. Tente novamente.', 'error');
            })
            .finally(function () {
                signupSending = false;
                signupForm.querySelector('button[type="submit"]').disabled = false;
            });
    });

    supabaseClient.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_IN') {
            limparTokensDaUrl();
        }
    });
}());
