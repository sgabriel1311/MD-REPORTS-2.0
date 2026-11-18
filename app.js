// Carregar chave salva no navegador
const apiKeyInput = document.getElementById('apiKey');
apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';

document.getElementById('saveKeyBtn').addEventListener('click', () => {
  localStorage.setItem('gemini_api_key', apiKeyInput.value.trim());
  alert('Chave salva localmente neste navegador.');
});

// Controle dos checkboxes de atestado (mutuamente exclusivos) e exibição da data de alta
const checkInternacao = document.getElementById('gerarAtestadoInternacao');
const checkAlta = document.getElementById('gerarAtestadoAlta');
const campoDataAlta = document.getElementById('campoDataAlta');

checkInternacao.addEventListener('change', () => {
  if (checkInternacao.checked) {
    checkAlta.checked = false;
    campoDataAlta.style.display = 'none';
  }
});

checkAlta.addEventListener('change', () => {
  if (checkAlta.checked) {
    checkInternacao.checked = false;
    campoDataAlta.style.display = 'block';
  } else {
    campoDataAlta.style.display = 'none';
  }
});

// Formatar data YYYY-MM-DD para DD/MM/AAAA
function formatarDataBR(dataStr) {
  if (!dataStr) return '[DATA NÃO INFORMADA]';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Regras de retorno de ambulatório e curativos baseadas no dia da semana da alta
function calcularRetornosAlta(dataAltaStr) {
  if (!dataAltaStr) return '';
  const [ano, mes, dia] = dataAltaStr.split('-').map(Number);
  const dataAlta = new Date(ano, mes - 1, dia);
  const diaSemana = dataAlta.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb

  const diasSemanaNomes = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];

  // Cálculo retorno Plástica
  let diasPlastica = 7;
  if (diaSemana === 0 || diaSemana === 1) diasPlastica = 8; // Dom ou Seg -> 8 dias
  else if (diaSemana === 2 || diaSemana === 3) diasPlastica = 7; // Ter ou Qua -> 7 dias
  else if (diaSemana === 4) diasPlastica = 4; // Qui -> 4 dias
  else if (diaSemana === 5) diasPlastica = 5; // Sex -> 5 dias

  const dataPlastica = new Date(dataAlta);
  dataPlastica.setDate(dataAlta.getDate() + diasPlastica);
  const strPlastica = `${diasSemanaNomes[dataPlastica.getDay()]}, DIA ${String(dataPlastica.getDate()).padStart(2, '0')}/${String(dataPlastica.getMonth() + 1).padStart(2, '0')}/${dataPlastica.getFullYear()}`;

  // Cálculo primeiro curativo (+2 dias; se cair Sáb ou Dom, adia para Segunda)
  const dataCurativo = new Date(dataAlta);
  dataCurativo.setDate(dataAlta.getDate() + 2);
  if (dataCurativo.getDay() === 6) dataCurativo.setDate(dataCurativo.getDate() + 2); // Sáb -> Seg
  if (dataCurativo.getDay() === 0) dataCurativo.setDate(dataCurativo.getDate() + 1); // Dom -> Seg
  const strCurativo = `${diasSemanaNomes[dataCurativo.getDay()]}, DIA ${String(dataCurativo.getDate()).padStart(2, '0')}/${String(dataCurativo.getMonth() + 1).padStart(2, '0')}/${dataCurativo.getFullYear()}`;

  return `
ORIENTAÇÕES DE RETORNO OBRIGATÓRIAS PARA INCLUIR NO RELATÓRIO DE ALTA:
- RETORNO AMBULATORIAL COM CIRURGIA PLÁSTICA EM: ${strPlastica}.
- RETORNO A CADA 02 DIAS PARA CURATIVO NESTA UNIDADE HOSPITALAR, PRIMEIRO RETORNO EM: ${strCurativo}.
- RETORNO EM AMBULATÓRIO DE FISIOTERAPIA E EQUIPE MULTIPROFISSIONAL NO AMBULATÓRIO HUGOL.
`;
}

// Envio do formulário e chamada ao agente Gemini
document.getElementById('docForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert('Por favor, insira sua Chave API do Google Gemini no topo da página.');
    return;
  }

  const tipoRelatorio = document.querySelector('input[name="tipoRelatorio"]:checked').value;
  const evolucao = document.getElementById('evolucao').value.trim();
  const dataAdmissao = formatarDataBR(document.getElementById('dataAdmissao').value);
  const dataAltaRaw = document.getElementById('dataAlta').value;
  const dataAlta = formatarDataBR(dataAltaRaw);

  const btn = document.getElementById('gerarBtn');
  btn.disabled = true;
  btn.textContent = 'Gerando documentos...';

  // Montagem das instruções do agente
  let instrucoes = `
VOCÊ É UM MÉDICO ASSISTENTE HOSPITALAR. GERE OS DOCUMENTOS SOLICITADOS COM BASE ESTRITA NA EVOLUÇÃO CLÍNICA FORNECIDA.
REGRAS GERAIS OBRIGATÓRIAS:
1. TODO O TEXTO DEVE SER GERADO EM LETRAS MAIÚSCULAS (CAIXA ALTA).
2. O RELATÓRIO DEVE SER REDIGIDO EM TEXTO CORRIDO (PARÁGRAFO ÚNICO OU PARÁGRAFOS CONTÍNUOS), SEM TÓPICOS, SEM MARCADORES E SEM ASTERISCOS.
3. NÃO INCLUA NOTAS EXPLICATIVAS, OBSERVAÇÕES DO ASSISTENTE OU CÁLCULOS DE DATAS. ENTREGUE APENAS O TEXTO FINAL PRONTO PARA COPIAR E COLAR NO PRONTUÁRIO.
`;

  if (tipoRelatorio === 'trabalhista') {
    instrucoes += `
TAREFA 1 - RELATÓRIO MÉDICO DE INTERNAÇÃO PARA FINS TRABALHISTAS / INSS:
- INFORME IDENTIFICAÇÃO DO PACIENTE (NOME, IDADE), DATA DE INTERNAÇÃO (${dataAdmissao}, SE CONSTAR NA EVOLUÇÃO USE A DA EVOLUÇÃO), MOTIVO DA INTERNAÇÃO, DIAGNÓSTICOS/LESÕES (COM CID-10 SE APLICÁVEL), PROCEDIMENTOS CIRÚRGICOS/CONDUTAS REALIZADAS, ESTADO CLÍNICO ATUAL E INCAPACIDADE LABORAL TEMPORÁRIA DURANTE A INTERNAÇÃO.
- REGRA CRÍTICA: NÃO INCLUA ESTIMATIVA OU PREVISÃO DE ALTA HOSPITALAR. FINALIZE INFORMANDO QUE O PACIENTE PERMANECE INTERNADO SOB CUIDADOS MÉDICOS HOSPITALARES, SEM PREVISÃO DE ALTA NO MOMENTO.
`;
  } else {
    const retornos = calcularRetornosAlta(dataAltaRaw);
    instrucoes += `
TAREFA 1 - RELATÓRIO DE ALTA MÉDICO-HOSPITALAR:
- INFORME IDENTIFICAÇÃO DO PACIENTE, PERÍODO DE INTERNAÇÃO (ADMISSÃO EM ${dataAdmissao} E ALTA EM ${dataAlta}), DIAGNÓSTICO DE ENTRADA E ALTA, RESUMO DA EVOLUÇÃO E PROCEDIMENTOS REALIZADOS, CONDIÇÕES CLÍNICAS NA ALTA E ORIENTAÇÕES GERAIS.
${retornos}
`;
  }

  if (checkInternacao.checked) {
    instrucoes += `
TAREFA 2 - ATESTADO DE INTERNAÇÃO HOSPITALAR (SEPARADO POR UMA LINHA EM BRANCO COM O TÍTULO "ATESTADO MÉDICO"):
- ATESTO PARA OS DEVIDOS FINS QUE O(A) PACIENTE [NOME COMPLETO] ENCONTRA-SE INTERNADO(A) NESTA INSTITUIÇÃO HOSPITALAR DESDE O DIA ${dataAdmissao}, SOB CUIDADOS MÉDICOS, SEM PREVISÃO DE ALTA HOSPITALAR ATÉ A PRESENTE DATA. INCLUA O CID-10 PRINCIPAL SE AUTORIZADO/CONSTAR NA EVOLUÇÃO.
`;
  } else if (checkAlta.checked) {
    instrucoes += `
TAREFA 2 - ATESTADO DE ALTA MÉDICA (SEPARADO POR UMA LINHA EM BRANCO COM O TÍTULO "ATESTADO MÉDICO"):
- ATESTO PARA OS DEVIDOS FINS QUE O(A) PACIENTE [NOME COMPLETO] ESTEVE INTERNADO(A) NESTA INSTITUIÇÃO HOSPITALAR NO PERÍODO DE ${dataAdmissao} A ${dataAlta}, RECEBENDO ALTA MÉDICA HOSPITALAR NESTA DATA, NECESSITANDO DE AFASTAMENTO DE SUAS ATIVIDADES LABORAIS PARA CONVALESCENÇA (INFORMAR PRAZO SE CONSTAR NA EVOLUÇÃO OU DEIXAR [X] DIAS PARA PREENCHIMENTO). INCLUA O CID-10 PRINCIPAL.
`;
  }

  const promptFinal = `${instrucoes}\n\nEVOLUÇÃO CLÍNICA FORNECIDA:\n${evolucao}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptFinal }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const textoGerado = data.candidates[0].content.parts[0].text.toUpperCase();
    document.getElementById('resultadoTexto').value = textoGerado.trim();
    document.getElementById('resultadoSection').style.display = 'block';
  } catch (err) {
    alert('Erro ao gerar documento: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Gerar Documentos';
  }
});

// Botão Copiar
document.getElementById('copiarBtn').addEventListener('click', () => {
  const texto = document.getElementById('resultadoTexto');
  texto.select();
  document.execCommand('copy');
  alert('Texto copiado para a área de transferência!');
});
