// ==UserScript==
// @name         Lista de Receitas
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Gera alista de formulas numa tabela em codigo BB
// @author       StonyBaboon
// @match        https://*.tribalwars.com.pt/game.php?*screen=event_crafting&mode=recipe_book*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Função que gera o output baseado nos elementos HTML
    function gerarOutput() {
        // Busca todas as linhas da tabela que contêm as fórmulas
        let formulas = document.querySelectorAll('tr.revealed');
        let resultado = '';

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

                // Monta o output no formato especificado
                resultado += `[table]\n`;
                resultado += `[**][img]${material1}[/img][||]+[||][img]${material2}[/img][||]+[||][img]${material3}[/img][||]=[||][img]${itemFinal}[/img][b]${titulo}[/b]\n`;
                resultado += `${boost}\n`;
                resultado += `[b]Duração: ${duracao}  [u]Aplicar a: ${aplicar}[/u][/b][/**]\n`;
                resultado += `[/table]\n\n`;
            } catch (error) {
                console.error("Erro ao processar a fórmula: ", error);
            }
        });

        return resultado;
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

    // Cria o botão logo abaixo do div 'header-left'
    function criarBotao() {
        let headerLeftDiv = document.querySelector('.header-left');
        if (!headerLeftDiv) return;

        let botao = document.createElement('button');
        botao.innerText = 'Gerar Receitas BB';
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

    // Função para garantir que o botão seja adicionado após o carregamento total da página
    function adicionarBotaoComObservador() {
        const targetNode = document.body;

        const observer = new MutationObserver((mutationsList, observer) => {
            // Verifica se os elementos da página foram carregados
            if (document.querySelector('.header-left')) {
                criarBotao();  // Cria o botão assim que o div '.header-left' estiver disponível
                observer.disconnect();  // Desconecta o observador para evitar chamadas repetidas
            }
        });

        // Configura o observador para monitorar mudanças no DOM
        observer.observe(targetNode, { childList: true, subtree: true });
    }

    // Executa o script para criar o botão
    window.addEventListener('load', adicionarBotaoComObservador);

})();
