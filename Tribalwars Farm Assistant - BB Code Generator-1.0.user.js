// ==UserScript==
// @name         Tribalwars Farm Assistant - BB Code Generator
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Generates a BBCode table with information from the TribalWars Farm Assistant, including cords, time explored, possible resources and wall level
// @author       StonyBaboon
// @match        https://*.tribalwars.com/*screen=am_farm*
// @match        https://*.tribalwars.com.br/*screen=am_farm*
// @match        https://*.tribalwars.com.pt/*screen=am_farm*
// @match        https://*.tribalwars.net/*screen=am_farm*
// @match        https://*.tribalwars.de/*screen=am_farm*
// @match        https://*.tribalwars.co.uk/*screen=am_farm*
// @match        https://*.tribalwars.fr/*screen=am_farm*
// @match        https://*.tribalwars.nl/*screen=am_farm*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('Script loaded');

    // Translations for different languages
    const translations = {
        en: { at: 'at' },
        pt: { at: 'às' },
        de: { at: 'um' },
        fr: { at: 'à' },
        es: { at: 'a las' },
        it: { at: 'alle' }
    };

    // Function to detect the language of the page
    function detectLanguage() {
        const lang = document.documentElement.lang || 'en'; // Default to English if lang is not set
        return lang.split('-')[0]; // Normalize language code (e.g., 'en-US' -> 'en')
    }

    // Get translations based on the detected language
    function getTranslations() {
        const lang = detectLanguage();
        return translations[lang] || translations['en']; // Fallback to English if language not found
    }

    const { at } = getTranslations();

    // Function to convert "yesterday" and "today" to the correct date
    function convertDate(dateText) {
        const todayDate = new Date();
        if (dateText.includes('ontem')) {
            const yesterdayDate = new Date(todayDate);
            yesterdayDate.setDate(todayDate.getDate() - 1);
            return `${yesterdayDate.getDate().toString().padStart(2, '0')}/${(yesterdayDate.getMonth() + 1).toString().padStart(2, '0')}`;
        } else if (dateText.includes('hoje')) {
            return `${todayDate.getDate().toString().padStart(2, '0')}/${(todayDate.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        return dateText; // If no match, return the original text
    }

    // Function to convert and format time correctly
    function formatTime(dateText) {
        const dateConverted = convertDate(dateText);
        return dateConverted.replace('às', at); // Replace 'às' with appropriate translation
    }

    // Function to collect information from the page and generate BBCode
    function getVillageData() {
        const rows = document.querySelectorAll('#plunder_list tbody tr'); // Selects the table rows
        let bbcode = '[table]\n[**][building]main[/building][||][building]place[/building][||][building]storage[/building][||][building]wall[/building][/**]\n'; // Header change

        rows.forEach(row => {
            const cells = row.querySelectorAll('td'); // Get all cells in the row

            // Ignore the first three and last four columns
            if (cells.length >= 11) {
                // Village coordinates (column 4)
                const villageCoordsFull = cells[3]?.textContent.match(/\((\d+\|\d+)\)/)?.[1] || 'Unknown';

                // Time plundered (column 5)
                let timeText = cells[4]?.textContent.trim() || '00:00:00';
                timeText = formatTime(timeText);  // Convert and format time

                // Available resources (column 6)
                const wood = cells[5]?.textContent.trim().split(/\s+/)[0] || '0'; // First part: wood
                const clay = cells[5]?.textContent.trim().split(/\s+/)[1] || '0'; // Second part: clay
                const iron = cells[5]?.textContent.trim().split(/\s+/)[2] || '0'; // Third part: iron

                // Wall level (column 7)
                const wallLevel = cells[6]?.textContent.trim() || '0';

                // Construct the row of the table in BBCode
                bbcode += `[*][coord]${villageCoordsFull}[/coord][|]${timeText}[|][building]wood[/building]${wood} [building]stone[/building]${clay} [building]iron[/building]${iron}[|][b]${wallLevel}[/b][/*]\n`;
            }
        });

        bbcode += '[/table]';
        return bbcode;
    }

    // Function to generate the table and display it in a text area
    function generateTable() {
        console.log('Generating BBCode table');
        const bbcodeTable = getVillageData();

        // Create or update the text area with the generated BBCode
        let textarea = document.getElementById('bbcodeOutput');
        if (!textarea) {
            textarea = document.createElement('textarea');
            textarea.id = 'bbcodeOutput';
            textarea.style.width = '400px';  // Adjust width as needed
            textarea.style.height = '150px';
            textarea.readOnly = true;
            textarea.style.marginLeft = '10px';
            textarea.style.verticalAlign = 'top'; // Align to the top of the button

            const container = document.querySelector('#plunder_list').parentNode;
            const btnGenerateTable = document.getElementById('btnGenerateTable');
            container.insertBefore(textarea, btnGenerateTable.nextSibling);
        }

        textarea.value = bbcodeTable;
        textarea.select();  // Automatically select text for copying
    }

    // Add button to generate the table
    const btnGenerateTable = document.createElement('button');
    btnGenerateTable.id = 'btnGenerateTable';
    btnGenerateTable.textContent = 'Generate BBCode Table';
    btnGenerateTable.style.margin = '10px';
    btnGenerateTable.onclick = generateTable;

    // Insert the button in the appropriate location on the loot page
    const plunderScreen = document.querySelector('#plunder_list');
    if (plunderScreen) {
        plunderScreen.parentNode.insertBefore(btnGenerateTable, plunderScreen);
        console.log('Button added');
    } else {
        console.log('Element #plunder_list not found');
    }
})();
