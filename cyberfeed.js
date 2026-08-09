// Prototipo visual oficial da CyberFeed.
(function prepararCyberFeedVisual() {
    const app = document.querySelector('.cyberfeed-app');

    if (!app || app.dataset.cyberfeedReady === 'true') {
        return;
    }

    app.dataset.cyberfeedReady = 'true';

    // Dados fictícios para demonstrar o visual.
            const currentUserId = "trix";
            const users = {
                trix: {
                    id: "trix",
                    name: "Trix Veyra",
                    username: "@trix_voidrunner",
                    initials: "TX",
                    bio: "Exploradora do Void, caçadora de bugs dimensionais e fã de neon frio.",
                    count: "1.284 amigos",
                    coverLabel: "Setor Aurora",
                    colorA: "#e5007d",
                    colorB: "#7c3aed"
                },
                kael: {
                    id: "kael",
                    name: "Kael Nox",
                    username: "@kael_nox",
                    initials: "KN",
                    bio: "Arquiteto de rotas, colecionador de ruídos bonitos e guia de zonas instáveis.",
                    count: "842 seguidores",
                    coverLabel: "Distrito Prisma",
                    colorA: "#22d3ee",
                    colorB: "#7c3aed"
                },
                mira: {
                    id: "mira",
                    name: "Mira Byte",
                    username: "@mirabyte",
                    initials: "MB",
                    bio: "Curadora de sinais, fotógrafa do neon e observadora de criaturas corrompidas.",
                    count: "2.034 amigos",
                    coverLabel: "Núcleo Violeta",
                    colorA: "#e5007d",
                    colorB: "#22d3ee"
                },
                orion: {
                    id: "orion",
                    name: "Orion Vale",
                    username: "@orionvale",
                    initials: "OV",
                    bio: "Analista de tendências do Void e fundador do grupo Circuito Aberto.",
                    count: "679 seguidores",
                    coverLabel: "Ponte Ciano",
                    colorA: "#7c3aed",
                    colorB: "#22d3ee"
                }
            };

            const posts = [
                {
                    id: "p1",
                    author: "trix",
                    time: "agora mesmo",
                    text: "Testei uma nova rota entre o distrito Ciano e o corredor Violeta. O mapa ainda pulsa quando a energia muda, mas a travessia está mais estável.",
                    reactions: 128,
                    comments: 18,
                    shares: 6,
                    commentsPreview: [
                        { author: "Kael", initials: "KN", text: "Essa rota vai economizar metade do caminho." }
                    ]
                },
                {
                    id: "p2",
                    author: "mira",
                    time: "24 min",
                    text: "Registro visual do terminal depois da chuva elétrica. O Void fica quase calmo quando os painéis param de falhar.",
                    reactions: 264,
                    comments: 43,
                    shares: 15,
                    media: [{ label: "Terminal Neon", colorA: "#e5007d", colorB: "#22d3ee" }]
                },
                {
                    id: "p3",
                    author: "kael",
                    time: "1 h",
                    text: "Pequeno relatório da patrulha: três sinais estranhos, nenhuma entidade hostil e uma sequência de portas que abriu sozinha. Normal para terça-feira.",
                    reactions: 91,
                    comments: 12,
                    shares: 4,
                    media: [
                        { label: "Mapa", colorA: "#7c3aed", colorB: "#22d3ee" },
                        { label: "Portal", colorA: "#e5007d", colorB: "#7c3aed" },
                        { label: "Sensor", colorA: "#22d3ee", colorB: "#0d0a14" },
                        { label: "Rota", colorA: "#f97316", colorB: "#e5007d" }
                    ]
                }
            ];

            const suggestions = ["kael", "mira", "orion"];
            const contacts = ["mira", "kael", "orion"];
            const profilePhotos = [
                ["Pulso", "#e5007d", "#7c3aed"],
                ["Torre", "#22d3ee", "#14101f"],
                ["Rastro", "#7c3aed", "#22d3ee"],
                ["Néon", "#e5007d", "#0d0a14"],
                ["Grade", "#22d3ee", "#e5007d"],
                ["Void", "#7c3aed", "#14101f"]
            ];

            let activeProfileId = currentUserId;
            let mobileFeedbackTimer = null;

            function createSvg(label, colorA, colorB, wide = true, showLabel = true) {
                const width = wide ? 1200 : 700;
                const height = wide ? 675 : 700;
                const labelText = showLabel
                    ? `<text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${wide ? 70 : 48}" font-weight="800" fill="#f5f1ff">${label}</text>`
                    : "";
                const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                    <defs>
                            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                                <stop offset="0" stop-color="${colorA}"/>
                                <stop offset="1" stop-color="${colorB}"/>
                            </linearGradient>
                            <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
                                <path d="M54 0H0V54" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="#0d0a14"/>
                        <rect width="100%" height="100%" fill="url(#g)" opacity="0.92"/>
                        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.42"/>
                    <circle cx="${width * 0.78}" cy="${height * 0.24}" r="${height * 0.2}" fill="rgba(255,255,255,0.16)"/>
                    <circle cx="${width * 0.18}" cy="${height * 0.78}" r="${height * 0.24}" fill="rgba(0,0,0,0.18)"/>
                    <path d="M0 ${height * 0.78} C ${width * 0.22} ${height * 0.58}, ${width * 0.42} ${height * 0.94}, ${width} ${height * 0.66} L ${width} ${height} L 0 ${height} Z" fill="rgba(13,10,20,0.36)"/>
                    ${labelText}
                </svg>`;
                return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
            }

            function userAvatar(userId, sizeClass = "avatar-md") {
                const user = users[userId];
                return `<span class="avatar ${sizeClass}" data-avatar="${user.name}">${user.initials}</span>`;
            }

            function renderPosts(target, list) {
                target.innerHTML = list.map(function (post) {
                    const author = users[post.author];
                    const mediaHtml = renderMedia(post.media);
                    const commentsHtml = renderComments(post);

                    return `
                        <article class="surface-card post-card" data-post-id="${post.id}">
                            <header class="post-header">
                                <button type="button" class="avatar-button" data-route="profile" data-profile-target="${author.id}" aria-label="Abrir perfil de ${author.name}">
                                    ${userAvatar(author.id, "avatar-md")}
                                </button>
                                <button type="button" class="author-button" data-route="profile" data-profile-target="${author.id}">
                                    <strong class="d-block">${author.name}</strong>
                                    <span class="muted-text small">${author.username} · ${post.time}</span>
                                </button>
                                <button type="button" class="post-menu" aria-label="Mais opções"><i class="bi bi-three-dots"></i></button>
                            </header>
                            <div class="post-body">
                                <p>${post.text}</p>
                            </div>
                            ${mediaHtml}
                            <div class="post-stats">
                                <span><span class="reaction-mark"><i class="bi bi-heart-fill"></i></span><span data-reaction-count>${post.reactions}</span> reações</span>
                                <span>${post.comments} comentários · ${post.shares} compartilhamentos</span>
                            </div>
                            <div class="post-actions">
                                <button type="button" data-like-button><i class="bi bi-heart me-2"></i>Curtir</button>
                                <button type="button" data-comment-button><i class="bi bi-chat me-2"></i>Comentar</button>
                                <button type="button"><i class="bi bi-send me-2"></i>Compartilhar</button>
                            </div>
                            ${commentsHtml}
                        </article>`;
                }).join("");
            }

            function renderMedia(media) {
                if (!media || media.length === 0) {
                    return "";
                }

                if (media.length === 1) {
                    const item = media[0];
                    return `<div class="post-media single"><img src="${createSvg(item.label, item.colorA, item.colorB)}" alt="${item.label}"></div>`;
                }

                return `
                    <div class="post-media grid">
                        ${media.map(function (item) {
                            return `<div class="grid-shot"><img src="${createSvg(item.label, item.colorA, item.colorB, false)}" alt="${item.label}"></div>`;
                        }).join("")}
                    </div>`;
            }

            function renderComments(post) {
                const previews = post.commentsPreview || [];
                const previewHtml = previews.map(function (comment) {
                    return `
                        <div class="comment-row">
                            <span class="avatar avatar-sm">${comment.initials}</span>
                            <div class="comment-bubble">
                                <strong class="d-block small">${comment.author}</strong>
                                <span class="small">${comment.text}</span>
                            </div>
                        </div>`;
                }).join("");

                return `
                    <div class="comments-preview">
                        ${previewHtml}
                        <div class="comment-box" data-comment-box hidden>
                            <input type="text" aria-label="Escrever comentário" placeholder="Escreva um comentário visual...">
                        </div>
                    </div>`;
            }

            function renderSuggestions() {
                const target = document.querySelector("[data-suggestions]");
                target.innerHTML = suggestions.map(function (id) {
                    const user = users[id];
                    return `
                        <div class="suggestion-row">
                            <button type="button" class="avatar-button" data-route="profile" data-profile-target="${id}" aria-label="Abrir perfil de ${user.name}">
                                ${userAvatar(id, "avatar-sm")}
                            </button>
                            <button type="button" class="author-button" data-route="profile" data-profile-target="${id}">
                                <span class="suggestion-name d-block">${user.name}</span>
                                <span class="muted-text small">${user.username}</span>
                            </button>
                            <button type="button" class="btn btn-sm soft-action">Adicionar</button>
                        </div>`;
                }).join("");
            }

            function renderContacts() {
                const target = document.querySelector("[data-contacts]");
                target.innerHTML = contacts.map(function (id) {
                    const user = users[id];
                    return `
                        <button type="button" class="contact-row w-100 border-0 bg-transparent text-start" data-route="profile" data-profile-target="${id}">
                            <span class="online-wrap">
                                ${userAvatar(id, "avatar-sm")}
                                <span class="online-dot" aria-hidden="true"></span>
                            </span>
                            <span class="contact-name">${user.name}</span>
                        </button>`;
                }).join("");
            }

            function renderProfilePhotos() {
                const photoMarkup = profilePhotos.map(function (item) {
                    return `<img src="${createSvg(item[0], item[1], item[2], false)}" alt="${item[0]}">`;
                }).join("");

                document.querySelector("[data-profile-photos]").innerHTML = photoMarkup;
            }

            function renderFriends() {
                const target = document.querySelector("[data-profile-friends]");
                target.innerHTML = Object.values(users).filter(function (user) {
                    return user.id !== activeProfileId;
                }).map(function (user) {
                    return `
                        <button type="button" class="friend-card text-start" data-route="profile" data-profile-target="${user.id}">
                            ${userAvatar(user.id, "avatar-sm")}
                            <span>${user.name}</span>
                        </button>`;
                }).join("");
            }

            // Fallback visual para ambientes sem Bootstrap carregado.
            function activateProfilePostsTab() {
                const firstTab = document.querySelector("#posts-tab");

                if (window.bootstrap && window.bootstrap.Tab) {
                    window.bootstrap.Tab.getOrCreateInstance(firstTab).show();
                    return;
                }

                document.querySelectorAll("#profileTabs .nav-link").forEach(function (tab) {
                    const active = tab === firstTab;
                    tab.classList.toggle("active", active);
                    tab.setAttribute("aria-selected", active ? "true" : "false");
                });

                document.querySelectorAll("#profileTabsContent .tab-pane").forEach(function (pane) {
                    const active = pane.id === "posts-pane";
                    pane.classList.toggle("show", active);
                    pane.classList.toggle("active", active);
                });
            }

            function closeMobileMenu() {
                const offcanvasElement = document.querySelector("#mobileMenu");

                if (window.bootstrap && window.bootstrap.Offcanvas) {
                    const offcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasElement);
                    if (offcanvas) {
                        offcanvas.hide();
                    }
                    return;
                }

                offcanvasElement.classList.remove("show");
                offcanvasElement.style.visibility = "hidden";
            }

    function openMobileMenu() {
                const offcanvasElement = document.querySelector("#mobileMenu");

                if (window.bootstrap && window.bootstrap.Offcanvas) {
                    window.bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement).show();
                    return;
                }

                offcanvasElement.classList.add("show");
                offcanvasElement.style.visibility = "visible";
            }

            function closeDropdowns(exceptMenu) {
                document.querySelectorAll(".cyberfeed-app .dropdown-menu.show").forEach(function (menu) {
                    if (menu === exceptMenu) {
                        return;
                    }

                    menu.classList.remove("show");
                    const toggle = menu.closest(".dropdown").querySelector('[data-bs-toggle="dropdown"]');
                    if (toggle) {
                        toggle.setAttribute("aria-expanded", "false");
                    }
                });
            }

            function toggleDropdown(button) {
                const menu = button.closest(".dropdown").querySelector(".dropdown-menu");
                if (!menu) {
                    return;
                }

                const open = !menu.classList.contains("show");
                closeDropdowns(menu);
                menu.classList.toggle("show", open);
                button.setAttribute("aria-expanded", open ? "true" : "false");
            }

            function activateTab(tabButton) {
                if (!tabButton || (window.bootstrap && window.bootstrap.Tab)) {
                    return;
                }

                const target = document.querySelector(tabButton.dataset.bsTarget);
                if (!target) {
                    return;
                }

                document.querySelectorAll("#profileTabs .nav-link").forEach(function (tab) {
                    const active = tab === tabButton;
                    tab.classList.toggle("active", active);
                    tab.setAttribute("aria-selected", active ? "true" : "false");
                });

                document.querySelectorAll("#profileTabsContent .tab-pane").forEach(function (pane) {
                    const active = pane === target;
                    pane.classList.toggle("show", active);
                    pane.classList.toggle("active", active);
                });
            }

            function scrollToPageTop() {
                // Garante topo apos alternar entre Feed e Perfil.
                const resetScroll = function () {
                    try {
                        window.scrollTo({
                            top: 0,
                            left: 0,
                            behavior: "instant"
                        });
                    } catch (error) {
                        window.scrollTo(0, 0);
                    }
                };

                resetScroll();
                window.requestAnimationFrame(function () {
                    resetScroll();
                    window.requestAnimationFrame(function () {
                        resetScroll();
                    });
                });
                window.setTimeout(resetScroll, 80);
            }

            // Busca mobile compacta.
            function setMobileSearch(open) {
                const searchPanel = document.querySelector("[data-mobile-search-panel]");
                const searchInput = searchPanel ? searchPanel.querySelector("input") : null;

                if (!searchPanel) {
                    return;
                }

                searchPanel.hidden = !open;
                app.classList.toggle("is-mobile-search-open", open);

                if (open && searchInput) {
                    window.requestAnimationFrame(function () {
                        searchInput.focus();
                    });
                }
            }

            // Aviso simples para secoes ainda nao implementadas.
            function showMobileFeedback() {
                const feedback = document.querySelector("[data-mobile-feedback]");

                if (!feedback) {
                    return;
                }

                feedback.textContent = "Em breve";
                feedback.hidden = false;
                window.clearTimeout(mobileFeedbackTimer);
                mobileFeedbackTimer = window.setTimeout(function () {
                    feedback.hidden = true;
                }, 1600);
            }

            // Estado da navegacao inferior mobile.
            function updateMobileBottomNav(viewName) {
                document.querySelectorAll(".mobile-bottom-nav button").forEach(function (button) {
                    const isFeed = button.dataset.route === "feed";
                    const isProfile = button.dataset.route === "profile";
                    button.classList.toggle("active", (viewName === "feed" && isFeed) || (viewName === "profile" && isProfile));
                });
            }

            // Alternância visual entre feed e perfil.
            function showView(viewName) {
                document.querySelectorAll("[data-view]").forEach(function (view) {
                    view.hidden = view.dataset.view !== viewName;
                });

                document.querySelectorAll(".side-menu .nav-link").forEach(function (item) {
                    const isProfile = item.dataset.route === "profile";
                    const isFeed = item.dataset.route === "feed";
                    item.classList.toggle("active", (viewName === "feed" && isFeed) || (viewName === "profile" && isProfile));
                });

                updateMobileBottomNav(viewName);
                setMobileSearch(false);
                scrollToPageTop();
            }

            function openProfile(profileId) {
                activeProfileId = users[profileId] ? profileId : currentUserId;
                const user = users[activeProfileId];
                const isCurrentUser = activeProfileId === currentUserId;

                document.querySelector("[data-profile-cover]").src = createSvg(user.coverLabel, user.colorA, user.colorB, true, false);
                document.querySelector("[data-profile-name]").textContent = user.name;
                document.querySelector("[data-profile-username]").textContent = user.username;
                document.querySelector("[data-profile-bio]").textContent = user.bio;
                document.querySelector("[data-profile-count]").textContent = user.count;
                document.querySelector("[data-profile-intro]").textContent = user.bio;
                document.querySelector("[data-profile-followers]").textContent = user.count;

                const avatar = document.querySelector("[data-profile-avatar]");
                avatar.textContent = user.initials;
                avatar.setAttribute("data-avatar", user.name);

                const primaryAction = document.querySelector("[data-profile-primary-action]");
                primaryAction.textContent = isCurrentUser ? "Editar perfil" : "Adicionar amigo";

                const profilePosts = posts.filter(function (post) {
                    return post.author === activeProfileId;
                });
                renderPosts(document.querySelector("[data-profile-posts]"), profilePosts.length ? profilePosts : [posts[0]]);
                renderFriends();

                activateProfilePostsTab();
                showView("profile");
            }

    // Interações demonstrativas dos posts.
            function handleDocumentClick(event) {
                const dropdownButton = event.target.closest('.cyberfeed-app [data-bs-toggle="dropdown"]');
                if (dropdownButton && !(window.bootstrap && window.bootstrap.Dropdown)) {
                    event.preventDefault();
                    toggleDropdown(dropdownButton);
                    return;
                }

                const openMenuButton = event.target.closest('[data-bs-target="#mobileMenu"]');
                if (openMenuButton && !(window.bootstrap && window.bootstrap.Offcanvas)) {
                    openMobileMenu();
                }

                const closeMenuButton = event.target.closest('[data-bs-dismiss="offcanvas"]');
                if (closeMenuButton && !(window.bootstrap && window.bootstrap.Offcanvas)) {
                    closeMobileMenu();
                }

                const tabButton = event.target.closest('[data-bs-toggle="tab"]');
                if (tabButton) {
                    activateTab(tabButton);
                }

                const searchToggle = event.target.closest("[data-mobile-search-toggle]");
                if (searchToggle) {
                    event.preventDefault();
                    const searchPanel = document.querySelector("[data-mobile-search-panel]");
                    setMobileSearch(!searchPanel || searchPanel.hidden);
                    closeDropdowns();
                    return;
                }

                const searchClose = event.target.closest("[data-mobile-search-close]");
                if (searchClose) {
                    event.preventDefault();
                    setMobileSearch(false);
                    return;
                }

                const mobilePlaceholder = event.target.closest("[data-mobile-placeholder]");
                if (mobilePlaceholder) {
                    event.preventDefault();
                    document.querySelectorAll(".mobile-bottom-nav button").forEach(function (button) {
                        button.classList.toggle("active", button === mobilePlaceholder);
                    });
                    showMobileFeedback();
                    setMobileSearch(false);
                    closeDropdowns();
                    return;
                }

                const routeButton = event.target.closest("[data-route]");
                if (routeButton) {
                    const route = routeButton.dataset.route;
                    if (route === "feed") {
                        showView("feed");
                    }

                    if (route === "profile") {
                        openProfile(routeButton.dataset.profileTarget || currentUserId);
                    }

                    closeMobileMenu();
                    closeDropdowns();
                }

                const likeButton = event.target.closest("[data-like-button]");
                if (likeButton) {
                    const post = likeButton.closest("[data-post-id]");
                    const counter = post.querySelector("[data-reaction-count]");
                    const liked = likeButton.classList.toggle("is-liked");
                    const icon = likeButton.querySelector("i");
                    icon.className = liked ? "bi bi-heart-fill me-2" : "bi bi-heart me-2";
                    counter.textContent = String(Number(counter.textContent) + (liked ? 1 : -1));
                }

                const commentButton = event.target.closest("[data-comment-button]");
                if (commentButton) {
                    const post = commentButton.closest("[data-post-id]");
                    const box = post.querySelector("[data-comment-box]");
                    box.hidden = !box.hidden;
                    if (!box.hidden) {
                        box.querySelector("input").focus();
                    }
                }

                if (!event.target.closest(".cyberfeed-app .dropdown")) {
                    closeDropdowns();
                }
            }

            function handleDocumentSubmit(event) {
                if (event.target.closest(".cyberfeed-app .nav-search")) {
                    event.preventDefault();
                    showMobileFeedback();
                }
            }

    function init() {
                renderPosts(document.querySelector("[data-post-list]"), posts);
                renderSuggestions();
                renderContacts();
                renderProfilePhotos();
                renderFriends();
                document.addEventListener("click", handleDocumentClick);
                document.addEventListener("submit", handleDocumentSubmit);

                // Rota inicial demonstrativa para links antigos da propria pagina.
                const params = new URLSearchParams(window.location.search);
                if (params.get("view") === "me") {
                    openProfile(currentUserId);
                }
            }

            init();
}());
