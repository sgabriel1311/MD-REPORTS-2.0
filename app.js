const WORKER_URL = 'https://md-reports20.lgpsluizgabriel.workers.dev/';

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

function formatarDataBR(dataStr) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

function obterDataAtualExtenso() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const meses = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  return `GOIÂNIA - GO, ${dia} DE ${meses[hoje.getMonth()]} DE ${hoje.getFullYear()}`;
}

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
  // Limpa caracteres de controle invisíveis que podem quebrar o JSON
  const evolucao = document.getElementById('evolucao').value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim();
  const dataAdmissao = formatarDataBR(document.getElementById('dataAdmissao').value);
  const dataAltaRaw = document.getElementById('dataAlta').value;
  const dataAlta = formatarDataBR(dataAltaRaw);
  const dataHojeExtenso = obterDataAtualExtenso();
  const pedirAtestadoInternacao = checkInternacao.checked;
  const pedirAtestadoAlta = checkAlta.checked;

  const btn = document.getElementById('gerarBtn');
  const campoRelatorio = document.getElementById('textoRelatorioGerado');
  const campoAtestado = document.getElementById('textoAtestadoGerado');

  btn.disabled = true;
  btn.textContent = 'Gerando... Aguarde...';
  campoRelatorio.value = 'AGUARDE, PROCESSANDO DOCUMENTOS...';
  campoAtestado.value = (pedirAtestadoInternacao || pedirAtestadoAlta)
    ? 'AGUARDE, GERANDO ATESTADO...'
    : 'NENHUM ATESTADO MARCADO NO ITEM 2.';

  document.getElementById('secaoRelatorio').scrollIntoView({ behavior: 'smooth' });

  let instrucoes = `
VOCÊ É UM MÉDICO ASSISTENTE HOSPITALAR DO HUGOL. GERE OS DOCUMENTOS SOLICITADOS COM BASE ESTRITA NA EVOLUÇÃO CLÍNICA FORNECIDA.
REGRAS OBRIGATÓRIAS:
1. TODO O TEXTO DEVE SER EM LETRAS MAIÚSCULAS (CAIXA ALTA).
2. REDIJA EM PARÁGRAFOS CONTÍNUOS DE TEXTO CORRIDO, SEM TÓPICOS, SEM MARCADORES, SEM NEGRITO E SEM ASTERISCOS.
3. NÃO INCLUA NOTAS EXPLICATIVAS OU OBSERVAÇÕES.
4. USE EXATAMENTE O SEPARADOR ===ATESTADO=== ENTRE O RELATÓRIO E O ATESTADO.
`;

  if (tipoRelatorio === 'trabalhista') {
    instrucoes += `
GERE O RELATÓRIO MÉDICO PARA FINS TRABALHISTAS E PREVIDENCIÁRIOS (INSS) EM 4 PARÁGRAFOS CONTÍNUOS:

PARÁGRAFO 1: INICIE EXATAMENTE COM "RELATÓRIO MÉDICO PARA FINS TRABALHISTAS E PREVIDENCIÁRIOS (INSS). PACIENTE [NOME COMPLETO], [IDADE] ANOS, ADMITIDO NO HOSPITAL ESTADUAL DE URGÊNCIAS GOVERNADOR OTÁVIO LAGE DE SIQUEIRA (HUGOL) EM ${dataAdmissao || '[DATA ADMISSÃO DA EVOLUÇÃO]'}..." DESCREVA TRANSFERÊNCIA PARA ENFERMARIA (SE CONSTAR), PERMANÊNCIA INTERNADO ATÉ A PRESENTE DATA, DATA E MECANISMO/AGENTE DO TRAUMA (INDICANDO ACIDENTE DE TRABALHO SE CONSTAR), REGIÕES ACOMETIDAS, SCQ/EXTENSÃO E SINAIS CLÍNICOS INICIAIS.

PARÁGRAFO 2: INICIE COM "DURANTE A INTERNAÇÃO HOSPITALAR, RECEBEU O DIAGNÓSTICO DE..." DESCREVA DIAGNÓSTICOS, SUPORTE CLÍNICO (ANALGESIA, PROFILAXIAS TEV/LAMG, VACINA, ANTIBIÓTICOS SE HOUVER, ACOMPANHAMENTO CIRURGIA PLÁSTICA E MULTIPROFISSIONAL), PROCEDIMENTOS CIRÚRGICOS JÁ REALIZADOS COM DATAS E CIRURGIAS PROGRAMADAS COM DATAS.

PARÁGRAFO 3: INICIE COM "ATUALMENTE, O PACIENTE ENCONTRA-SE EM LEITO DE ENFERMARIA..." DESCREVA ESTADO GERAL, CONSCIÊNCIA, PADRÃO RESPIRATÓRIO E HEMODINÂMICO, AJUSTES MEDICAMENTOSOS, DIETA, ELIMINAÇÕES, DEAMBULAÇÃO, CURATIVOS E VIGILÂNCIA.

PARÁGRAFO 4: FINALIZE COM "DIANTE DO EXPOSTO, ATESTA-SE QUE O PACIENTE [NOME COMPLETO] ENCONTRA-SE TOTAL E TEMPORARIAMENTE INCAPAZ PARA O EXERCÍCIO DE SUA ATIVIDADE LABORAL HABITUAL E PARA QUALQUER ATIVIDADE DE TRABALHO, PERMANECENDO EM REGIME DE INTERNAÇÃO HOSPITALAR POR TEMPO INDETERMINADO PARA CONTINUIDADE DO TRATAMENTO CIRÚRGICO REPARADOR, CICATRIZAÇÃO DAS LESÕES E REABILITAÇÃO FUNCIONAL." (NUNCA COLOQUE PREVISÃO DE ALTA).

LINHA FINAL DO RELATÓRIO:
${dataHojeExtenso}
`;
  } else {
    const retornos = calcularRetornosAlta(dataAltaRaw);
    instrucoes += `
GERE O RELATÓRIO DE ALTA MÉDICO-HOSPITALAR EM TEXTO CORRIDO E CAIXA ALTA:
- INICIE COM "RELATÓRIO DE ALTA MÉDICO-HOSPITALAR."
- IDENTIFICAÇÃO DO PACIENTE, PERÍODO DE INTERNAÇÃO NO HUGOL (ADMISSÃO EM ${dataAdmissao || 'EXTRAIR DA EVOLUÇÃO'} E ALTA EM ${dataAlta || 'EXTRAIR DA EVOLUÇÃO'}), DIAGNÓSTICOS, RESUMO DA EVOLUÇÃO E PROCEDIMENTOS REALIZADOS, CONDIÇÕES CLÍNICAS NA ALTA E ORIENTAÇÕES.
${retornos}
- LINHA FINAL: ${dataHojeExtenso}
`;
  }

  if (pedirAtestadoInternacao) {
    instrucoes += `
===ATESTADO===
ATESTO PARA OS DEVIDOS FINS QUE O(A) PACIENTE [NOME COMPLETO DO PACIENTE] ENCONTRA-SE INTERNADO(A) NESTA INSTITUIÇÃO HOSPITALAR DESDE O DIA ${dataAdmissao || '[DATA DE ADMISSÃO DA EVOLUÇÃO]'}, SOB CUIDADOS MÉDICOS ESPECIALIZADOS, PERMANECENDO INTERNADO(A) POR TEMPO INDETERMINADO E SEM PREVISÃO DE ALTA HOSPITALAR ATÉ A PRESENTE DATA. CID-10: [CID PRINCIPAL SE CONSTAR NA EVOLUÇÃO].

${dataHojeExtenso}
`;
  } else if (pedirAtestadoAlta) {
    instrucoes += `
===ATESTADO===
ATESTO PARA OS DEVIDOS FINS QUE O(A) PACIENTE [NOME COMPLETO DO PACIENTE] ESTEVE INTERNADO(A) NESTA INSTITUIÇÃO HOSPITALAR NO PERÍODO DE ${dataAdmissao || '[DATA ADMISSÃO]'} A ${dataAlta || '[DATA ALTA]'}, RECEBENDO ALTA MÉDICA HOSPITALAR NESTA DATA, NECESSITANDO DE AFASTAMENTO DE SUAS ATIVIDADES LABORAIS POR [PRAZO DA EVOLUÇÃO OU ____ DIAS] PARA CONVALESCENÇA. CID-10: [CID PRINCIPAL SE CONSTAR NA EVOLUÇÃO].

${dataHojeExtenso}
`;
  }

  const promptFinal = `${instrucoes}\n\nEVOLUÇÃO CLÍNICA FORNECIDA:\n${evolucao}`;

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptFinal })
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error('Resposta bruta inválida: ' + rawText);
    }

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    const candidato = data.candidates && data.candidates[0];
    if (!candidato || !candidato.content || !candidato.content.parts) {
      throw new Error('Sem texto retornado pela IA. Detalhes: ' + JSON.stringify(data));
    }

    const textoCompleto = candidato.content.parts.map(p => p.text || '').join('').toUpperCase();
    const partes = textoCompleto.split('===ATESTADO===');
    const textoRelatorio = partes[0].replace(/===RELATORIO===/g, '').trim();
    const textoAtestado = partes[1] ? partes[1].trim() : '';

    campoRelatorio.value = textoRelatorio || textoCompleto;
    if (pedirAtestadoInternacao || pedirAtestadoAlta) {
      campoAtestado.value = textoAtestado || 'O ATESTADO NÃO FOI SEPARADO PELA IA. VERIFIQUE O TEXTO ACIMA.';
    }
  } catch (err) {
    campoRelatorio.value = 'ERRO DETECTADO:\n' + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Gerar Documentos';
  }
});

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
