import './styles.css';
import { createWorkbook, sheetNames } from './workbook/createWorkbook.js';
import { createNavigation } from './workbook/navigation.js';
import { S, column } from './workbook/theme.js';
import { data } from './workbook/model.js';
import { renderData, validation } from './workbook/sheets/data.js';

const icons={grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',brief:'<path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4"/>',bars:'<path d="M5 20V10M12 20V4M19 20v-7M3 20h19"/>',cash:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18M16 14h2"/>',variance:'<path d="M4 18V8m5 10v-5m6 5V4m5 14v-8M2 21h21"/>',sliders:'<path d="M5 3v8m0 4v6M12 3v3m0 4v11M19 3v12m0 4v2M2 11h6m1-5h6m1 9h6"/>',data:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',back:'<path d="M19 12H5m5-5-5 5 5 5"/>',reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',code:'<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-4 19"/>',leaf:'<path d="M5 19C1 8 12 3 21 3c0 11-4 18-12 16M5 21 16 9"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const labels=['Overview','Brief','Economics','Cash flow','Variance','Plan','Source data'];
const names=['grid','brief','bars','cash','variance','sliders','data'];
document.querySelector('#app').innerHTML=`
  <aside class="rail" aria-label="Workbook navigation">
    <div class="brand-mark" aria-label="Northline">${icon('leaf')}</div>
    <nav>${sheetNames.slice(0,7).map((name,i)=>`<button class="rail-item ${i===0?'active':''}" data-sheet="${name}" aria-label="${name}" title="${name}">${icon(names[i])}<span>${labels[i]}</span></button>`).join('')}</nav>
    <div class="rail-footer"><span class="avatar">NL</span></div>
  </aside>
  <main class="workspace">
    <header class="app-header"><div class="identity"><span class="wordmark">northline<span class="brand-dot">.</span></span><span class="divider"></span><span class="workspace-name">Finance workspace</span></div><div class="header-right"><span class="sample-badge"><i></i> Demo workbook</span><button id="help" class="icon-button" aria-label="About this workbook">?</button></div></header>
    <section class="page-heading"><div><div class="breadcrumb">Northline Landscaping <span>/</span> Financial planning & analysis</div><h1 id="view-title">Overview</h1></div><div class="heading-actions"><button id="inspect" class="button subtle">${icon('code')}Inspect model</button><button id="reset" class="button">${icon('reset')}Reset demo</button></div></section>
    <section class="toolbar" aria-label="Workbook controls"><div class="select-group"><label for="period">Period</label><select id="period"><option value="9">September 2026</option><option value="8">August 2026</option></select></div><div class="select-group"><label for="comparator">Compare to</label><select id="comparator"><option value="0">Plan</option><option value="1">Prior month</option><option value="2">Illustrative PY</option></select></div><span class="toolbar-divider"></span><button id="back" class="button subtle" hidden>${icon('back')}Return to analysis</button><div class="toolbar-spacer"></div><button id="details" class="button">View details${icon('arrow')}</button><button id="edit" class="button primary">${icon('sliders')}Edit assumptions</button></section>
    <section class="data-tools" id="data-tools" hidden><label for="data-section">Explore</label><select id="data-section"><option value="transactions">Transactions</option><option value="accounts">Account mapping</option><option value="openItems">Open receivables & payables</option><option value="snapshots">Source snapshots</option><option value="coverage">Data coverage</option><option value="validation">Source notes & exclusions</option></select><input id="data-search" type="search" placeholder="Search accounts, customers, documents…" aria-label="Search source transactions"/><button id="clear-filter" class="button subtle">Show all records</button><span id="data-scope"></span></section>
    <section class="workbook-shell"><div class="cell-bar"><span id="cell-address">B3</span><span class="formula-symbol">ƒx</span><output id="cell-formula" aria-label="Selected cell value or formula">Select a cell to inspect its formula</output><span id="selection-kind">Read-only</span></div><div id="spread" role="region" aria-label="Interactive financial planning workbook"><div class="loading"><span class="loader"></span>Preparing your financial workspace…</div></div></section>
    <footer class="statusbar"><span class="status"><i></i><span id="status-text">Workbook ready</span></span><span class="data-caption">Demo · dates rebased to 2026 · plan and forecast illustrative</span><label class="zoom-control">Zoom <select id="zoom"><option value="fit">Fit width</option><option value="0.8">80%</option><option value="1">100%</option><option value="1.2">120%</option></select></label></footer>
  </main>
  <div id="toast" role="status" aria-live="polite"></div>
  <dialog id="about"><button id="close-about" class="close-button" aria-label="Close">×</button><span class="dialog-eyebrow">NORTHLINE / DEMO WORKBOOK</span><h2>A working model.<br>A clearer conversation.</h2><p>Explore sample QuickBooks activity, compare it to an illustrative plan, and see your assumptions flow through live spreadsheet formulas.</p><div class="about-grid"><div><strong>116</strong><span>mapped activity lines</span></div><div><strong>13</strong><span>weeks of cash planning</span></div><div><strong>8</strong><span>connected worksheets</span></div></div><h3>Start with a question</h3><ol><li>Select an account in Variance Analysis and open its details.</li><li>Edit a green planning cell, then return to see the result.</li><li>Change collection timing to explore the cash low point.</li></ol><p class="about-note">Dates are rebased to 2026. The source contains partial activity and independently dated snapshots. One invoice is missing its sales detail. See Source data → Source notes & exclusions for the full context.</p><p class="license-note">${import.meta.env.VITE_SPREADJS_LICENSE_KEY?'SpreadJS runtime license configured.':'SpreadJS runs in evaluation mode. Configure VITE_SPREADJS_LICENSE_KEY with your runtime or trial license to remove evaluation notices.'}</p><button id="about-start" class="button primary">Explore the workbook ${icon('arrow')}</button></dialog>
`;
const state={month:9,comparator:0,returnTo:null,dirty:false,zoom:'fit'};
const $=selector=>document.querySelector(selector);
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
const host=$('#spread');
host.innerHTML='';
try{
  const {spread,sheets}=createWorkbook(host);
  sheets.Model.visible(false);
  let syncing=false;
  const navigation=createNavigation({spread,sheets,state,onChange:refreshChrome});
  function fit(){
    const sheet=spread.getActiveSheet(),technical=['Assumptions','Data','Model'].includes(sheet.name());
    const width=sheet.name()==='Variance Analysis'?1228:1140;
    sheet.zoom(state.zoom==='fit'?(technical?1:Math.max(0.8,Math.min(1.05,(host.clientWidth-26)/width))):Number(state.zoom));
    spread.refresh();
  }
  function selection(){
    const sheet=spread.getActiveSheet(),r=sheet.getActiveRowIndex(),c=sheet.getActiveColumnIndex();
    const formula=sheet.getFormula(r,c),value=sheet.getValue(r,c);
    $('#cell-address').textContent=`${column(c)}${r+1}`;
    $('#cell-formula').textContent=formula?`=${formula}`:value===null||value===undefined?'Select a cell to inspect its value or formula':String(value);
    $('#selection-kind').textContent=sheet.getCell(r,c).locked()===false?'Editable input':formula?'Formula':'Read-only';
    $('#selection-kind').classList.toggle('editable',sheet.getCell(r,c).locked()===false);
    const item=navigation.selected();
    $('#details').disabled=['Assumptions','Data','Model'].includes(sheet.name())||!item&&sheet.name()!=='Dashboard'&&sheet.name()!=='Executive Summary';
    $('#edit').disabled=['Assumptions','Model'].includes(sheet.name());
    $('#details').title=item?`View ${item.label}`:'Open variance analysis';
  }
  function refreshChrome(){
    const name=spread.getActiveSheet().name(),index=sheetNames.indexOf(name);
    $('#view-title').textContent=name==='Dashboard'?'Business overview':name;
    for(const button of document.querySelectorAll('[data-sheet]')){button.classList.toggle('active',button.dataset.sheet===name);button.setAttribute('aria-current',button.dataset.sheet===name?'page':'false');}
    $('#back').hidden=!state.returnTo;
    $('#data-tools').hidden=name!=='Data';
    if(name==='Data'){
      const f=sheets.Data._filter;$('#data-section').value=f.section;$('#data-search').hidden=f.section!=='transactions';$('#data-scope').textContent=[f.label,f.period].filter(Boolean).join(' · ');$('#data-search').value=f.query||'';
    }
    if(name!=='Model'&&sheets.Model.visible())sheets.Model.visible(false);
    fit();selection();
  }
  function updatePeriod(){
    sheets.Model.setValue(2,1,state.month);sheets.Model.setValue(3,1,state.comparator);
    const periodLabel=new Date(2026,state.month-1,1).toLocaleString('en-US',{month:'long',year:'numeric'});
    sheets.Dashboard.setValue(4,1,`${periodLabel} · available sample activity · USD`);
    sheets['Executive Summary'].setValue(4,1,`${periodLabel} · prepared October 14, 2026 · editable analyst notes`);
    sheets['Variance Analysis'].setValue(4,1,`${periodLabel} vs ${$('#comparator').selectedOptions[0].text} · MTD and available YTD activity · green = favorable`);
    if(sheets.Data._filter?.period)renderData(sheets.Data,{...sheets.Data._filter,period:`2026-${String(state.month).padStart(2,'0')}`});
    for(const [name,chartName]of [['Dashboard','Revenue trend'],['Executive Summary','Executive revenue']]){
      const chart=sheets[name].charts.get(chartName),series=chart.series().get(0);
      series.xValues=`Model!A165:A${160+state.month}`;series.yValues=`Model!B165:B${160+state.month}`;chart.series().set(0,series);
    }
    spread.repaint();selection();
  }
  function markEdited(){state.dirty=true;$('#status-text').textContent='Recalculated · changes kept in this session';selection();}
  for(const sheet of Object.values(sheets)){
    sheet.bind(S.Events.EditEnding,(_,args)=>{
      if(syncing||args.committed===false)return;
      const spec=sheet._inputs?.get(`${args.row}:${args.col}`);
      if(!spec)return;
      const raw=String(args.editingText).trim();
      const value=Number(raw.replace(/[$,%×,\s]/g,''))/(raw.includes('%')?100:1);
      if(!raw||!Number.isFinite(value)||value<spec.min||value>spec.max||spec.integer&&!Number.isInteger(value)||raw.startsWith('=')){
        args.cancel=true;toast(`Enter ${spec.integer?'a whole number':'a number'} between ${spec.min} and ${spec.max}.`);
      }
    });
    sheet.bind(S.Events.ValueChanged,(_,args)=>{
      if(syncing)return;
      const spec=sheet._inputs?.get(`${args.row}:${args.col}`);
      if(spec){
        const value=sheet.getValue(args.row,args.col);
        if(typeof value!=='number'||!Number.isFinite(value)||value<spec.min||value>spec.max||spec.integer&&!Number.isInteger(value)){
          syncing=true;sheet.setValue(args.row,args.col,args.oldValue??spec.value);syncing=false;toast('That input is outside the allowed range.');return;
        }
      }
      if(spec||sheet._notes?.has(`${args.row}:${args.col}`))markEdited();
    });
  }
  spread.bind(S.Events.SelectionChanged,selection);
  spread.bind(S.Events.ActiveSheetChanged,refreshChrome);
  for(const button of document.querySelectorAll('[data-sheet]'))button.addEventListener('click',()=>navigation.go(button.dataset.sheet));
  $('#details').addEventListener('click',navigation.details);
  $('#edit').addEventListener('click',navigation.edit);
  $('#back').addEventListener('click',navigation.back);
  $('#inspect').addEventListener('click',()=>navigation.go('Model',{row:8,col:2,remember:true}));
  $('#period').addEventListener('change',()=>{if(!spread.getActiveSheet().endEdit()){$('#period').value=state.month;return;}state.month=Number($('#period').value);updatePeriod();refreshChrome();});
  $('#comparator').addEventListener('change',()=>{if(!spread.getActiveSheet().endEdit()){$('#comparator').value=state.comparator;return;}state.comparator=Number($('#comparator').value);updatePeriod();refreshChrome();});
  $('#zoom').addEventListener('change',()=>{state.zoom=$('#zoom').value;fit();});
  $('#data-section').addEventListener('change',()=>{renderData(sheets.Data,{section:$('#data-section').value});sheets.Data.setSelection(6,0,1,1);sheets.Data.showCell(0,0,S.VerticalPosition.top,S.HorizontalPosition.left);refreshChrome();});
  $('#data-search').addEventListener('input',()=>{renderData(sheets.Data,{...sheets.Data._filter,query:$('#data-search').value});});
  $('#clear-filter').addEventListener('click',()=>{renderData(sheets.Data,{section:$('#data-section').value});refreshChrome();});
  $('#reset').addEventListener('click',()=>{
    syncing=true;spread.getActiveSheet().endEdit(true);spread.suspendPaint();
    for(const sheet of Object.values(sheets)){
      for(const [key,spec]of sheet._inputs||[]){const[r,c]=key.split(':').map(Number);sheet.setValue(r,c,spec.value);}
      for(const [key,value]of sheet._notes||[]){const[r,c]=key.split(':').map(Number);sheet.setValue(r,c,value);}
      sheet.rowOutlines.expand(0,true);
    }
    state.month=9;state.comparator=0;state.returnTo=null;state.dirty=false;state.zoom='fit';$('#period').value='9';$('#comparator').value='0';$('#zoom').value='fit';
    renderData(sheets.Data,{section:'transactions'});updatePeriod();spread.resumePaint();syncing=false;
    navigation.go('Dashboard');sheets.Dashboard.showCell(0,0,S.VerticalPosition.top,S.HorizontalPosition.left);$('#status-text').textContent='Workbook ready';toast('Demo restored to its original assumptions.');
  });
  $('#help').addEventListener('click',()=>$('#about').showModal());
  $('#close-about').addEventListener('click',()=>$('#about').close());
  $('#about-start').addEventListener('click',()=>$('#about').close());
  $('#about').addEventListener('click',e=>{if(e.target===$('#about'))$('#about').close();});
  new ResizeObserver(()=>requestAnimationFrame(fit)).observe(host);
  window.northline={spread,sheets,state,navigation,data,validation};
  refreshChrome();
}catch(error){
  host.innerHTML='<div class="load-error"><h2>The workbook could not load.</h2><p id="load-error-message"></p><button class="button primary" onclick="location.reload()">Reload workbook</button></div>';
  $('#load-error-message').textContent=error.message;console.error(error);
}
