const WORKER_URL = 'https://md-reports20.lgpsluizgabriel.workers.dev/';

// Controle dos checkboxes de atestado e exibição da data de alta
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
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Regras de retorno de ambulatório e curativos na alta
function calcularRetornosAlta(dataAltaStr) {
  if (!dataAltaStr) return '';
  const [ano, mes, dia] = dataAltaStr.split('-').map(Number);
  const dataAlta = new Date(ano, mes - 1, dia);
  const diaSemana = dataAlta.getDay();

  const diasSemanaNomes = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];

  let diasPlastica = 7;
  if (diaSemana === 0 || diaSemana === 1) diasPlastica = 8;
  else if (diaSemana === 2 || diaSemana === 3) diasPlastica = 7;
  else if (diaSemana === 4) diasPlastica = 4;
  else if (diaSemana === 5) diasPlastica = 5;

  const dataPlastica = new Date(dataAlta);
  dataPlastica.setDate(dataAlta.getDate() + diasPlastica);
  const strPlastica = `${diasSemanaNomes[dataPlastica.getDay()]}, DIA ${String(dataPlastica.getDate()).padStart(2, '0')}/${String(dataPlastica.getMonth() + 1).padStart(2, '0')}/${dataPlastica.getFullYear()}`;

  const dataCurativo = new Date(dataAlta);
  dataCurativo.setDate(dataAlta.getDate() + 2);
  if (dataCurativo.getDay() === 6) dataCurativo.setDate(dataCurativo.getDate() + 2);
  if (dataCurativo.getDay() === 0) dataCurativo.setDate(dataCurativo.getDate() + 1);
  const strCurativo = `${diasSemanaNomes[dataCurativo.getDay()]}, DIA ${String(dataCurativo.getDate()).padStart(2, '0')}/${String(dataCurativo.getMonth() + 1).padStart(2, '0')}/${dataCurativo.getFullYear()}`;

  return `
ORIENTAÇÕES DE RETORNO OBRIGATÓRIAS NO FINAL DO RELATÓRIO DE ALTA:
- RETORNO AMBULATORIAL COM CIRURGIA PLÁSTICA EM: ${strPlastica}.
- RETORNO A CADA 02 DIAS PARA CURATIVO NESTA UNIDADE HOSPITALAR, PRIMEIRO RETORNO EM: ${strCurativo}.
- RETORNO EM AMBULATÓRIO DE FISIOTERAPIA E EQUIPE MULTIPROFISSIONAL NO AMBULATÓRIO HUGOL.
`;
}

document.getElementById('docForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const tipoRelatorio = document.querySelector('input[name="tipoRelatorio"]:checked').value;
  const evolucao = document.getElementById('evolucao').value.trim();
  const dataAdmissao = formatarDataBR(document.getElementById('dataAdmissao').value);
  const dataAltaRaw = document.getElementById('dataAlta').value;
  const dataAlta = formatarDataBR(dataAltaRaw);
  const pedirAtestadoInternacao = checkInternacao.checked;
  const pedirAtestadoAlta = checkAlta.checked;

  const btn = document.getElementById('gerarBtn');
  btn.disabled = true;
  btn.textContent = 'Gerando documentos...';

  let instrucoes = `
VOCÊ É UM MÉDICO ASSISTENTE HOSPITALAR DO HUGOL. GERE OS DOCUMENTOS SOLICITADOS COM BASE ESTRITA NA EVOLUÇÃO CLÍNICA FORNECIDA.
REGRAS OBRIGATÓRIAS:
1. TODO O TEXTO DEVE SER EM LETRAS MAIÚSCULAS (CAIXA ALTA).
2. REDIJA EM TEXTO CORRIDO (PARÁGRAFO ÚNICO OU PARÁGRAFOS CONTÍNUOS), SEM TÓPICOS, SEM MARCADORES E SEM ASTERISCOS.
3. NÃO INCLUA NOTAS EXPLICATIVAS OU CÁLCULOS DE DATAS.
4. USE EXATAMENTE OS MARCADORES ===RELATORIO=== E ===ATESTADO=== PARA SEPARAR OS DOIS DOCUMENTOS NA RESPOSTA.
`;

  if (tipoRelatorio === 'trabalhista') {
    instrucoes += `
===RELATORIO===
GERE O RELATÓRIO MÉDICO DE INTERNAÇÃO PARA FINS TRABALHISTAS / INSS:
- IDENTIFICAÇÃO DO PACIENTE (NOME COMPLETO, IDADE), DATA DE INTERNAÇÃO (${dataAdmissao || 'EXTRAIR DA EVOLUÇÃO'}), MOTIVO DA INTERNAÇÃO, DIAGNÓSTICOS/LESÕES (COM CID-10 SE APLICÁVEL), PROCEDIMENTOS CIRÚRGICOS E CONDUTAS REALIZADAS, ESTADO CLÍNICO ATUAL E INCAPACIDADE LABORAL TEMPORÁRIA DURANTE A INTERNAÇÃO.
- REGRA CRÍTICA: NÃO INCLUA ESTIMATIVA OU PREVISÃO DE ALTA HOSPITALAR. FINALIZE INFORMANDO QUE O PACIENTE PERMANECE INTERNADO SOB CUIDADOS MÉDICOS HOSPITALARES, SEM PREVISÃO DE ALTA NO MOMENTO.
`;
  } else {
    const retornos = calcularRetornosAlta(dataAltaRaw);
    instrucoes += `
===RELATORIO===
GERE O RELATÓRIO DE ALTA MÉDICO-HOSPITALAR:
- IDENTIFICAÇÃO DO PACIENTE, PERÍODO DE INTERNAÇÃO (ADMISSÃO EM ${dataAdmissao || 'EXTRAIR DA EVOLUÇÃO'} E ALTA EM ${dataAlta || 'EXTRAIR DA EVOLUÇÃO'}), DIAGNÓSTICOS, RESUMO DA EVOLUÇÃO E PROCEDIMENTOS REALIZADOS, CONDIÇÕES CLÍNICAS NA ALTA E ORIENTAÇÕES.
${retornos}
`;
  }

  if (pedirAtestadoInternacao) {
    instrucoes += `
===ATESTADO===
GERE O ATESTADO DE INTERNAÇÃO HOSPITALAR EM TEXTO CORRIDO:
"ATESTO PARA OS DEVIDOS FINS QUE O(A) PACIENTE [NOME COMPLETO DO PACIENTE] ENCONTRA-SE INTERNADO(A) NESTA INSTITUIÇÃO HOSPITALAR DESDE O DIA ${dataAdmissao || '[DATA DE ADMISSÃO DA EVOLUÇÃO]'}, SOB CUIDADOS MÉDICOS ESPECIALIZADOS, PERMANECENDO INTERNADO(A) SEM PREVISÃO DE ALTA HOSPITALAR ATÉ A PRESENTE DATA. CID-10: [CID PRINCIPAL]."
`;
  } else if (pedirAtestadoAlta) {
    instrucoes += `
===ATESTADO===
GERE O ATESTADO DE ALTA MÉDICA EM TEXTO CORRIDO:
"ATESTO PARA OS DEVIDOS FINS QUE O(A) PACIENTE [NOME COMPLETO DO PACIENTE] ESTEVE INTERNADO(A) NESTA INSTITUIÇÃO HOSPITALAR NO PERÍODO DE ${dataAdmissao || '[DATA ADMISSÃO]'} A ${dataAlta || '[DATA ALTA]'}, RECEBENDO ALTA MÉDICA HOSPITALAR NESTA DATA, NECESSITANDO DE AFASTAMENTO DE SUAS ATIVIDADES LABORAIS POR [PRAZO DA EVOLUÇÃO OU ____ DIAS] PARA CONVALESCENÇA. CID-10: [CID PRINCIPAL]."
`;
  }

  const promptFinal = `${instrucoes}\n\nEVOLUÇÃO CLÍNICA FORNECIDA:\n${evolucao}`;

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptFinal })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('Resposta inesperada do servidor: ' + JSON.stringify(data));
    }

    const textoCompleto = data.candidates[0].content.parts[0].text.toUpperCase();

    // Separa Relatório e Atestado usando o marcador ===ATESTADO===
    const partes = textoCompleto.split('===ATESTADO===');
    const textoRelatorio = partes[0].replace('===RELATORIO===', '').trim();
    const textoAtestado = partes[1] ? partes[1].trim() : '';

    // Exibe a caixa do Relatório
    const secaoRelatorio = document.getElementById('secaoRelatorio');
    document.getElementById('tituloRelatorioGerado').textContent =
      tipoRelatorio === 'trabalhista' ? 'Relatório Médico (Fins Trabalhistas / INSS)' : 'Relatório de Alta Médico-Hospitalar';
    document.getElementById('textoRelatorioGerado').value = textoRelatorio;
    secaoRelatorio.style.display = 'block';

    // Exibe a caixa do Atestado (se foi marcado)
    const secaoAtestado = document.getElementById('secaoAtestado');
    if (pedirAtestadoInternacao || pedirAtestadoAlta) {
      document.getElementById('tituloAtestadoGerado').textContent =
        pedirAtestadoInternacao ? 'Atestado de Internação Hospitalar' : 'Atestado de Alta Médica';
      document.getElementById('textoAtestadoGerado').value = textoAtestado || 'NÃO FOI POSSÍVEL GERAR O ATESTADO. TENTE NOVAMENTE.';
      secaoAtestado.style.display = 'block';
    } else {
      secaoAtestado.style.display = 'none';
    }

    // Rola a página suavemente até o resultado
    secaoRelatorio.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Erro ao gerar documento: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Gerar Documentos';
  }
});

// Botões de Copiar individuais
document.getElementById('copiarRelatorioBtn').addEventListener('click', () => {
  const texto = document.getElementById('textoRelatorioGerado');
  texto.select();
  navigator.clipboard.writeText(texto.value);
  alert('Relatório copiado!');
});

document.getElementById('copiarAtestadoBtn').addEventListener('click', () => {
  const texto = document.getElementById('textoAtestadoGerado');
  texto.select();
  navigator.clipboard.writeText(texto.value);
  alert('Atestado copiado!');
});
