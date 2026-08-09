// Atualizacao do terceiro card.
(function controlarCardDeSessao() {
    const card = document.querySelector('[data-auth-card]');

    if (!card || card.dataset.authControllerReady === 'true') {
        return;
    }

    card.dataset.authControllerReady = 'true';

    const title = card.querySelector('[data-auth-card-title]');
    const description = card.querySelector('[data-auth-card-description]');
    const button = card.querySelector('[data-auth-card-button]');
    const supabaseClient = window.CyberVoidSupabase;

    function aplicarEstadoVisitante() {
        card.href = 'auth.html';
        title.textContent = 'Entre no Void';
        description.textContent = 'Acesse sua conta para publicar, interagir e construir sua identidade na rede.';
        button.textContent = 'Entrar ou criar conta';
        card.classList.remove('auth-card-pending');
        card.setAttribute('aria-busy', 'false');
    }

    function aplicarEstadoUsuario() {
        card.href = 'cyberfeed.html?view=me';
        title.textContent = 'Meu perfil';
        description.textContent = 'Acesse sua identidade, publicações e conexões na CyberFeed.';
        button.textContent = 'Ver meu perfil';
        card.classList.remove('auth-card-pending');
        card.setAttribute('aria-busy', 'false');
    }

    function atualizarCard(session) {
        if (session && session.user) {
            aplicarEstadoUsuario();
            return;
        }

        aplicarEstadoVisitante();
    }

    if (!supabaseClient) {
        aplicarEstadoVisitante();
        return;
    }

    card.setAttribute('aria-busy', 'true');

    // Controle da sessao.
    supabaseClient.auth.getSession()
        .then(function (result) {
            atualizarCard(result.data.session);
        })
        .catch(function () {
            aplicarEstadoVisitante();
        });

    supabaseClient.auth.onAuthStateChange(function (_event, session) {
        atualizarCard(session);
    });
}());
