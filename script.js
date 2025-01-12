const SPREADSHEET_ID = '1ZsOUdF7bzeW8IJ9J_Gn49Q4jJlVpj8984DU1bjNQNGI';
const RANGE = 'Página1!A1:M3';
const API_KEY = 'AIzaSyDoBuWBVUo-PAY82kE41vhlVZaurmkOnnI';

// Função para construir o cabeçalho da tabela
function buildTableHeader(headers) {
    const thead = document.querySelector('#data-table thead tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        thead.appendChild(th);
    });
}

// Função para construir as linhas da tabela
function buildTableRows(sheetData) {
    const tbody = document.getElementById('table-body');
    sheetData.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
            
            if (index === 12) {
                const link = document.createElement('a');
                link.href = cell;
                link.textContent = 'Link para rota otimizada';
                link.target = '_blank';
                td.appendChild(link);
            } else {
                td.textContent = cell;
            }
            
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// Função para criar as barras de progresso
function buildProgressBars(sheetData) {
    const progressContainer = document.getElementById('progress-container');
    const progressData = [
        { label: 'Nível disponível da Lixeira 1', value: parseInt(sheetData[1][3]), iframe: generateIframe(1) },
        { label: 'Nível disponível da Lixeira 2', value: parseInt(sheetData[1][7]), iframe: generateIframe(2) },
        { label: 'Nível disponível da Lixeira 3', value: parseInt(sheetData[1][11]), iframe: generateIframe(3) }
    ];

    progressData.forEach(progress => {
        const progressItem = createProgressItem(progress);
        progressContainer.appendChild(progressItem);
    });
}

// Função para criar um item de progresso
function createProgressItem(progress) {
    const progressItem = document.createElement('div');
    progressItem.classList.add('progress-item');

    const label = document.createElement('div');
    label.textContent = progress.label;
    progressItem.appendChild(label);

    const progressWrapper = document.createElement('div');
    progressWrapper.classList.add('progress-bar');
    
    const progressFill = document.createElement('div');
    progressFill.classList.add('progress-fill');
    progressFill.style.width = `${progress.value}%`;

    setProgressFillClass(progressFill, progress.value);
    progressFill.textContent = `${progress.value}%`;

    progressWrapper.appendChild(progressFill);
    progressItem.appendChild(progressWrapper);

    const iframeWrapper = document.createElement('div');
    iframeWrapper.innerHTML = progress.iframe;
    progressItem.appendChild(iframeWrapper);

    return progressItem;
}

// Função para definir a classe da barra de progresso
function setProgressFillClass(progressFill, value) {
    if (value === 100) {
        progressFill.classList.add('progress-100');
    } else if (value >= 50) {
        progressFill.classList.add('progress-50');
    } else {
        progressFill.classList.add('progress-0');
    }
}

// Função para gerar o iframe com base no índice
function generateIframe(index) {
    const mapUrls = [
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.8046802636463!2d-46.70801542440279!3d-23.53952647881484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce57d3f4c5cb03%3A0x2ba62731dd729c45!2sR.%20Cerro%20Cor%C3%A1%2C%20914%20-%20Vila%20Madalena%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2005061-100!5e0!3m2!1spt-BR!2sbr!4v1735338105438!5m2!1spt-BR!2sbr",
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.639369157598!2d-46.71143602440055!3d-23.61726317876141!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce50d611256955%3A0xd368108b420440ae!2sAv.%20Morumbi%2C%206340%20-%20Morumbi%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2005650-002!5e0!3m2!1spt-BR!2sbr!4v1735258963462!5m2!1spt-BR!2sbr",
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.9264544992843!2d-46.69150202440291!3d-23.535147478817784!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce57e76c43a29f%3A0xf828598be80d3dda!2sAv.%20Pomp%C3%A9ia%2C%201308%20-%20Pompeia%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2005022-001!5e0!3m2!1spt-BR!2sbr!4v1735338288220!5m2!1spt-BR!2sbr"
    ];
    return `<div class="map-container"><iframe src="${mapUrls[index - 1]}" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
}


// Função para mostrar o erro caso os dados não sejam encontrados
function showError() {
    const tbody = document.getElementById('table-body');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'Nenhum dado encontrado.';
    tr.appendChild(td);
    tbody.appendChild(tr);
}

// Função para carregar os dados da planilha
function fetchSheetData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const sheetData = data.values;
            if (sheetData && sheetData.length > 0) {
                buildTableHeader(sheetData[0]);
                buildTableRows(sheetData);
                buildProgressBars(sheetData);
            } else {
                showError();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
            showError();
        });
}

// Função para configurar o botão de alternância da tabela
function setupToggleButton() {
    const table = document.getElementById('data-table');
    const toggleButton = document.getElementById('toggle-table-button');

    toggleButton.addEventListener('click', () => {
        if (table.style.display === 'none' || table.style.display === '') {
            table.style.display = 'table';
            toggleButton.textContent = 'Esconder Tabela';
        } else {
            table.style.display = 'none';
            toggleButton.textContent = 'Mostrar Tabela detalhada';
        }
    });
}

// Função principal que chama todas as outras
function init() {
    fetchSheetData();
    setupToggleButton();
}

// Chama a função para inicializar a página
document.addEventListener('DOMContentLoaded', init);

// const intervalo = 30*1000; // Tempo em milissegundos
// // Função para recarregar a página a cada intervalo
// setInterval(() => {
//     location.reload(); // Recarrega a página
// }, intervalo);
