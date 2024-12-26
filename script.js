// Defina a URL da sua planilha do Google Sheets (publique a planilha como "Qualquer pessoa com o link")
const SPREADSHEET_ID = '1ZsOUdF7bzeW8IJ9J_Gn49Q4jJlVpj8984DU1bjNQNGI';
const RANGE = 'Página1!A1:M3'; // Ajuste o intervalo conforme necessário
const API_KEY = 'AIzaSyDoBuWBVUo-PAY82kE41vhlVZaurmkOnnI';

// Função para acessar a API do Google Sheets
function fetchSheetData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const sheetData = data.values;
            const tbody = document.getElementById('table-body');
            const thead = document.querySelector('#data-table thead tr');
            const progressContainer = document.getElementById('progress-container');

            if (sheetData && sheetData.length > 0) {
                // Gerar cabeçalhos com base na primeira linha dos dados
                const headers = sheetData[0]; // A primeira linha dos dados será o cabeçalho
                headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header; // Usando o valor da célula como título da coluna
                    thead.appendChild(th);
                });

                // Preencher as linhas da tabela (excluindo a primeira linha que já foi usada como cabeçalho)
                sheetData.slice(1).forEach(row => {
                    const tr = document.createElement('tr');
                    row.forEach((cell, index) => {
                        const td = document.createElement('td');
                        
                        // Verifica se é a célula M2 (índice 12, ou seja, a 13ª coluna)
                        if (index === 12) {
                            const link = document.createElement('a');
                            link.href = cell;  // O valor de M2 será o URL
                            link.textContent = 'Link para rota otimizada';
                            link.target = '_blank';  // Abrir o link em nova aba
                            td.appendChild(link);
                        } else {
                            td.textContent = cell; // Insere os dados da célula normalmente
                        }
                        
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });

                // Mostrar as barras de progresso apenas para as colunas D2, H2 e L2
                const progressData = [
                    { label: 'Nível de preenchimento da Lixeira 1', value: parseInt(sheetData[1][3]) }, // D2
                    { label: 'Nível de preenchimento da Lixeira 2', value: parseInt(sheetData[1][7]) }, // H2
                    { label: 'Nível de preenchimento da Lixeira 3', value: parseInt(sheetData[1][11]) } // L2
                ];

                progressData.forEach(progress => {
                    const progressItem = document.createElement('div');
                    progressItem.classList.add('progress-item');

                    const label = document.createElement('div');
                    label.textContent = progress.label;
                    progressItem.appendChild(label);

                    const progressWrapper = document.createElement('div');
                    progressWrapper.classList.add('progress-bar');
                    
                    const progressFill = document.createElement('div');
                    progressFill.classList.add('progress-fill');
                    
                    // Definir o valor da barra de progresso com base na célula
                    const progressValue = progress.value;
                    progressFill.style.width = `${progressValue}%`;

                    // Adicionar classes para cores de acordo com o valor
                    if (progressValue === 100) {
                        progressFill.classList.add('progress-100');
                    } else if (progressValue >= 50) {
                        progressFill.classList.add('progress-50');
                    } else {
                        progressFill.classList.add('progress-0');
                    }

                    // Adicionar texto no centro da barra de progresso
                    progressFill.textContent = `${progressValue}%`;

                    progressWrapper.appendChild(progressFill);
                    progressItem.appendChild(progressWrapper);
                    progressContainer.appendChild(progressItem);
                });
            } else {
                // Caso não haja dados
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 4; // Ajuste conforme o número de colunas
                td.textContent = 'Nenhum dado encontrado.';
                tr.appendChild(td);
                tbody.appendChild(tr);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
            const tbody = document.getElementById('table-body');
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4; // Ajuste conforme o número de colunas
            td.textContent = 'Erro ao carregar os dados.';
            tr.appendChild(td);
            tbody.appendChild(tr);
        });
}

// Chama a função para carregar os dados quando a página for carregada
fetchSheetData();
