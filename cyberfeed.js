// Estrutura persistente da CyberFeed.
(function controlarCyberFeed() {
    const app = document.querySelector('[data-cyberfeed-app]');

    if (!app || app.dataset.cyberfeedReady === 'true') {
        return;
    }

    app.dataset.cyberfeedReady = 'true';

    const supabaseClient = window.CyberVoidSupabase;
    const profilePage = app.querySelector('[data-profile-page]');
    const profileController = window.CyberVoidProfile && window.CyberVoidProfile.mount(profilePage);
    const views = app.querySelectorAll('[data-cyberfeed-view]');
    const navItems = app.querySelectorAll('[data-cyberfeed-nav]');
    const routeButtons = app.querySelectorAll('[data-cyberfeed-route]');
    const meButtons = app.querySelectorAll('[data-cyberfeed-me]');
    const loginLinks = app.querySelectorAll('[data-cyberfeed-login], [data-cyberfeed-login-nav]');
    const authHint = app.querySelector('[data-cyberfeed-auth-hint]');
    const miniAvatar = app.querySelector('[data-cyberfeed-avatar]');
    const miniAvatarImage = app.querySelector('[data-cyberfeed-avatar-image]');
    const miniAvatarInitial = app.querySelector('[data-cyberfeed-avatar-initial]');
    const miniName = app.querySelector('[data-cyberfeed-name]');
    const viewTitle = app.querySelector('[data-cyberfeed-view-title]');
    let currentSession = null;
    let currentUserProfile = null;
    let currentRouteKey = '';

    if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }

    function uuidValido(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
    }

    function rotaAtual() {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || 'feed';

        if (view === 'me') {
            return { view: 'me' };
        }

        if (view === 'profile') {
            return {
                view: 'profile',
                user: params.get('user') || ''
            };
        }

        return { view: 'feed' };
    }

    function montarUrl(route) {
        if (route.view === 'me') {
            return 'cyberfeed.html?view=me';
        }

        if (route.view === 'profile') {
            return 'cyberfeed.html?view=profile&user=' + encodeURIComponent(route.user);
        }

        return 'cyberfeed.html?view=feed';
    }

    function chaveDaRota(route) {
        return route.view + ':' + (route.user || '');
    }

    function mostrarView(name) {
        views.forEach(function (view) {
            const active = view.dataset.cyberfeedView === name;

            view.classList.toggle('is-active', active);
            view.hidden = !active;
        });
    }

    // Título da visualização.
    function atualizarTitulo(text) {
        viewTitle.textContent = text;
    }

    function destacarNavegacao(route) {
        navItems.forEach(function (item) {
            item.classList.toggle('is-active', item.dataset.cyberfeedNav === route.view);
        });
    }

    function retornoSeguro() {
        return 'cyberfeed.html?view=me';
    }

    function irParaLogin() {
        window.location.href = 'auth.html?return=' + encodeURIComponent(retornoSeguro());
    }

    // Restauração da rolagem.
    function rolarParaTopoDaCyberFeed() {
        window.requestAnimationFrame(function () {
            window.setTimeout(function () {
                const top = app.getBoundingClientRect().top + window.scrollY - 8;
                window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
            }, 0);
        });
    }

    function navegar(route, replace) {
        const url = montarUrl(route);
        const nextKey = chaveDaRota(route);

        if (nextKey !== currentRouteKey) {
            if (replace) {
                window.history.replaceState(route, '', url);
            } else {
                window.history.pushState(route, '', url);
            }
        }

        renderizarRota(route, true);
    }

    function renderizarFeed() {
        mostrarView('feed');
        destacarNavegacao({ view: 'feed' });
        atualizarTitulo('Feed global');
        authHint.hidden = !(currentSession && currentSession.user);
    }

    function renderizarNaoEncontrado() {
        mostrarView('not-found');
        destacarNavegacao({ view: 'profile' });
        atualizarTitulo('Perfil não encontrado');
    }

    async function renderizarMeuPerfil() {
        if (!currentSession || !currentSession.user) {
            irParaLogin();
            return;
        }

        mostrarView('profile');
        destacarNavegacao({ view: 'me' });
        atualizarTitulo('Meu perfil');

        const result = await profileController.loadMe(currentSession);

        if (result && result.profile) {
            renderizarEstadoDaConta(currentSession, result.profile);
            atualizarTitulo('Meu perfil');
        }
    }

    async function renderizarPerfilPublico(userId) {
        if (!uuidValido(userId)) {
            renderizarNaoEncontrado();
            return;
        }

        mostrarView('profile');
        destacarNavegacao({ view: 'profile' });
        atualizarTitulo('Perfil');

        try {
            const result = await profileController.loadPublic(userId, currentSession);

            if (!result || result.notFound) {
                renderizarNaoEncontrado();
                return;
            }

            if (result.profile && result.profile.username) {
                atualizarTitulo('@' + result.profile.username);
            }
        } catch (_error) {
            renderizarNaoEncontrado();
        }
    }

    // Roteamento interno.
    function renderizarRota(route, shouldScroll) {
        currentRouteKey = chaveDaRota(route);

        if (route.view === 'me') {
            renderizarMeuPerfil().then(function () {
                if (shouldScroll) {
                    rolarParaTopoDaCyberFeed();
                }
            });
            return;
        }

        if (route.view === 'profile') {
            renderizarPerfilPublico(route.user).then(function () {
                if (shouldScroll) {
                    rolarParaTopoDaCyberFeed();
                }
            });
            return;
        }

        renderizarFeed();
        if (shouldScroll) {
            rolarParaTopoDaCyberFeed();
        }
    }

    miniAvatarImage.addEventListener('error', function () {
        miniAvatarImage.hidden = true;
        miniAvatarImage.removeAttribute('src');
        miniAvatar.classList.remove('has-image');
    });

    function definirAvatarDaBarra(profile) {
        const name = profile && (profile.display_name || profile.username) ? (profile.display_name || profile.username) : 'Meu perfil';
        const initial = name.trim().charAt(0).toUpperCase() || 'V';
        const avatarUrl = profile && profile.avatar_url ? String(profile.avatar_url).trim() : '';

        miniAvatarInitial.textContent = initial;

        // Avatar da barra.
        if (avatarUrl && avatarUrl !== 'null' && avatarUrl !== 'undefined') {
            miniAvatarImage.src = avatarUrl;
            miniAvatarImage.hidden = false;
            miniAvatar.classList.add('has-image');
            return;
        }

        miniAvatarImage.hidden = true;
        miniAvatarImage.removeAttribute('src');
        miniAvatar.classList.remove('has-image');
    }

    // Estado da sessão.
    function renderizarEstadoDaConta(session, profile, loading) {
        const logged = Boolean(session && session.user);

        currentSession = session || null;
        currentUserProfile = logged ? (profile || currentUserProfile) : null;

        if (loading) {
            meButtons.forEach(function (button) {
                button.hidden = true;
            });
            loginLinks.forEach(function (link) {
                link.hidden = true;
            });
            navItems.forEach(function (item) {
                if (item.dataset.cyberfeedNav === 'me') {
                    item.hidden = true;
                }
            });
            return;
        }

        meButtons.forEach(function (button) {
            button.hidden = !logged;
        });

        loginLinks.forEach(function (link) {
            link.hidden = logged;
        });

        navItems.forEach(function (item) {
            if (item.dataset.cyberfeedNav === 'me') {
                item.hidden = !logged;
            }
        });

        if (!logged) {
            miniName.textContent = 'Meu perfil';
            definirAvatarDaBarra(null);
            return;
        }

        const name = currentUserProfile && (currentUserProfile.display_name || currentUserProfile.username)
            ? (currentUserProfile.display_name || currentUserProfile.username)
            : 'Meu perfil';

        miniName.textContent = name;
        definirAvatarDaBarra(currentUserProfile);
    }

    async function atualizarSessao(session) {
        renderizarEstadoDaConta(null, null, true);

        if (session && session.user) {
            try {
                const result = await supabaseClient
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .eq('id', session.user.id)
                    .maybeSingle();

                renderizarEstadoDaConta(session, result.error ? null : result.data);
            } catch (_error) {
                renderizarEstadoDaConta(session, null);
            }
        } else {
            renderizarEstadoDaConta(null, null);
        }

        renderizarRota(rotaAtual(), false);
    }

    routeButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            if (button.dataset.cyberfeedRoute === 'me') {
                navegar({ view: 'me' });
                return;
            }

            navegar({ view: 'feed' });
        });
    });

    meButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            navegar({ view: 'me' });
        });
    });

    navItems.forEach(function (item) {
        item.addEventListener('click', function () {
            if (item.dataset.cyberfeedNav === 'me') {
                navegar({ view: 'me' });
                return;
            }

            navegar({ view: 'feed' });
        });
    });

    // Navegação pelo histórico.
    window.addEventListener('popstate', function () {
        renderizarRota(rotaAtual(), true);
    });

    if (!supabaseClient || !profileController) {
        renderizarEstadoDaConta(null, null, false);
        renderizarFeed();
        return;
    }

    // Controle da sessão.
    supabaseClient.auth.getSession()
        .then(function (result) {
            return atualizarSessao(result.data.session);
        })
        .catch(function () {
            renderizarFeed();
        });

    supabaseClient.auth.onAuthStateChange(function (_event, session) {
        atualizarSessao(session);
    });

    window.addEventListener('cybervoid-profile-updated', function (event) {
        if (currentSession && event.detail && event.detail.profile && event.detail.profile.id === currentSession.user.id) {
            renderizarEstadoDaConta(currentSession, event.detail.profile);
        }
    });
}());
