// --- 0. Lógica de Notificações (Toast) ---
function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    let icone = 'fa-circle-check';
    if(tipo === 'error') icone = 'fa-circle-xmark';
    if(tipo === 'warning') icone = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icone}"></i><span>${mensagem}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 4000);
}

// --- 1. Navegação ---
function navegar(idPagina, elementoClicado) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    document.getElementById('page-' + idPagina).classList.add('active');
    
    document.querySelectorAll('.menu-item:not(#toggle-btn)').forEach(item => item.classList.remove('active'));
    elementoClicado.classList.add('active');
}

// Função inteligente para integrar os Cards da Home com o Menu
function irPara(idPagina) {
    const menuItems = document.querySelectorAll('.menu-item');
    let itemAlvo = menuItems[0]; 
    
    menuItems.forEach(item => {
        const acaoClick = item.getAttribute('onclick') || '';
        if(acaoClick.includes(`'${idPagina}'`)) {
            itemAlvo = item;
        }
    });
    
    navegar(idPagina, itemAlvo);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icone = document.getElementById('toggle-icon');
    
    sidebar.classList.toggle('collapsed');
    if (sidebar.classList.contains('collapsed')) {
        icone.classList.replace('fa-chevron-left', 'fa-chevron-right');
    } else {
        icone.classList.replace('fa-chevron-right', 'fa-chevron-left');
    }
}

// --- 2. Lógica de Envio de Comentário Real via EmailJS ---
async function enviarComentario() {
    const EMAILJS_PUBLIC_KEY = "XdLOBuf0jX270WE1Q";
    const EMAILJS_SERVICE_ID = "SEU_SERVICE_ID_AQUI"; // <-- Preencha com seu Service ID
    const EMAILJS_TEMPLATE_ID = "template_emzclna";

    const nome = document.getElementById('coment-nome').value.trim();
    const email = document.getElementById('coment-email').value.trim().toLowerCase();
    const texto = document.getElementById('coment-texto').value.trim();

    if (!nome || !email || !texto) {
        mostrarToast("Por favor, preencha todos os campos antes de enviar!", "warning");
        return;
    }

    if (!email.endsWith('@totvs.com.br')) {
        mostrarToast("Acesso restrito: Utilize um e-mail com domínio @totvs.com.br", "error");
        return;
    }

    const btnSubmit = document.getElementById('btn-enviar-comentario');
    const textoOriginalBotao = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
    btnSubmit.disabled = true;

    emailjs.init(EMAILJS_PUBLIC_KEY);

    const parametrosTemplate = {
        nome: nome,
        email: email,
        mensagem: texto
    };

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, parametrosTemplate);
        mostrarToast("Comentário enviado com sucesso!", "success");
        
        document.getElementById('coment-nome').value = '';
        document.getElementById('coment-email').value = '';
        document.getElementById('coment-texto').value = '';

    } catch (erro) {
        console.error("Erro ao enviar e-mail pelo EmailJS:", erro);
        mostrarToast("Ocorreu um erro ao enviar o e-mail. Verifique o Service ID.", "error");
    } finally {
        btnSubmit.innerHTML = textoOriginalBotao;
        btnSubmit.disabled = false;
    }
}


// =====================================================================
// === NOVO: VARIÁVEIS E FUNÇÕES DE SELEÇÃO DE MODELOS ===
// =====================================================================
let modeloQRAtual = 1;
let modeloMVPARAtual = 1;

function selecionarModeloQR(modeloId, elementoClicado) {
    modeloQRAtual = modeloId;
    document.querySelectorAll('#page-qrcode .model-card').forEach(card => card.classList.remove('active'));
    elementoClicado.classList.add('active');
}

function selecionarModeloMVPAR(modeloId, elementoClicado) {
    modeloMVPARAtual = modeloId;
    document.querySelectorAll('#page-mvpar .model-card').forEach(card => card.classList.remove('active'));
    elementoClicado.classList.add('active');
}


// --- 3. Lógica do Gerador QR Code ---
let linksParaQR = [];

function adicionarLinkQR() {
    const input = document.getElementById('qr-input-link');
    const link = input.value.trim();

    if (!link) {
        mostrarToast("Por favor, insira um link válido!", "warning");
        return;
    }
    if (linksParaQR.length >= 5) {
        mostrarToast("Você já atingiu o limite máximo de 5 links na lista.", "warning");
        return;
    }

    linksParaQR.push(link);
    input.value = ''; 
    renderizarListaQR();
}

function removerLinkQR(index) {
    linksParaQR.splice(index, 1);
    renderizarListaQR();
}

function renderizarListaQR() {
    const container = document.getElementById('qr-list-container');
    container.innerHTML = '';

    linksParaQR.forEach((link, index) => {
        container.innerHTML += `
            <li class="link-item">
                <span>${link}</span>
                <i class="fa-solid fa-trash" onclick="removerLinkQR(${index})" title="Remover link"></i>
            </li>
        `;
    });
}

function limparListaQR() {
    linksParaQR = [];
    renderizarListaQR();
    document.getElementById('qr-result-area').innerHTML = '';
    document.getElementById('qr-result-area').style.display = 'none';
    document.getElementById('btn-batch-download').style.display = 'none';
}

// === FUNÇÃO DE GERAR QR CODE ATUALIZADA COM OS MODELOS ===
function gerarQRCodes() {
    if (linksParaQR.length === 0) {
        mostrarToast("Adicione pelo menos um link à lista antes de gerar!", "warning");
        return;
    }

    const container = document.getElementById('qr-result-area');
    container.innerHTML = ''; 
    container.style.display = 'flex';
    document.getElementById('btn-batch-download').style.display = 'inline-block';

    linksParaQR.forEach((link, index) => {
        const card = document.createElement('div');
        card.className = 'qr-card';

        const qrWrapper = document.createElement('div');
        card.appendChild(qrWrapper);

        const btnDownload = document.createElement('button');
        btnDownload.className = 'btn-secondary btn-small';
        btnDownload.innerHTML = '<i class="fa-solid fa-download"></i> Baixar Individual';
        
        card.appendChild(document.createElement('br'));
        card.appendChild(btnDownload);
        container.appendChild(card);

        // Opções base do QR Code
        let opcoesQR = {
            width: 180, 
            height: 180, 
            data: link,
            image: "img/totvs_icon_131953.png", 
            imageOptions: { crossOrigin: "anonymous", margin: 5 }
        };

        // Aplica o design dependendo do modelo selecionado
        if (modeloQRAtual === 1) { // Padrão TOTVS
            opcoesQR.dotsOptions = { color: "#01202e", type: "rounded" };
            opcoesQR.cornersSquareOptions = { type: "extra-rounded", color: "#01202e" };
            opcoesQR.cornersDotOptions = { type: "dot", color: "#14c5e3" };
        } else if (modeloQRAtual === 2) { // Azul Moderno
            opcoesQR.dotsOptions = { color: "#14c5e3", type: "square" };
            opcoesQR.cornersSquareOptions = { type: "square", color: "#14c5e3" };
            opcoesQR.cornersDotOptions = { type: "square", color: "#01202e" };
        } else if (modeloQRAtual === 3) { // Clássico Dark
            opcoesQR.dotsOptions = { color: "#222222", type: "classy-rounded" };
            opcoesQR.cornersSquareOptions = { type: "dot", color: "#222222" };
            opcoesQR.cornersDotOptions = { type: "dot", color: "#222222" };
        }

        const qrCode = new QRCodeStyling(opcoesQR);
        btnDownload.onclick = () => qrCode.download({ name: `qrcode-modelo${modeloQRAtual}-${index + 1}`, extension: "png" });
        qrCode.append(qrWrapper);
    });
}

function baixarAgrupadoQR() {
    const area = document.getElementById('qr-result-area');
    const botoes = area.querySelectorAll('button');
    botoes.forEach(b => b.style.display = 'none'); 

    html2canvas(area, { backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'qrcodes-agrupados.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        botoes.forEach(b => b.style.display = 'inline-block'); 
    });
}

// --- 4. Lógica do Gerador MV_PAR ---
function buscarParametros() {
    const termo = document.getElementById('param-search-input').value.toUpperCase().trim();
    const dropdown = document.getElementById('search-results-dropdown');
    dropdown.innerHTML = '';

    if (!termo) {
        dropdown.style.display = 'none';
        return;
    }

    if (typeof bancoDeParametros === 'undefined') {
        return;
    }

    const chavesEncontradas = Object.keys(bancoDeParametros).filter(chave => chave.includes(termo));

    if (chavesEncontradas.length === 0) {
        dropdown.innerHTML = '<div class="search-item"><span>Nenhum parâmetro encontrado.</span></div>';
    } else {
        chavesEncontradas.forEach(chave => {
            const dados = bancoDeParametros[chave];
            const item = document.createElement('div');
            item.className = 'search-item';
            item.innerHTML = `
                <strong>${chave}</strong>
                <span>${dados.descricao}</span>
                <span>Conteúdo: <code>${dados.conteudo}</code></span>
            `;
            item.onclick = () => {
                adicionarCardMVPAR(chave, dados);
                document.getElementById('param-search-input').value = ''; 
                dropdown.style.display = 'none'; 
            };
            dropdown.appendChild(item);
        });
    }
    dropdown.style.display = 'block';
}

document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('search-results-dropdown');
    const input = document.getElementById('param-search-input');
    if (event.target !== input && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

function adicionarManualMVPAR() {
    const nome = document.getElementById('manual-nome').value.trim().toUpperCase();
    const tipo = document.getElementById('manual-tipo').value.trim().toUpperCase();
    const desc = document.getElementById('manual-desc').value.trim();
    const cont = document.getElementById('manual-cont').value.trim();

    if(!nome || !desc || !cont) {
        mostrarToast("Por favor, preencha o Nome, Descrição e o Conteúdo Padrão!", "warning");
        return;
    }

    const dadosManuais = {
        tipo: tipo,
        descricao: desc,
        conteudo: cont
    };

    adicionarCardMVPAR(nome, dadosManuais);
    mostrarToast("Parâmetro adicionado à lista!", "success");

    document.getElementById('manual-nome').value = '';
    document.getElementById('manual-tipo').value = '';
    document.getElementById('manual-desc').value = '';
    document.getElementById('manual-cont').value = '';
    document.getElementById('manual-nome').focus();
}

// === FUNÇÃO DE ADICIONAR CARD MV_PAR ATUALIZADA COM OS MODELOS ===
function adicionarCardMVPAR(chave, dados) {
    const container = document.getElementById('area-cards');
    const cardId = 'mvpar-' + Date.now(); 
    const wrapId = 'wrap-' + cardId;

    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.id = wrapId;
    
    let tipoHtml = '';
    if (dados.tipo && dados.tipo !== '') {
        tipoHtml = `<p><strong>Tipo:</strong> ${dados.tipo}</p>`;
    }

    let conteudoHTML = '';

    // Monta o HTML do Card de acordo com o modelo selecionado
    if (modeloMVPARAtual === 1) { // Modelo 1 (Padrão com Borda Lateral)
        conteudoHTML = `
            <div class="card" id="${cardId}">
                <h3>${chave}</h3>
                ${tipoHtml}
                <p><strong>Descrição:</strong> ${dados.descricao}</p>
                <p><strong>Conteúdo Padrão:</strong> <span class="conteudo">${dados.conteudo}</span></p>
            </div>
        `;
    } else if (modeloMVPARAtual === 2) { // Modelo 2 (Cabeçalho Dark)
        conteudoHTML = `
            <div class="card modelo-2" id="${cardId}">
                <h3 class="card-header">${chave}</h3>
                <div class="card-body">
                    ${tipoHtml}
                    <p><strong>Descrição:</strong> ${dados.descricao}</p>
                    <p><strong>Conteúdo Padrão:</strong> <span class="conteudo">${dados.conteudo}</span></p>
                </div>
            </div>
        `;
    } else if (modeloMVPARAtual === 3) { // Modelo 3 (Minimalista Azul)
        conteudoHTML = `
            <div class="card modelo-3" id="${cardId}">
                <h3>${chave}</h3>
                ${tipoHtml}
                <p><strong>Descrição:</strong> ${dados.descricao}</p>
                <p><strong>Conteúdo:</strong> <span class="conteudo">${dados.conteudo}</span></p>
            </div>
        `;
    }

    wrapper.innerHTML = `
        ${conteudoHTML}
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="btn-secondary btn-small" style="margin-top: 0;" onclick="baixarIndividualMVPAR('${cardId}', '${chave}')">
                <i class="fa-solid fa-download"></i> Baixar Individual
            </button>
            <button class="btn-danger btn-small" style="margin-top: 0;" onclick="removerCardMVPAR('${wrapId}')">
                <i class="fa-solid fa-trash"></i> Remover
            </button>
        </div>
    `;
    
    container.appendChild(wrapper);
}

function removerCardMVPAR(wrapId) {
    const wrapper = document.getElementById(wrapId);
    if (wrapper) {
        wrapper.remove();
        mostrarToast("Parâmetro removido da lista.", "success");
    }
}

function limparCards() {
    document.getElementById('area-cards').innerHTML = '';
}

function baixarAgrupadoMVPAR() {
    const areaCards = document.getElementById('area-cards');
    if (areaCards.children.length === 0) {
        mostrarToast("Busque ou adicione manualmente pelo menos um parâmetro à lista.", "warning");
        return;
    }

    const clone = areaCards.cloneNode(true);
    const botoesNoClone = clone.querySelectorAll('button');
    botoesNoClone.forEach(b => b.parentElement.remove()); 
    
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);

    html2canvas(clone, { backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'parametros-agrupados.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        document.body.removeChild(clone); 
    });
}

function baixarIndividualMVPAR(cardId, chaveNome) {
    const card = document.getElementById(cardId);
    html2canvas(card, { backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = `parametro-${chaveNome}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// --- 5. Leitura Direta do Excel ---
let bancoDeParametros = {};

async function carregarPlanilhaExcel() {
    try {
        const response = await fetch('listaparametros.xlsx');
        if (!response.ok) throw new Error("Arquivo não encontrado");
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const primeiraAba = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[primeiraAba];
        const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        for (let i = 1; i < dados.length; i++) {
            const linha = dados[i];
            if (!linha[0]) continue; 
            const chave = String(linha[0]).trim().toUpperCase();

            const tipo = linha[1] ? String(linha[1]).trim() : "";

            let partesDescricao = [];
            if (linha[2]) partesDescricao.push(String(linha[2]).trim());
            if (linha[3]) partesDescricao.push(String(linha[3]).trim());
            if (linha[4]) partesDescricao.push(String(linha[4]).trim());
            const descricaoFinal = partesDescricao.join(" "); 

            const conteudoFinal = linha[5] ? String(linha[5]).trim() : "";

            bancoDeParametros[chave] = {
                tipo: tipo,
                descricao: descricaoFinal,
                conteudo: conteudoFinal
            };
        }
        console.log("✅ Planilha carregada e processada com sucesso!");
        
    } catch (erro) {
        console.error("❌ Erro ao carregar o Excel:", erro);
        mostrarToast("Não foi possível carregar o arquivo Excel. Verifique se ele se chama 'listaparametros.xlsx'.", "error");
    }
}

window.onload = carregarPlanilhaExcel;

// --- 1.1. Lógica do Iframe Dinâmico de Novidades (TOTVS News) ---
function carregarNewsModulo() {
    const input = document.getElementById('news-module-input');
    const modulo = input.value.trim().toLowerCase(); // Limpa espaços e joga pra minúsculo
    
    if (!modulo) {
        mostrarToast("Por favor, digite o nome de um módulo!", "warning");
        return;
    }
    
    const iframe = document.getElementById('news-iframe');
    // Atualiza a URL do iframe dinamicamente com o módulo digitado
    iframe.src = `https://totvsnews.engpro.totvs.io/${modulo}/bra/por/`;
    
    // Dispara nosso Toast bonito avisando o usuário
    mostrarToast(`Buscando novidades do módulo ${modulo.toUpperCase()}...`, "success");
}

// Permite que o usuário aperte "Enter" no teclado para pesquisar direto
function checarEnterNews(event) {
    if (event.key === 'Enter') {
        carregarNewsModulo();
    }
}

// --- 6. Bloqueio de Inspeção (Anti-Curiosos) ---
document.addEventListener('contextmenu', function(e) {
    e.preventDefault(); // Bloqueia o botão direito
});

document.addEventListener('keydown', function(e) {
    // Bloqueia F12
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
    }
    // Bloqueia Ctrl+Shift+I / J / C
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
    }
    // Bloqueia Ctrl+U
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
    }
});