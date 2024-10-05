var scriptConfig = {
    scriptData: {
        prefix: 'scriptsPack',
        name: `Pacote de Scripts do RedAlert`,
        version: 'v1.3.9',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/redalerts-scripts-pack.287832/',
    },
    translations: {
        pt: {
            "RedAlert's Scripts Pack": "Pacote de Scripts do RedAlert",
            Help: 'Ajuda',
            'There was an error!': 'Ocorreu um erro!',
            'There are no scripts!': 'Não há scripts!',
            'There has been an error fetching the scripts!':
                'Ocorreu um erro ao buscar os scripts!',
            'scripts listed': 'scripts listados',
            'Script Name': 'Nome do Script',
            'Script Loader': 'Carregador de Script',
            Forum: 'Fórum',
            Demo: 'Demonstração',
            New: 'Novo',
            'Search scripts ...': 'Pesquisar scripts ...',
            'Fetching scripts ...': 'Buscando scripts ...',
            'Script is not allowed to be used on this TW market!':
                'O script não pode ser usado neste mercado do TW!',
            NEW: 'NOVO',
            ALL: 'TODOS',
            Add: 'Adicionar',
            'Quick-bar item has been added!': 'Item adicionado à barra rápida!',
            'Go to forum': 'Ir para o fórum',
            'View demo video': 'Ver vídeo de demonstração',
            'Add script on Quick-bar': 'Adicionar script na barra rápida',
            'This script has no demo video!': 'Este script não possui vídeo de demonstração!',
        },
    },
    allowedMarkets: ['en', 'us', 'yy', 'pt', 'fr', 'br', 'de'],
    allowedScreens: [],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Inicializar biblioteca
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidMarket = twSDK.checkValidMarket();

        // verificar se estamos em um mercado válido
        if (!isValidMarket) {
            UI.ErrorMessage(
                twSDK.tt('O script não pode ser usado neste mercado do TW!')
            );
            return;
        }

        // Ponto de Entrada
        (async function () {
            try {
                const scripts = await fetchScripts();

                if (DEBUG) {
                    console.debug(`${scriptInfo} scripts`, scripts);
                }

                if (scripts.length) {
                    // construir a interface do usuário
                    buildUI(scripts);

                    // registrar manipuladores de eventos
                    handleOnChangeSearchScripts(scripts);
                    handleFilterByCategory(scripts);
                    handleAddToQuickBar();
                    handleViewVideo();
                } else {
                    UI.ErrorMessage(twSDK.tt('Não há scripts!'));
                }
            } catch (error) {
                UI.ErrorMessage(twSDK.tt('Ocorreu um erro!'));
                console.error(`${scriptInfo} Error:`, error);
            }
        })();

        // Renderizar: Construir interface do usuário
        function buildUI(scripts) {
            const content = prepareContent(scripts);

            const customStyle = `
                .ra-textarea { height: 45px; }
                .ra-external-icon-link { font-size: 16px; }
                .new-script-tag { background-color: #21881e; color: #fff; font-size: 12px; padding: 2px 6px; border-radius: 3px; }

                .ra-table { border-spacing: 2px !important; border-collapse: separate !important; width: 100% !important; }
                .ra-table tr:nth-of-type(2n) td { background-color: #f0e2be }
                .ra-table tr:nth-of-type(2n+1) td { background-color: #fff5da; }

                .ra-input { font-size: 16px; padding: 10px; width: 100%; height: auto; line-height: 1; }

                .ra-donate-box { padding: 10px; border: 2px dashed red; font-size: 14px; text-align: center; }

                .ra-table-container { border: 1px solid #bc6e1f; }

                .ra-category-filter { padding: 4px 5px !important; display: inline-block; margin-bottom: 6px; }
            `;

            twSDK.renderBoxWidget(
                content,
                'raScriptsPack',
                'ra-scripts-pack',
                customStyle
            );
        }

        // Manipulador de Ação: Ao alterar o valor do input
        function handleOnChangeSearchScripts(scripts) {
            jQuery('#searchScripts').on('input', function (event) {
                const { value } = event.target;
                const remainingScripts = filterByValue(scripts, value.trim());
                if (remainingScripts.length) {
                    updateUIElements(remainingScripts);
                }

                handleViewVideo();
                handleAddToQuickBar();
            });
        }

        // Manipulador de Ação: Filtrar scripts por categoria
        function handleFilterByCategory(scripts) {
            jQuery('.ra-category-filter').on('click', function (e) {
                e.preventDefault();

                jQuery('.ra-category-filter').removeClass('btn-confirm-yes');
                jQuery(this).addClass('btn-confirm-yes');

                const chosenCategory = jQuery(this)
                    .attr('data-category-filter')
                    .trim();

                if (chosenCategory !== 'new' && chosenCategory !== 'all') {
                    const filteredScripts = scripts.filter((script) => {
                        const { categories } = script;
                        return categories.includes(chosenCategory);
                    });

                    if (filteredScripts.length) {
                        updateUIElements(filteredScripts);
                    }
                } else {
                    if (chosenCategory === 'all') {
                        updateUIElements(scripts);
                    }
                    if (chosenCategory === 'new') {
                        const newScripts = getNewScripts(scripts);
                        updateUIElements(newScripts);
                    }
                }

                handleViewVideo();
                handleAddToQuickBar();
            });
        }

        // Manipulador de Ação: Adicionar script à barra rápida
        function handleAddToQuickBar() {
            jQuery('.add-to-quick-bar').on('click', function (e) {
                e.preventDefault();

                let selectedScript = jQuery(this)
                    .parent()
                    .parent()
                    .find('.ra-textarea')
                    .text()
                    .trim();
                let selectedScriptName = jQuery(this)
                    .parent()
                    .parent()
                    .find('.ra-script-title')
                    .attr('data-camelize')
                    .trim();

                let scriptData = `hotkey=&name=${selectedScriptName}&href=${encodeURI(
                    selectedScript
                )}`;
                let action =
                    '/game.php?screen=settings&mode=quickbar_edit&action=quickbar_edit&';

                jQuery.ajax({
                    url: action,
                    type: 'POST',
                    data: scriptData + `&h=${csrf_token}`,
                });
                UI.SuccessMessage(twSDK.tt('Item adicionado à barra rápida!'));
            });
        }

        // Manipulador de Ação: Ver vídeo
        function handleViewVideo() {
            jQuery('.ra-view-video').on('click', function (e) {
                e.preventDefault();

                let selectedScriptVideo = jQuery(this).attr('href');
                selectedScriptVideo = selectedScriptVideo.split('=')[1];

                if (selectedScriptVideo) {
                    let content = `<iframe width="768" height="480" src="https://www.youtube-nocookie.com/embed/${selectedScriptVideo}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                    Dialog.show('content', content);
                } else {
                    UI.ErrorMessage(twSDK.tt('Este script não possui vídeo de demonstração!'));
                }
            });
        }

        // Helper: Converter string para camelCase
        function camelize(str) {
            return str
                .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
                    return index === 0
                        ? word.toLowerCase()
                        : word.toUpperCase();
                })
                .replace(/\s+/g, '');
        }

        // Helper: Atualizar elementos da UI após interação
        function updateUIElements(scriptsArray) {
            const tableRows = buildTableRows(scriptsArray);
            jQuery('#raScriptsCount').text(scriptsArray.length);
            jQuery('#scriptsList').html(tableRows);
        }

        // Helper: Obter novos scripts
        function getNewScripts(scripts) {
            const newScripts = scripts.filter((script) => {
                const { date_published } = script;
                const approvedDate = Date.parse(date_published);
                if (isNewScriptCheck(approvedDate)) {
                    return script;
                }
            });

            return newScripts;
        }

        // Helper: Filtrar array por valor
        function filterByValue(arr = [], query = '') {
            return arr.filter((obj) => {
                const valuesArray = Object.values(obj);
                return valuesArray.some((value) =>
                    String(value).toLowerCase().includes(query.toLowerCase())
                );
            });
        }

        // Verifica se o script foi publicado recentemente
        function isNewScriptCheck(datePublished) {
            const dateInMs = Date.now() - datePublished;
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            return dateInMs <= oneWeek;
        }

        // Fetch: buscar scripts
        async function fetchScripts() {
            const data = await twSDK.fetch({
                host: 'https://twscripts.dev/scripts/scripts.json',
            });

            const result = data.scripts;
            return result;
        }

        // Helper: Preparar conteúdo para a UI
        function prepareContent(scripts) {
            const categories = [
                {
                    name: twSDK.tt('NOVO'),
                    filter: 'new',
                },
                {
                    name: twSDK.tt('TODOS'),
                    filter: 'all',
                },
            ];

            const content = `
                <div class="ra-donate-box">
                    <strong>${twSDK.tt('Pacote de Scripts do RedAlert')}</strong> v${
                scriptConfig.scriptData.version
            } - por <a href="${
                scriptConfig.scriptData.authorUrl
            }" target="_blank">${scriptConfig.scriptData.author}</a><br>
                    ${twSDK.tt(
                        'Ajude a apoiar o desenvolvimento desses scripts com uma doação:'
                    )} <strong>PayPal</strong> <a href="https://www.paypal.com/donate/?hosted_button_id=FMACQPPMR59DU" target="_blank" rel="noopener noreferrer">Donar aqui</a><br>
                </div>
                <br />
                <div>
                    <input id="searchScripts" class="ra-input" type="text" placeholder="${twSDK.tt(
                        'Pesquisar scripts ...'
                    )}" />
                </div>
                <div>
                    ${categories
                        .map(
                            (category) =>
                                `<a class="btn btn-confirm-no ra-category-filter" data-category-filter="${category.filter}" href="#">${category.name}</a>`
                        )
                        .join(' ')}
                </div>
                <div class="ra-table-container">
                    <table class="vis ra-table">
                        <tbody id="scriptsList">
                            ${buildTableRows(scripts)}
                        </tbody>
                    </table>
                </div>
                <br />
                <span><strong id="raScriptsCount">${scripts.length}</strong> ${twSDK.tt(
                'scripts listados'
            )}</span>
                <br />
            `;

            return content;
        }

        // Helper: Construir linhas da tabela para a lista de scripts
        function buildTableRows(scripts) {
            return scripts
                .map(
                    (script) =>
                        `<tr>
                            <td>
                                <a class="ra-external-icon-link" href="${
                                    script.forum_url
                                }" target="_blank" title="${twSDK.tt(
                            'Ir para o fórum'
                        )}">${twSDK.tt('Fórum')}</a> | 
                                ${
                                    script.demo_url
                                        ? `<a class="ra-external-icon-link ra-view-video" href="${
                                              script.demo_url
                                          }" title="${twSDK.tt(
                                              'Ver vídeo de demonstração'
                                          )}">${twSDK.tt('Demonstração')}</a>`
                                        : `${twSDK.tt('Este script não possui vídeo de demonstração!')}`
                                }
                            </td>
                            <td class="ra-script-title" data-camelize="${camelize(
                                script.title
                            )}">
                                ${
                                    script.is_new
                                        ? `<span class="new-script-tag">${twSDK.tt(
                                              'NOVO'
                                          )}</span>`
                                        : ''
                                }
                                ${script.title}
                            </td>
                            <td>
                                <textarea class="ra-textarea" readonly="readonly">${
                                    script.textarea
                                }</textarea>
                            </td>
                            <td>
                                <a class="btn btn-confirm-yes add-to-quick-bar" href="#" title="${twSDK.tt(
                                    'Adicionar script na barra rápida'
                                )}">${twSDK.tt('Adicionar')}</a>
                            </td>
                        </tr>`
                )
                .join('');
        }
    }
);

