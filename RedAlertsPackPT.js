var scriptConfig = {
    scriptData: {
        prefix: 'pacoteDeScripts',
        name: `Pacote de Scripts do RedAlert`,
        version: 'v1.3.9',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/redalerts-scripts-pack.287832/',
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

        // Verificar se estamos em um mercado válido
        if (!isValidMarket) {
            UI.ErrorMessage('O script não pode ser usado neste mercado do TW!');
            return;
        }

        // Ponto de Entrada
        (async function () {
            try {
                const scripts = await buscarScripts();

                if (DEBUG) {
                    console.debug(`${scriptInfo} scripts`, scripts);
                }

                if (scripts.length) {
                    // Construir a interface do usuário
                    construirInterface(scripts);

                    // Registrar manipuladores de eventos
                    manipularMudancaPesquisa(scripts);
                    manipularFiltroPorCategoria(scripts);
                    manipularAdicionarBarraRapida();
                    manipularVerVideo();
                } else {
                    UI.ErrorMessage('Não há scripts!');
                }
            } catch (error) {
                UI.ErrorMessage('Ocorreu um erro!');
                console.error(`${scriptInfo} Erro:`, error);
            }
        })();

        // Renderizar: Construir interface do usuário
        function construirInterface(scripts) {
            const conteudo = prepararConteudo(scripts);

            const estiloPersonalizado = `
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
                conteudo,
                'pacoteDeScriptsRedAlert',
                'pacote-de-scripts-redalert',
                estiloPersonalizado
            );
        }

        // Manipulador de Ação: Ao alterar o valor do input
        function manipularMudancaPesquisa(scripts) {
            jQuery('#pesquisarScripts').on('input', function (event) {
                const { value } = event.target;
                const scriptsRestantes = filtrarPorValor(scripts, value.trim());
                if (scriptsRestantes.length) {
                    atualizarElementosUI(scriptsRestantes);
                }

                manipularVerVideo();
                manipularAdicionarBarraRapida();
            });
        }

        // Manipulador de Ação: Filtrar scripts por categoria
        function manipularFiltroPorCategoria(scripts) {
            jQuery('.ra-category-filter').on('click', function (e) {
                e.preventDefault();

                jQuery('.ra-category-filter').removeClass('btn-confirm-yes');
                jQuery(this).addClass('btn-confirm-yes');

                const categoriaEscolhida = jQuery(this)
                    .attr('data-category-filter')
                    .trim();

                if (categoriaEscolhida !== 'novo' && categoriaEscolhida !== 'todos') {
                    const scriptsFiltrados = scripts.filter((script) => {
                        const { categorias } = script;
                        return categorias.includes(categoriaEscolhida);
                    });

                    if (scriptsFiltrados.length) {
                        atualizarElementosUI(scriptsFiltrados);
                    }
                } else {
                    if (categoriaEscolhida === 'todos') {
                        atualizarElementosUI(scripts);
                    }
                    if (categoriaEscolhida === 'novo') {
                        const scriptsNovos = obterScriptsNovos(scripts);
                        atualizarElementosUI(scriptsNovos);
                    }
                }

                manipularVerVideo();
                manipularAdicionarBarraRapida();
            });
        }

        // Manipulador de Ação: Adicionar script à barra rápida
        function manipularAdicionarBarraRapida() {
            jQuery('.adicionar-barra-rapida').on('click', function (e) {
                e.preventDefault();

                let scriptSelecionado = jQuery(this)
                    .parent()
                    .parent()
                    .find('.ra-textarea')
                    .text()
                    .trim();
                let nomeScriptSelecionado = jQuery(this)
                    .parent()
                    .parent()
                    .find('.ra-script-title')
                    .attr('data-camelize')
                    .trim();

                let dadosScript = `hotkey=&name=${nomeScriptSelecionado}&href=${encodeURI(
                    scriptSelecionado
                )}`;
                let acao =
                    '/game.php?screen=settings&mode=quickbar_edit&action=quickbar_edit&';

                jQuery.ajax({
                    url: acao,
                    type: 'POST',
                    data: dadosScript + `&h=${csrf_token}`,
                });
                UI.SuccessMessage('Item adicionado à barra rápida!');
            });
        }

        // Manipulador de Ação: Ver vídeo
        function manipularVerVideo() {
            jQuery('.ra-ver-video').on('click', function (e) {
                e.preventDefault();

                let videoScriptSelecionado = jQuery(this).attr('href');
                videoScriptSelecionado = videoScriptSelecionado.split('=')[1];

                if (videoScriptSelecionado) {
                    let conteudo = `<iframe width="768" height="480" src="https://www.youtube-nocookie.com/embed/${videoScriptSelecionado}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                    Dialog.show('conteudo', conteudo);
                } else {
                    UI.ErrorMessage('Este script não possui vídeo de demonstração!');
                }
            });
        }

        // Helper: Converter string para camelCase
        function camelizar(str) {
            return str
                .replace(/(?:^\w|[A-Z]|\b\w)/g, function (palavra, indice) {
                    return indice === 0
                        ? palavra.toLowerCase()
                        : palavra.toUpperCase();
                })
                .replace(/\s+/g, '');
        }

        // Helper: Atualizar elementos da UI após interação
        function atualizarElementosUI(scriptsArray) {
            const linhasTabela = construirLinhasTabela(scriptsArray);
            jQuery('#raContagemScripts').text(scriptsArray.length);
            jQuery('#listaScripts').html(linhasTabela);
        }

        // Helper: Obter novos scripts
        function obterScriptsNovos(scripts) {
            const novosScripts = scripts.filter((script) => {
                const { data_publicacao } = script;
                const dataAprovada = Date.parse(data_publicacao);
                if (verificarScriptNovo(dataAprovada)) {
                    return script;
                }
            });

            return novosScripts;
        }

        // Helper: Filtrar array por valor
        function filtrarPorValor(arr = [], query = '') {
            return arr.filter((obj) => {
                const valoresArray = Object.values(obj);
                return valoresArray.some((valor) =>
                    String(valor).toLowerCase().includes(query.toLowerCase())
                );
            });
        }

        // Verifica se o script foi publicado recentemente
        function verificarScriptNovo(dataPublicacao) {
            const dataMs = Date.now() - dataPublicacao;
            const umaSemana = 7 * 24 * 60 * 60 * 1000;
            return dataMs <= umaSemana;
        }

        // Fetch: buscar scripts
        async function buscarScripts() {
            const dados = await twSDK.fetch({
                host: 'https://twscripts.dev/scripts/scripts.json',
            });

            const resultado = dados.scripts;
            return resultado;
        }

        // Helper: Preparar conteúdo para a UI
        function prepararConteudo(scripts) {
            const categorias = [
                {
                    name: 'NOVO',
                    filter: 'novo',
                },
                {
                    name: 'TODOS',
                    filter: 'todos',
                },
            ];

            const conteudo = `
                <div class="ra-donate-box">
                    <strong>Pacote de Scripts do RedAlert</strong> v${
                scriptConfig.scriptData.version
            } - por <a href="${
                scriptConfig.scriptData.authorUrl
            }" target="_blank">${scriptConfig.scriptData.author}</a><br>
                    Ajude a apoiar o desenvolvimento desses scripts com uma doação: <strong>PayPal</strong> <a href="https://www.paypal.com/donate/?hosted_button_id=FMACQPPMR59DU" target="_blank" rel="noopener noreferrer">Doar aqui</a><br>
                </div>
                <br />
                <div>
                    <input id="pesquisarScripts" class="ra-input" type="text" placeholder="Pesquisar scripts ..." />
                </div>
                <div>
                    ${categorias
                        .map(
                            (categoria) =>
                                `<a class="btn btn-confirm-no ra-category-filter" data-category-filter="${categoria.filter}" href="#">${categoria.name}</a>`
                        )
                        .join(' ')}
                </div>
                <div class="ra-table-container">
                    <table class="vis ra-table">
                        <tbody id="listaScripts">
                            ${construirLinhasTabela(scripts)}
                        </tbody>
                    </table>
                </div>
                <br />
                <span><strong id="raContagemScripts">${scripts.length}</strong> scripts listados</span>
                <br />
            `;

            return conteudo;
        }

        // Helper: Construir linhas da tabela para a lista de scripts
        function construirLinhasTabela(scripts) {
            return scripts
                .map(
                    (script) =>
                        `<tr>
                            <td>
                                <a class="ra-external-icon-link" href="${
                                    script.forum_url
                                }" target="_blank" title="Ir para o fórum">Fórum</a> | 
                                ${
                                    script.demo_url
                                        ? `<a class="ra-external-icon-link ra-ver-video" href="${
                                              script.demo_url
                                          }" title="Ver vídeo de demonstração">Demonstração</a>`
                                        : `Este script não possui vídeo de demonstração!`
                                }
                            </td>
                            <td class="ra-script-title" data-camelize="${camelizar(
                                script.title
                            )}">
                                ${
                                    script.is_new
                                        ? `<span class="new-script-tag">NOVO</span>`
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
                                <a class="btn btn-confirm-yes adicionar-barra-rapida" href="#" title="Adicionar script na barra rápida">Adicionar</a>
                            </td>
                        </tr>`
                )
                .join('');
        }
    }
);
