
(function(){
 
  const $ = (id) => document.getElementById(id);
  const formatMoney = (v) => Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});

 
  const valorEl = $('valorVenda');
  const itensEl = $('itens');
  const irpfEl = $('irpf');
  const pisEl = $('pis');
  const cofinsEl = $('cofins');
  const inssEl = $('inss');
  const issEl = $('issqn');

  const gerarBtn = $('gerarBtn');
  const limparBtn = $('limparBtn');
  const notaContainer = $('notaContainer');
  const notaFiscal = $('notaFiscal');
  const downloadPdfBtn = $('downloadPdfBtn');
  const darkToggle = $('darkModeToggle');

  
  function calcular() {
    const valor = parseFloat(valorEl.value) || 0;
    const irpf = parseFloat(irpfEl.value) || 0;
    const pis = parseFloat(pisEl.value) || 0;
    const cofins = parseFloat(cofinsEl.value) || 0;
    const inss = parseFloat(inssEl.value) || 0;
    const iss = parseFloat(issEl.value) || 0;

    const calcIRPF = valor * (irpf/100);
    const calcPIS = valor * (pis/100);
    const calcCOFINS = valor * (cofins/100);
    const calcINSS = valor * (inss/100);
    const calcISS = valor * (iss/100);

    const totalImpostos = calcIRPF + calcPIS + calcCOFINS + calcINSS + calcISS;
    const valorLiquido = valor - totalImpostos;

    return {
      valor, irpf, pis, cofins, inss, iss,
      calcIRPF, calcPIS, calcCOFINS, calcINSS, calcISS,
      totalImpostos, valorLiquido
    };
  }

  function renderNota(data) {
    notaFiscal.innerHTML = `
      <div class="d-flex justify-content-between">
        <div>
          <h2>NFS-e (Nota Fiscal de Serviço)</h2>
          <div><strong>Emitente:</strong> RaryssonDEV</div>
          <div><strong>Data:</strong> ${new Date().toLocaleString()}</div>
        </div>
        <div class="text-end">
          <div><strong>Valor Bruto:</strong> R$ ${formatMoney(data.valor)}</div>
          <div><strong>Valor Líquido:</strong> <span class="h5">R$ ${formatMoney(data.valorLiquido)}</span></div>
        </div>
      </div>

      <hr>

      <h5>Descrição / Itens</h5>
      <p>${itensEl.value ? itensEl.value : '-'}</p>

      <h5>Detalhamento de impostos</h5>
      <table class="table table-sm table-bordered table-impostos">
        <thead>
          <tr>
            <th>Imposto</th>
            <th>Alíquota</th>
            <th>Valor (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>IRPF</td><td>${data.irpf}%</td><td>R$ ${formatMoney(data.calcIRPF)}</td>
          </tr>
          <tr>
            <td>PIS</td><td>${data.pis}%</td><td>R$ ${formatMoney(data.calcPIS)}</td>
          </tr>
          <tr>
            <td>COFINS</td><td>${data.cofins}%</td><td>R$ ${formatMoney(data.calcCOFINS)}</td>
          </tr>
          <tr>
            <td>INSS</td><td>${data.inss}%</td><td>R$ ${formatMoney(data.calcINSS)}</td>
          </tr>
          <tr>
            <td>ISSQN</td><td>${data.iss}%</td><td>R$ ${formatMoney(data.calcISS)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th colspan="2">Total de Impostos</th>
            <th>R$ ${formatMoney(data.totalImpostos)}</th>
          </tr>
        </tfoot>
      </table>

      <div class="mt-3">
        <button class="btn btn-outline-primary btn-sm" id="copyBtn">Copiar JSON</button>
        <span class="ms-2 text-muted small">JSON gerado contém todos os campos do cálculo.</span>
      </div>
    `;

    notaContainer.style.display = 'block';


    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', () => {
      const payload = {
        emitente: 'RaryssonDEV',
        data: new Date().toISOString(),
        itens: itensEl.value,
        valores: {
          bruto: data.valor,
          liquido: data.valorLiquido,
          totalImpostos: data.totalImpostos
        },
        impostos: {
          irpf: {aliquota: data.irpf, valor: data.calcIRPF},
          pis: {aliquota: data.pis, valor: data.calcPIS},
          cofins: {aliquota: data.cofins, valor: data.calcCOFINS},
          inss: {aliquota: data.inss, valor: data.calcINSS},
          issqn: {aliquota: data.iss, valor: data.calcISS}
        }
      };
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      copyBtn.innerText = 'Copiado!';
      setTimeout(()=> copyBtn.innerText = 'Copiar JSON', 1500);
    });
  }

 
  function updateAndRenderPreview() {
    const data = calcular();
    renderNota(data);
  }

  gerarBtn.addEventListener('click', () => {
    const data = calcular();
    renderNota(data);
  });

 
  ['input','change'].forEach(evt => {
    valorEl.addEventListener(evt, () => {
      const v = parseFloat(valorEl.value) || 0;
      if(v < 0) valorEl.value = 0;
      // only update preview if visible
      if(notaContainer.style.display !== 'none') {
        updateAndRenderPreview();
      }
    });
    document.querySelectorAll('.imposto').forEach(inp => inp.addEventListener(evt, () => {
      if(notaContainer.style.display !== 'none') updateAndRenderPreview();
    }));
    itensEl.addEventListener(evt, () => {
      if(notaContainer.style.display !== 'none') updateAndRenderPreview();
    });
  });

  limparBtn.addEventListener('click', () => {
    valorEl.value = '0.00';
    itensEl.value = '';
    irpfEl.value = '0';
    pisEl.value = '0.65';
    cofinsEl.value = '3.00';
    inssEl.value = '11.00';
    issEl.value = '2.00';
    notaContainer.style.display = 'none';
  });

 
  downloadPdfBtn.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const data = calcular();
  
    renderNota(data);

    const doc = new jsPDF({unit:'pt', format:'a4'});
    const margin = 40;
    const lines = [];
    lines.push('NFS-e — Nota Fiscal de Serviço');
    lines.push('Emitente: RaryssonDEV');
    lines.push('Data: ' + new Date().toLocaleString());
    lines.push('');
    lines.push('Itens / Descrição:');
    lines.push(itensEl.value || '-');
    lines.push('');
    lines.push('Valores:');
    lines.push('Valor Bruto: R$ ' + formatMoney(data.valor));
    lines.push('Total Impostos: R$ ' + formatMoney(data.totalImpostos));
    lines.push('Valor Líquido: R$ ' + formatMoney(data.valorLiquido));
    lines.push('');
    lines.push('Detalhamento de impostos:');
    lines.push('IRPF ('+data.irpf+'%): R$ ' + formatMoney(data.calcIRPF));
    lines.push('PIS ('+data.pis+'%): R$ ' + formatMoney(data.calcPIS));
    lines.push('COFINS ('+data.cofins+'%): R$ ' + formatMoney(data.calcCOFINS));
    lines.push('INSS ('+data.inss+'%): R$ ' + formatMoney(data.calcINSS));
    lines.push('ISSQN ('+data.iss+'%): R$ ' + formatMoney(data.calcISS));

  
    let y = margin;
    const maxWidth = doc.internal.pageSize.getWidth() - margin*2;
    doc.setFontSize(12);
    for(const l of lines){
      const split = doc.splitTextToSize(l, maxWidth);
      for(const s of split){
        doc.text(s, margin, y);
        y += 14;
        if(y > doc.internal.pageSize.getHeight() - margin){
          doc.addPage();
          y = margin;
        }
      }
    }

    const filename = 'NFS-e_' + new Date().toISOString().slice(0,19).replace(/[:T]/g,'-') + '.pdf';
    doc.save(filename);
  });


  function applyTheme(theme){
    if(theme === 'dark'){
      document.documentElement.setAttribute('data-theme','dark');
      darkToggle.checked = true;
    } else {
      document.documentElement.removeAttribute('data-theme');
      darkToggle.checked = false;
    }
  }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');

  darkToggle.addEventListener('change', (e) => {
    applyTheme(e.target.checked ? 'dark' : 'light');
  });


  window.nfse = {calcular, renderNota};

})();
