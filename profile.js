// Perfil reutilizável da CyberFeed.
(function prepararPerfilCyberVoid() {
    const bucketName = 'profile-media';
    const maxFileSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const extensionByType = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
    };

    function mountProfile(profilePage) {
        if (!profilePage || profilePage.dataset.profileControllerReady === 'true') {
            return profilePage && profilePage.cyberVoidProfileController;
        }

        profilePage.dataset.profileControllerReady = 'true';

        const supabaseClient = window.CyberVoidSupabase;
        const elements = {
            message: profilePage.querySelector('[data-profile-message]'),
            displayName: profilePage.querySelector('[data-profile-display-name]'),
            username: profilePage.querySelector('[data-profile-username]'),
            bio: profilePage.querySelector('[data-profile-bio]'),
            createdAt: profilePage.querySelector('[data-profile-created-at]'),
            avatar: profilePage.querySelector('[data-profile-avatar]'),
            avatarImage: profilePage.querySelector('[data-profile-avatar-image]'),
            avatarInitial: profilePage.querySelector('[data-profile-avatar-initial]'),
            cover: profilePage.querySelector('[data-profile-cover]'),
            coverImage: profilePage.querySelector('[data-profile-cover-image]'),
            accountSettings: profilePage.querySelector('[data-account-settings]'),
            accountSettingsOpen: profilePage.querySelector('[data-account-settings-open]'),
            accountSettingsClose: profilePage.querySelectorAll('[data-account-settings-close]'),
            email: profilePage.querySelector('[data-profile-email]'),
            editButton: profilePage.querySelector('[data-edit-profile-button]'),
            editDetailsButton: profilePage.querySelector('[data-edit-details-button]'),
            coverEditButton: profilePage.querySelector('[data-profile-cover-edit]'),
            avatarEditButton: profilePage.querySelector('[data-profile-avatar-edit]'),
            logoutButton: profilePage.querySelector('[data-logout-button]'),
            editor: profilePage.querySelector('[data-profile-editor]'),
            form: profilePage.querySelector('[data-profile-form]'),
            formMessage: profilePage.querySelector('[data-profile-form-message]'),
            saveButton: profilePage.querySelector('[data-profile-save]'),
            cancelButtons: profilePage.querySelectorAll('[data-profile-cancel]'),
            bioCount: profilePage.querySelector('[data-bio-count]'),
            avatarPreview: profilePage.querySelector('[data-avatar-preview]'),
            coverPreview: profilePage.querySelector('[data-cover-preview]'),
            avatarFileName: profilePage.querySelector('[data-avatar-file-name]'),
            coverFileName: profilePage.querySelector('[data-cover-file-name]'),
            displayInput: profilePage.querySelector('[name="display_name"]'),
            usernameInput: profilePage.querySelector('[name="username"]'),
            bioInput: profilePage.querySelector('[name="bio"]'),
            avatarInput: profilePage.querySelector('[name="avatar"]'),
            coverInput: profilePage.querySelector('[name="cover"]'),
            introBio: profilePage.querySelector('[data-profile-intro-bio]'),
            introCreated: profilePage.querySelector('[data-profile-intro-created]'),
            introUsername: profilePage.querySelector('[data-profile-intro-username]'),
            aboutName: profilePage.querySelector('[data-profile-about-name]'),
            aboutUsername: profilePage.querySelector('[data-profile-about-username]'),
            aboutCreated: profilePage.querySelector('[data-profile-about-created]'),
            tabs: profilePage.querySelectorAll('[data-profile-tab]'),
            panels: profilePage.querySelectorAll('[data-profile-panel]')
        };

        let currentUser = null;
        let currentProfile = null;
        let ownerMode = false;
        let saving = false;
        let logoutSending = false;
        let avatarPreviewUrl = '';
        let coverPreviewUrl = '';

        profilePage.dataset.activeTab = 'posts';

        function mostrarMensagem(element, text, type) {
            if (!element) {
                return;
            }

            element.textContent = text || '';
            element.dataset.type = type || 'info';
        }

        function inicialDoPerfil(profile) {
            const source = profile.display_name || profile.username || 'V';
            return source.trim().charAt(0).toUpperCase() || 'V';
        }

        function formatarData(createdAt) {
            const date = new Date(createdAt || '');

            if (Number.isNaN(date.getTime())) {
                return 'No Void desde agora';
            }

            return 'No Void desde ' + new Intl.DateTimeFormat('pt-BR', {
                month: 'long',
                year: 'numeric'
            }).format(date);
        }

        function urlValida(url) {
            const value = String(url || '').trim();

            return Boolean(value) && value !== 'null' && value !== 'undefined';
        }

        // Correção da capa vazia.
        function definirImagem(image, url) {
            if (!image) {
                return;
            }

            if (!urlValida(url)) {
                image.hidden = true;
                image.removeAttribute('src');
                return;
            }

            image.src = url;
            image.hidden = false;
        }

        elements.coverImage.addEventListener('error', function () {
            definirImagem(elements.coverImage, '');
            elements.cover.classList.remove('has-image');
        });
        elements.avatarImage.addEventListener('error', function () {
            definirImagem(elements.avatarImage, '');
            elements.avatar.classList.remove('has-image');
        });

        function aplicarControlesDoDono(isOwner) {
            ownerMode = isOwner;
            elements.editButton.hidden = !isOwner;
            elements.editDetailsButton.hidden = !isOwner;
            elements.coverEditButton.hidden = !isOwner;
            elements.avatarEditButton.hidden = !isOwner;
            elements.accountSettingsOpen.hidden = !isOwner;
            elements.accountSettings.hidden = true;
        }

        function renderizarPerfil(profile, user, isOwner) {
            const publicName = profile.display_name || 'Viajante do Void';
            const publicUsername = profile.username || 'username';
            const publicBio = profile.bio || 'Sem biografia por enquanto.';
            const joinedText = formatarData(profile.created_at);
            const initial = inicialDoPerfil(profile);

            elements.displayName.textContent = publicName;
            elements.username.textContent = '@' + publicUsername;
            elements.bio.textContent = publicBio;
            elements.createdAt.textContent = joinedText;
            elements.introBio.textContent = publicBio;
            elements.introCreated.textContent = joinedText;
            elements.introUsername.textContent = '@' + publicUsername;
            elements.aboutName.textContent = publicName;
            elements.aboutUsername.textContent = '@' + publicUsername;
            elements.aboutCreated.textContent = joinedText;
            elements.avatarInitial.textContent = initial;
            definirImagem(elements.avatarImage, profile.avatar_url);
            definirImagem(elements.coverImage, profile.cover_url);
            elements.avatar.classList.toggle('has-image', urlValida(profile.avatar_url));
            elements.cover.classList.toggle('has-image', urlValida(profile.cover_url));
            aplicarControlesDoDono(isOwner);

            // Configurações privadas da conta.
            if (isOwner && user) {
                elements.email.textContent = 'E-mail da conta: ' + (user.email || 'indisponível');
            } else {
                elements.email.textContent = '';
            }

            profilePage.classList.add('is-loaded');
            mostrarMensagem(elements.message, '', 'info');
        }

        async function buscarPerfilPorId(userId) {
            const result = await supabaseClient
                .from('profiles')
                .select('id, username, display_name, bio, avatar_url, cover_url, created_at, updated_at')
                .eq('id', userId)
                .maybeSingle();

            if (result.error) {
                throw result.error;
            }

            return result.data;
        }

        // Perfil próprio.
        async function loadMe(session) {
            if (!session || !session.user) {
                return { requiresAuth: true };
            }

            currentUser = session.user;
            mostrarMensagem(elements.message, 'Carregando sua identidade...', 'info');

            const profile = await buscarPerfilPorId(currentUser.id);
            currentProfile = profile || {
                id: currentUser.id,
                username: 'username',
                display_name: currentUser.user_metadata.display_name || 'Viajante do Void',
                bio: '',
                avatar_url: '',
                cover_url: '',
                created_at: currentUser.created_at
            };

            renderizarPerfil(currentProfile, currentUser, true);
            return { ok: true, profile: currentProfile };
        }

        // Perfil público.
        async function loadPublic(userId, session) {
            currentUser = session && session.user ? session.user : null;
            mostrarMensagem(elements.message, 'Carregando identidade...', 'info');

            const profile = await buscarPerfilPorId(userId);

            if (!profile) {
                return { notFound: true };
            }

            currentProfile = profile;
            renderizarPerfil(currentProfile, currentUser, Boolean(currentUser && currentUser.id === profile.id));
            return { ok: true, profile: currentProfile };
        }

        function normalizarUsername(value) {
            return String(value || '').trim().replace(/^@+/, '').toLowerCase();
        }

        // Validação do formulário.
        function validarFormulario(values) {
            if (!values.displayName) {
                return 'Informe seu nome de exibição.';
            }

            if (values.displayName.length > 50) {
                return 'O nome deve ter até 50 caracteres.';
            }

            if (!values.username) {
                return 'Informe seu username.';
            }

            if (!/^[a-z0-9_]{3,24}$/.test(values.username)) {
                return 'O username deve ter 3 a 24 caracteres e usar apenas letras minúsculas, números e _.';
            }

            if (values.bio.length > 300) {
                return 'A biografia deve ter no máximo 300 caracteres.';
            }

            return '';
        }

        function validarArquivo(file) {
            if (!file) {
                return '';
            }

            if (!allowedTypes.includes(file.type)) {
                return 'Use apenas imagens JPEG, PNG ou WebP.';
            }

            if (file.size > maxFileSize) {
                return 'A imagem precisa ter no máximo 5 MB.';
            }

            return '';
        }

        function revogarPreview(type) {
            if (type === 'avatar' && avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
                avatarPreviewUrl = '';
            }

            if (type === 'cover' && coverPreviewUrl) {
                URL.revokeObjectURL(coverPreviewUrl);
                coverPreviewUrl = '';
            }
        }

        function aplicarPreviewExistente() {
            const avatarImg = elements.avatarPreview.querySelector('img');
            const avatarInitial = elements.avatarPreview.querySelector('[data-avatar-preview-initial]');
            const coverImg = elements.coverPreview.querySelector('img');

            avatarInitial.textContent = inicialDoPerfil(currentProfile);
            definirImagem(avatarImg, currentProfile.avatar_url);
            definirImagem(coverImg, currentProfile.cover_url);
            elements.avatarFileName.textContent = 'Nenhum arquivo escolhido';
            elements.coverFileName.textContent = 'Nenhum arquivo escolhido';
        }

        // Prévia das imagens.
        function prepararPreview(input, type) {
            const file = input.files && input.files[0];
            const error = validarArquivo(file);
            const preview = type === 'avatar' ? elements.avatarPreview : elements.coverPreview;
            const image = preview.querySelector('img');
            const fileName = type === 'avatar' ? elements.avatarFileName : elements.coverFileName;

            if (error) {
                input.value = '';
                fileName.textContent = 'Nenhum arquivo escolhido';
                mostrarMensagem(elements.formMessage, error, 'error');
                aplicarPreviewExistente();
                return;
            }

            revogarPreview(type);

            if (!file) {
                aplicarPreviewExistente();
                return;
            }

            const url = URL.createObjectURL(file);
            fileName.textContent = file.name;

            if (type === 'avatar') {
                avatarPreviewUrl = url;
            } else {
                coverPreviewUrl = url;
            }

            image.src = url;
            image.hidden = false;
            mostrarMensagem(elements.formMessage, '', 'info');
        }

        // Editor.
        function abrirEditor(focusTarget) {
            if (!ownerMode || !currentProfile || !currentUser) {
                return;
            }

            elements.displayInput.value = currentProfile.display_name || currentUser.user_metadata.display_name || '';
            elements.usernameInput.value = normalizarUsername(currentProfile.username || '');
            elements.bioInput.value = currentProfile.bio || '';
            elements.avatarInput.value = '';
            elements.coverInput.value = '';
            elements.bioCount.textContent = String(elements.bioInput.value.length);
            aplicarPreviewExistente();
            mostrarMensagem(elements.formMessage, '', 'info');
            elements.editor.hidden = false;

            if (focusTarget === 'avatar') {
                elements.avatarInput.focus();
                return;
            }

            if (focusTarget === 'cover') {
                elements.coverInput.focus();
                return;
            }

            elements.displayInput.focus();
        }

        function fecharEditor() {
            if (saving) {
                return;
            }

            revogarPreview('avatar');
            revogarPreview('cover');
            elements.form.reset();
            elements.editor.hidden = true;
            mostrarMensagem(elements.formMessage, '', 'info');
        }

        function abrirConfiguracoes() {
            if (!ownerMode || !currentUser) {
                return;
            }

            elements.accountSettings.hidden = false;
            elements.accountSettings.querySelector('[data-account-settings-close]').focus();
        }

        function fecharConfiguracoes() {
            elements.accountSettings.hidden = true;
        }

        function alternarAba(target) {
            profilePage.dataset.activeTab = target;

            elements.tabs.forEach(function (tab) {
                const active = tab.dataset.profileTab === target;

                tab.classList.toggle('is-active', active);
                tab.setAttribute('aria-selected', active ? 'true' : 'false');
            });

            elements.panels.forEach(function (panel) {
                const active = panel.dataset.profilePanel === target;

                panel.classList.toggle('is-active', active);
                panel.hidden = !active;
            });
        }

        function criarNomeDeArquivo(userId, folder, file) {
            const ext = extensionByType[file.type];
            const unique = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);

            return userId + '/' + folder + '/' + unique + '.' + ext;
        }

        // Upload seguro.
        async function enviarArquivo(userId, folder, file) {
            if (!file) {
                return null;
            }

            const path = criarNomeDeArquivo(userId, folder, file);
            const result = await supabaseClient.storage
                .from(bucketName)
                .upload(path, file, {
                    cacheControl: '3600',
                    contentType: file.type,
                    upsert: false
                });

            if (result.error) {
                throw result.error;
            }

            const publicUrlResult = supabaseClient.storage.from(bucketName).getPublicUrl(path);

            return {
                path: path,
                publicUrl: publicUrlResult.data.publicUrl
            };
        }

        function extrairCaminhoDoBucket(publicUrl, userId) {
            if (!publicUrl) {
                return '';
            }

            try {
                const url = new URL(publicUrl);
                const marker = '/storage/v1/object/public/' + bucketName + '/';
                const markerIndex = url.pathname.indexOf(marker);

                if (markerIndex === -1) {
                    return '';
                }

                const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));

                if (!path.startsWith(userId + '/')) {
                    return '';
                }

                return path;
            } catch (_error) {
                return '';
            }
        }

        function removerArquivo(path) {
            if (!path) {
                return Promise.resolve();
            }

            return supabaseClient.storage.from(bucketName).remove([path]).then(function () {});
        }

        function traduzirErro(error) {
            const message = String(error && error.message ? error.message : error || '').toLowerCase();
            const code = String(error && error.code ? error.code : '');

            if (code === '23505' || message.includes('duplicate') || message.includes('unique')) {
                return 'Esse username já está sendo usado por outra pessoa.';
            }

            if (message.includes('row-level security') || message.includes('permission')) {
                return 'Não foi possível salvar este perfil com a sessão atual.';
            }

            return 'Não foi possível salvar as alterações agora.';
        }

        function lerValoresDoFormulario() {
            return {
                displayName: String(elements.displayInput.value || '').trim(),
                username: normalizarUsername(elements.usernameInput.value),
                bio: String(elements.bioInput.value || '').trim(),
                avatarFile: elements.avatarInput.files && elements.avatarInput.files[0],
                coverFile: elements.coverInput.files && elements.coverInput.files[0]
            };
        }

        function atualizarBotaoSalvamento(text, disabled) {
            elements.saveButton.textContent = text;
            elements.saveButton.disabled = disabled;
        }

        async function salvarPerfil(event) {
            event.preventDefault();

            if (saving || !ownerMode || !currentUser || !currentProfile) {
                return;
            }

            const values = lerValoresDoFormulario();
            const validationError = validarFormulario(values) || validarArquivo(values.avatarFile) || validarArquivo(values.coverFile);

            if (validationError) {
                mostrarMensagem(elements.formMessage, validationError, 'error');
                return;
            }

            saving = true;
            atualizarBotaoSalvamento('Salvando...', true);
            mostrarMensagem(elements.formMessage, 'Salvando alterações...', 'info');

            let newAvatar = null;
            let newCover = null;

            try {
                newAvatar = await enviarArquivo(currentUser.id, 'avatar', values.avatarFile);
                newCover = await enviarArquivo(currentUser.id, 'cover', values.coverFile);

                const updates = {
                    display_name: values.displayName,
                    username: values.username,
                    bio: values.bio,
                    avatar_url: newAvatar ? newAvatar.publicUrl : currentProfile.avatar_url,
                    cover_url: newCover ? newCover.publicUrl : currentProfile.cover_url
                };

                // Atualização do banco.
                const result = await supabaseClient
                    .from('profiles')
                    .update(updates)
                    .eq('id', currentUser.id)
                    .select('id, username, display_name, bio, avatar_url, cover_url, created_at, updated_at')
                    .single();

                if (result.error) {
                    throw result.error;
                }

                const oldAvatarPath = newAvatar ? extrairCaminhoDoBucket(currentProfile.avatar_url, currentUser.id) : '';
                const oldCoverPath = newCover ? extrairCaminhoDoBucket(currentProfile.cover_url, currentUser.id) : '';

                currentProfile = result.data;
                renderizarPerfil(currentProfile, currentUser, true);
                window.dispatchEvent(new CustomEvent('cybervoid-profile-updated', {
                    detail: {
                        profile: currentProfile
                    }
                }));
                mostrarMensagem(elements.formMessage, 'Perfil atualizado com sucesso.', 'success');

                // Remoção segura do arquivo anterior.
                removerArquivo(oldAvatarPath).then(function () {
                    return removerArquivo(oldCoverPath);
                }).catch(function () {});

                revogarPreview('avatar');
                revogarPreview('cover');
                window.setTimeout(function () {
                    if (!saving) {
                        elements.editor.hidden = true;
                    }
                }, 650);
            } catch (error) {
                const cleanup = [];

                if (newAvatar) {
                    cleanup.push(removerArquivo(newAvatar.path));
                }

                if (newCover) {
                    cleanup.push(removerArquivo(newCover.path));
                }

                Promise.all(cleanup).catch(function () {});
                mostrarMensagem(elements.formMessage, traduzirErro(error), 'error');
            } finally {
                saving = false;
                atualizarBotaoSalvamento('Salvar alterações', false);
            }
        }

        function sairDaConta() {
            if (logoutSending || !supabaseClient) {
                return;
            }

            logoutSending = true;
            elements.logoutButton.disabled = true;
            mostrarMensagem(elements.message, 'Saindo do Void...', 'info');

            supabaseClient.auth.signOut()
                .then(function (result) {
                    if (result.error) {
                        mostrarMensagem(elements.message, 'Não foi possível sair agora. Tente novamente.', 'error');
                    }
                })
                .catch(function () {
                    mostrarMensagem(elements.message, 'Não foi possível sair agora. Tente novamente.', 'error');
                })
                .finally(function () {
                    logoutSending = false;
                    elements.logoutButton.disabled = false;
                });
        }

        elements.editButton.addEventListener('click', function () {
            abrirEditor();
        });
        elements.editDetailsButton.addEventListener('click', function () {
            abrirEditor();
        });
        elements.coverEditButton.addEventListener('click', function () {
            abrirEditor('cover');
        });
        elements.avatarEditButton.addEventListener('click', function () {
            abrirEditor('avatar');
        });
        elements.accountSettingsOpen.addEventListener('click', abrirConfiguracoes);
        elements.accountSettingsClose.forEach(function (button) {
            button.addEventListener('click', fecharConfiguracoes);
        });
        elements.accountSettings.addEventListener('click', function (event) {
            if (event.target === elements.accountSettings) {
                fecharConfiguracoes();
            }
        });
        elements.tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                alternarAba(tab.dataset.profileTab);
            });
        });
        elements.form.addEventListener('submit', salvarPerfil);
        elements.logoutButton.addEventListener('click', sairDaConta);
        elements.usernameInput.addEventListener('input', function () {
            elements.usernameInput.value = normalizarUsername(elements.usernameInput.value);
        });
        elements.bioInput.addEventListener('input', function () {
            elements.bioCount.textContent = String(elements.bioInput.value.length);
        });
        elements.avatarInput.addEventListener('change', function () {
            prepararPreview(elements.avatarInput, 'avatar');
        });
        elements.coverInput.addEventListener('change', function () {
            prepararPreview(elements.coverInput, 'cover');
        });
        elements.cancelButtons.forEach(function (button) {
            button.addEventListener('click', fecharEditor);
        });
        elements.editor.addEventListener('click', function (event) {
            if (event.target === elements.editor) {
                fecharEditor();
            }
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !elements.editor.hidden) {
                fecharEditor();
            }

            if (event.key === 'Escape' && !elements.accountSettings.hidden) {
                fecharConfiguracoes();
            }
        });

        const controller = {
            loadMe: loadMe,
            loadPublic: loadPublic,
            getCurrentProfile: function () {
                return currentProfile;
            }
        };

        profilePage.cyberVoidProfileController = controller;
        return controller;
    }

    window.CyberVoidProfile = {
        mount: mountProfile
    };
}());
