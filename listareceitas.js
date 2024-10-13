// ==UserScript==
// @name         Lista de Receitas
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Gera lista de receitas do evento "Bigorna do Rei Mercenário" em codigo BB para partilhar no forum.
// @author       StonyBaboon
// @match        https://*.tribalwars.com.pt/game.php?*screen=event_crafting&mode=recipe_book*
// @download     https://github.com/StonyBaboon/TribaWars-Scripts/edit/main/listareceitas.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Função que gera o output baseado nos elementos HTML
    function gerarOutput() {
        // Busca todas as linhas da tabela que contêm as fórmulas
        let formulas = document.querySelectorAll('tr.revealed');
        let resultados = {};

        if (formulas.length === 0) {
            alert("Nenhuma fórmula encontrada!");
            return;
        }

        // Itera por cada fórmula encontrada
        formulas.forEach((formula) => {
            let imagens = formula.querySelectorAll('img');
            if (imagens.length < 4) {
                console.warn("Fórmula incompleta encontrada, ignorando.");
                return; // Pula se não houver 4 imagens
            }

            let material1 = imagens[0].src;
            let material2 = imagens[1].src;
            let material3 = imagens[2].src;
            let itemFinal = imagens[3].src;
            let descricao = imagens[3].getAttribute('data-title');

            if (!descricao) {
                console.warn("Descrição da fórmula não encontrada, ignorando.");
                return; // Pula se a descrição não estiver presente
            }

            try {
                // Regex para extrair o título e as informações relevantes da descrição
                let tituloRegex = /<p>(.*?)<\/p>/;
                let titulo = descricao.match(tituloRegex) ? descricao.match(tituloRegex)[1] : "Título desconhecido";

                let boostRegex = /<p>(.*?)<\/p><p>(.*?)<\/p>/;
                let boost = descricao.match(boostRegex) ? descricao.match(boostRegex)[2] : "Bônus desconhecido";

                let duracaoRegex = /Duração: (.*?)<\/p>/;
                let duracao = descricao.match(duracaoRegex) ? descricao.match(duracaoRegex)[1] : "Duração desconhecida";

                let aplicarRegex = /Aplicar a: (.*?)<\/p>/;
                let aplicar = descricao.match(aplicarRegex) ? descricao.match(aplicarRegex)[1] : "Aplicação desconhecida";

                // Cria o formato da fórmula
                let formulaTexto = `[table]\n`;
                formulaTexto += `[**][img]${material1}[/img][||]+[||][img]${material2}[/img][||]+[||][img]${material3}[/img][||]=[||][img]${itemFinal}[/img][b]${titulo}[/b]\n`;
                formulaTexto += `${boost}\n`;
                formulaTexto += `[b]Duração: ${duracao}  [u]Aplicar a: ${aplicar}[/u][/b][/**]\n`;
                formulaTexto += `[/table]\n`;

                // Adiciona o resultado ao objeto 'resultados', agrupando por título
                if (!resultados[titulo]) {
                    resultados[titulo] = ''; // Inicializa o título se não existir
                }

                resultados[titulo] += formulaTexto + '\n';
            } catch (error) {
                console.error("Erro ao processar a fórmula: ", error);
            }
        });

        // Monta o texto final com os spoilers agrupados
        let resultadoFinal = '';
        for (let titulo in resultados) {
            resultadoFinal += `[spoiler=${titulo}]\n`;
            resultadoFinal += resultados[titulo];
            resultadoFinal += `[/spoiler]\n\n`;
        }

        return resultadoFinal;
    }

    // Função para criar a caixa de texto flutuante
    function criarCaixaTexto(resultado) {
        let caixaTexto = document.createElement('textarea');
        caixaTexto.value = resultado;
        caixaTexto.style.position = 'fixed';
        caixaTexto.style.top = '100px';
        caixaTexto.style.right = '20px';
        caixaTexto.style.width = '400px';
        caixaTexto.style.height = '300px';
        caixaTexto.style.zIndex = '1000';
        caixaTexto.style.padding = '10px';
        caixaTexto.style.border = '1px solid #ccc';
        caixaTexto.style.backgroundColor = '#f8f8f8';
        caixaTexto.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.2)';
        caixaTexto.style.fontSize = '14px';
        caixaTexto.style.color = '#333';
        caixaTexto.style.resize = 'none';  // Desativa o redimensionamento manual da caixa de texto
        caixaTexto.id = 'resultadoConversao';

        let fecharBotao = document.createElement('button');
        fecharBotao.innerText = 'Fechar';
        fecharBotao.style.position = 'absolute';
        fecharBotao.style.bottom = '10px';
        fecharBotao.style.right = '10px';
        fecharBotao.style.padding = '5px 10px';
        fecharBotao.style.backgroundColor = '#d9534f';
        fecharBotao.style.color = '#fff';
        fecharBotao.style.border = 'none';
        fecharBotao.style.cursor = 'pointer';
        fecharBotao.onclick = () => {
            document.body.removeChild(caixaTexto);
        };

        document.body.appendChild(caixaTexto);
        caixaTexto.appendChild(fecharBotao);
    }

    // Função principal que é ativada ao clicar no botão
    function converterFormulas() {
        let resultado = gerarOutput();
        if (resultado) {
            criarCaixaTexto(resultado);
        }
    }

    // Função para criar o botão
    function criarBotao() {
        let headerLeftDiv = document.querySelector('.header-left');
        if (!headerLeftDiv) return;

        // Verifica se o botão já foi criado para evitar duplicatas
        if (document.querySelector('#botaoConversor')) return;

        let botao = document.createElement('button');
        botao.innerText = 'Converter Fórmulas';
        botao.id = 'botaoConversor'; // Adiciona um ID para referência futura
        botao.className = 'btn';  // Usa a classe 'btn' para seguir o estilo dos botões da página
        botao.style.marginTop = '10px';
        botao.style.padding = '8px 12px';
        botao.style.backgroundColor = '#4CAF50';
        botao.style.color = '#fff';
        botao.style.border = 'none';
        botao.style.cursor = 'pointer';
        botao.style.fontSize = '14px';

        // Adiciona a funcionalidade ao botão
        botao.addEventListener('click', converterFormulas);

        // Insere o botão no final do div .header-left
        headerLeftDiv.appendChild(botao);
    }

    // Função para garantir que o botão seja inserido após o carregamento da página
    function adicionarBotaoComObservador() {
        // Verifica se o botão já existe, e se não existir, tenta adicionar
        criarBotao();

        // Observa mudanças no DOM para reinserir o botão, caso ele seja removido
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' || mutation.type === 'subtree') {
                    criarBotao();
                }
            }
        });

        // Configura o observador para observar a 'header-left' e alterações no body
        let targetNode = document.body;
        let config = { childList: true, subtree: true };

        observer.observe(targetNode, config);
    }

    // Verifica a cada segundo se o botão está presente e o adiciona, se necessário
    let intervaloVerificacao = setInterval(() => {
        criarBotao();
    }, 1000);

    // Adiciona o botão após o carregamento completo da página
    window.addEventListener('load', () => {
        adicionarBotaoComObservador();
        clearInterval(intervaloVerificacao);
    });

})();
