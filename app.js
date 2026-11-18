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
  return `${dia}/${mes}/${ano}`; }  function obterDataAtualExtenso() { const hoje = new Date(); const dia = String(hoje.getDate()).padStart(2, '0'); const meses = [ 'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO' ]; const mes = meses[hoje.getMonth()]; const ano = hoje.getFullYear(); return `GOIÂNIA - GO, ${dia} DE ${mes} DE${ano}`;
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
  const strPlastica = `${diasSemanaNomes[dataPlastica.getDay()]}, DIA${String(dataPlastica.getDate()).padStart(2, '0')}/${String(dataPlastica.getMonth() + 1).padStart(2, '0')}/${dataPlastica.getFullYear()}`;

  const dataCurativo = new Date(dataAlta);
  dataCurativo.setDate(dataAlta.getDate() + 2);
  if (dataCurativo.getDay() === 6) dataCurativo.setDate(dataCurativo.getDate() + 2);
  if (dataCurativo.getDay() === 0) dataCurativo.setDate(dataCurativo.getDate() + 1);
  const strCurativo = `${diasSemanaNomes[dataCurativo.getDay()]}, DIA${String(dataCurativo.getDate()).padStart(2, '0')}/${String(dataCurativo.getMonth() + 1).padStart(2, '0')}/${dataCurativo.getFullYear()}`;

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
  const dataHojeExtenso = obterDataAtualExtenso();
  const pedirAtestadoInternacao = checkInternacao.checked;
  const pedirAtestadoAlta = checkAlta.checked;

  const btn = document.getElementById('gerarBtn');
  const campoRelatorio = document.getElementById('textoRelatorioGerado');
  const campoAtestado = document.getElementById('textoAtestadoGerado');

  btn.disabled = true;
  btn.textContent = 'Processando... Aguarde...';
  campoRelatorio.value = 'GERANDO RELATÓRIO MÉDICO, AGUARDE...';
  campoAtestado.value = (pedirAtestadoInternacao || pedirAtestadoAlta)
    ? 'GERANDO ATESTADO MÉDICO, AGUARDE...'
    : 'NENHUM ATESTADO MARCADO NO ITEM 2.';

  document.getElementById('secaoRelatorio').scrollIntoView({ behavior: 'smooth' });

  let instrucoes = `
VOCÊ É UM MÉDICO ASSISTENTE HOSPITALAR DO HUGOL. GERE OS DOCUMENTOS SOLICITADOS COM BASE ESTRITA NA EVOLUÇÃO CLÍNICA FORNECIDA.
REGRAS GERAIS OBRIGATÓRIAS:
1. TODO O TEXTO DEVE SER EM LETRAS MAIÚSCULAS (CAIXA ALTA).
2. REDIJA EM PARÁGRAFOS CONTÍNUOS DE TEXTO CORRIDO, SEM TÓPICOS, SEM MARCADORES, SEM NEGRITO E SEM ASTERISCOS.
3. NÃO INCLUA NOTAS EXPLICATIVAS, CABEÇALHOS EXTRAS OU OBSERVAÇÕES DO ASSISTENTE.
4. USE EXATAMENTE OS MARCADORES ===RELATORIO=== E ===ATESTADO=== PARA SEPARAR OS DOIS DOCUMENTOS.
`;

  if (tipoRelatorio === 'trabalhista') {
    instrucoes += `
===RELATORIO===
SIGA RIGOROSAMENTE ESTA ESTRUTURA EM 4 PARÁGRAFOS CONTÍNUOS E A DATA FINAL:

PARÁGRAFO 1 (IDENTIFICAÇÃO, ADMISSÃO E TRAUMA/MOTIVO):
INICIE EXATAMENTE COM: "RELATÓRIO MÉDICO PARA FINS TRABALHISTAS E PREVIDENCIÁRIOS (INSS). PACIENTE [NOME COMPLETO], [IDADE] ANOS, ADMITIDO NO HOSPITAL ESTADUAL DE URGÊNCIAS GOVERNADOR OTÁVIO LAGE DE SIQUEIRA (HUGOL) EM ${dataAdmissao || '[DATA ADMISSÃO DA EVOLUÇÃO]'}..."
DESCREVA A DATA DE TRANSFERÊNCIA PARA A ENFERMARIA (SE CONSTAR), QUE PERMANECE INTERNADO ATÉ A PRESENTE DATA, A DATA E O MECANISMO/AGENTE DO TRAUMA OU EVENTO (INDICANDO SE FOI ACIDENTE DE TRABALHO), AS REGIÕES ANATÔMICAS ACOMETIDAS, EXTENSÃO/SCQ (SE QUEIMADURA) E SINAIS CLÍNICOS INICIAIS DA ADMISSÃO.

PARÁGRAFO 2 (DIAGNÓSTICO, SUPORTE E PROCEDIMENTOS CIRÚRGICOS):
INICIE COM: "DURANTE A INTERNAÇÃO HOSPITALAR, RECEBEU O DIAGNÓSTICO DE..."
DESCREVA AS HIPÓTESES DIAGNÓSTICAS, SUPORTE CLÍNICO INSTITUÍDO (ANALGESIA, PROFILAXIAS TEV/LAMG, ANTIBIOTICOTERAPIA SE HOUVER, ATUALIZAÇÃO VACINAL, ACOMPANHAMENTO PELA CIRURGIA PLÁSTICA/ESPECIALIDADES E EQUIPE MULTIPROFISSIONAL). LISTE DE FORMA CORRIDA TODOS OS PROCEDIMENTOS CIRÚRGICOS JÁ REALIZADOS COM SUAS RESPECTIVAS DATAS E INFORME SE HÁ NOVO PROCEDIMENTO CIRÚRGICO JÁ PROGRAMADO E SUA DATA.

PARÁGRAFO 3 (QUADRO CLÍNICO ATUAL):
INICIE COM: "ATUALMENTE, O PACIENTE ENCONTRA-SE EM LEITO DE ENFERMARIA..."
DESCREVA ESTADO GERAL, NÍVEL DE CONSCIÊNCIA, PADRÃO RESPIRATÓRIO E HEMODINÂMICO, INTERCORRÊNCIAS OU AJUSTES MEDICAMENTOSOS RECENTES, ACEITAÇÃO DE DIETA, ELIMINAÇÕES FISIOLÓGICAS, ESTADO DE DEAMBULAÇÃO, CURATIVOS E VIGILÂNCIA CLÍNICA.

PARÁGRAFO 4 (CONCLUSÃO PERICIAL - SEM PREVISÃO DE ALTA):
FINALIZE EXATAMENTE COM ESTE PADRÃO: "DIANTE DO EXPOSTO, ATESTA-SE QUE O PACIENTE [NOME COMPLETO] ENCONTRA-SE TOTAL E TEMPORARIAMENTE INCAPAZ PARA O EXERCÍCIO DE SUA ATIVIDADE LABORAL HABITUAL E PARA QUALQUER ATIVIDADE DE TRABALHO, PERMANECENDO EM REGIME DE INTERNAÇÃO HOSPITALAR POR TEMPO INDETERMINADO PARA CONTINUIDADE DO TRATAMENTO CIRÚRGICO REPARADOR, CICATRIZAÇÃO DAS LESÕES E REABIL
