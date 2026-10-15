import { base, text, colors, precise } from '../theme.js';
import { data, groupNames } from '../model.js';
import validation from '../../data/validation-summary.json';

export { validation };
export function buildData(sheet){
  base(sheet,{technical:true,rows:200,cols:17});
  sheet.setColumnWidth(0,135);sheet.setColumnWidth(1,120);sheet.setColumnWidth(2,105);sheet.setColumnWidth(3,250);sheet.setColumnWidth(4,240);
  sheet.frozenRowCount(6);
  sheet.addSpan(0,0,1,12);
  sheet.addSpan(1,0,1,12);
  sheet.addSpan(3,3,1,9);
  sheet.setRowHeight(0,38);
  renderData(sheet,{section:'transactions',period:null});
}
export function renderData(sheet,filter){
  sheet.suspendPaint();
  sheet.clear(0,0,sheet.getRowCount(),sheet.getColumnCount(),3,1);
  sheet._rows.clear();
  sheet._filter=filter;
  const scope=[filter.label,filter.period].filter(Boolean).join(' · ');
  sheet.setValue(0,0,'SOURCE EXPLORER');sheet.getCell(0,0).font('bold 16px Arial');
  sheet.setValue(1,0,scope||'All source records · original and rebased dates');
  let headers,rows;
  if(filter.section==='accounts'){
    headers=['ID','Account','Parent ID','Full account name','Presentation group','Type','Source balance'];
    rows=data.accounts.map(a=>[a.id,a.name,a.parentAccountId,a.fullName,groupNames[a.group]||a.group,a.type,a.balanceCents/100]);
  }else if(filter.section==='openItems'){
    headers=['Kind','Demo date','Due date','Customer / vendor','Aging bucket','Open amount','Days overdue','Source date','Source due date','Source report date','Demo as-of','Source bucket','Source file'];
    rows=data.openItems.filter(i=>i.included).map(i=>[i.kind,i.demoDate,i.demoDueDate,i.party,i.ageBucket,i.amountCents/100,i.daysPastDue,i.sourceDate,i.sourceDueDate,i.sourceReportDate,i.demoAsOf,i.sourceBucket,i.sourceFile]);
  }else if(filter.section==='snapshots'){
    headers=['Metric','Amount','Source as-of','Demo as-of','Origin'];
    rows=[['Cash',data.snapshots.cashCents/100,data.snapshots.sourceDate,data.snapshots.demoDate,data.snapshots.origin],['Receivables',data.snapshots.receivablesCents/100,data.snapshots.sourceDate,data.snapshots.demoDate,data.snapshots.origin],['Payables',data.snapshots.payablesCents/100,data.snapshots.sourceDate,data.snapshots.demoDate,data.snapshots.origin]];
  }else if(filter.section==='coverage'){
    headers=['Month','Coverage','First date','Last date','Line count'];
    rows=data.coverage.map(c=>[c.period,c.status,c.firstDate,c.lastDate,c.lineCount]);
  }else if(filter.section==='validation'){
    headers=['Source / check','Result','Amount / difference','Explanation'];
    rows=[...validation.notes.map((n,i)=>[`Note ${i+1}`,'Source limitation','',n]),...validation.snapshotChecks.map(c=>[`${c.kind} snapshot`,'Reconciled',c.differenceCents/100,'Summary minus included open-item detail']),...validation.documentChecks.filter(c=>c.differenceCents).map(c=>[c.id,'Missing sales detail',c.differenceCents/100,'Subtotal-only invoice; linked statement charge is unavailable']),...validation.unmapped.map(l=>[l.id,'Unmapped',l.amountCents/100,l.description]),...validation.exclusions.map(e=>[e.id,'Excluded',e.amountCents/100,e.reason])];
  }else{
    headers=['Demo date','Source type','Document','Account','Customer / vendor','Amount','P&L included','Category','Description','Original date','Demo due date','Original due date','Source file','Source ID','Line ID','Reason','Linked transactions'];
    const allowed=filter.group==='gross'?['revenue','directCosts']:filter.group==='operating'?['revenue','directCosts','opex']:filter.group?[filter.group]:null;
    const lines=data.lines.filter(l=>(!filter.period||l.period===filter.period)&&(!filter.accountId||l.accountId===filter.accountId)&&(!allowed||allowed.includes(l.reportGroup))&&(!filter.query||`${l.accountName} ${l.party} ${l.description} ${l.documentNumber}`.toLowerCase().includes(filter.query.toLowerCase())));
    rows=lines.map(l=>[l.demoDate,l.sourceType,l.documentNumber,l.accountName,l.party,l.amountCents/100,l.included?'Yes':'No',groupNames[l.reportGroup]||l.reportGroup,l.description,l.sourceDate,l.demoDueDate,l.sourceDueDate,l.sourceFile,l.sourceId,l.sourceLineId,l.reason,JSON.stringify(l.linkedTransactions)]);
    lines.forEach((l,i)=>sheet._rows.set(6+i,{accountId:l.accountId,group:l.reportGroup,label:l.accountName}));
  }
  sheet.setRowCount(Math.max(25,rows.length+9));
  sheet.setValue(3,0,`${rows.length} records`);sheet.setValue(3,3,'Amounts in USD · source data is read-only');
  sheet.setArray(5,0,[headers]);sheet.getRange(5,0,1,headers.length).backColor(colors.navy).foreColor('#ffffff').font('bold 11px Arial');
  if(rows.length)sheet.setArray(6,0,rows);
  for(let i=0;i<rows.length;i++){sheet.getRange(6+i,0,1,headers.length).backColor(i%2?'#ffffff':colors.pale);}
  for(const [i,h]of headers.entries())if(/amount|balance/i.test(h))sheet.getRange(6,i,rows.length||1,1).formatter(precise);
  if(filter.section==='validation'){sheet.setColumnWidth(0,180);sheet.setColumnWidth(1,160);sheet.setColumnWidth(2,150);sheet.setColumnWidth(3,650);sheet.getRange(6,3,rows.length||1,1).wordWrap(true);for(let i=0;i<validation.notes.length;i++)sheet.setRowHeight(6+i,54);}
  else {sheet.setColumnWidth(0,135);sheet.setColumnWidth(1,130);sheet.setColumnWidth(2,110);sheet.setColumnWidth(3,280);for(let r=6;r<sheet.getRowCount();r++)sheet.setRowHeight(r,27);}
  if(!rows.length)sheet.setValue(6,0,'No matching records');
  sheet.resumePaint();
  return rows.length;
}
