import { base, heading, text, card, section, chart, favorable, sparkVariance, colors, money, percent, delta } from '../theme.js';
import { data, metrics, mref } from '../model.js';

export function pnlTable(sheet,row){
  const columns=[[1,7,'P&L line'],[8,4,'Actual'],[12,4,'Comparator'],[16,4,'Δ amount'],[20,3,'Δ %'],[23,3,'Impact']];
  for(const [c,w,label] of columns)text(sheet,row,c,1,w,label,{font:'bold 10px Arial',foreColor:colors.muted,backColor:colors.pale});
  metrics.slice(0,5).forEach((m,i)=>{
    const r=row+1+i;
    const bold=['gross','operating'].includes(m.key);
    const props={font:`${bold?'bold ':''}12px Arial`,backColor:bold?'#f0f6f7':'#ffffff'};
    text(sheet,r,1,1,7,m.label,props);
    for(const [c,w,mc,format] of [[8,4,2,money],[12,4,6,money],[16,4,7,delta],[20,3,8,percent]])text(sheet,r,c,1,w,`=${mref(m.key,mc)}`,{...props,formatter:format,hAlign:2});
    favorable(sheet,r,16,1,7,m.expense);
    sparkVariance(sheet,r,23,3,mref(m.key,7),'MAX(1,ABS(Model!H9),ABS(Model!H10),ABS(Model!H12))',m.expense);
    sheet._rows.set(r,{group:m.key,label:m.label});
  });
}
export function buildDashboard(sheet){
  base(sheet,{rows:59});
  heading(sheet,'A clearer view of your business.','September 2026 · available sample activity · USD','NORTHLINE LANDSCAPING / MONTHLY OVERVIEW');
  text(sheet,6,1,2,25,"='Executive Summary'!B7",{wordWrap:true,backColor:'#eaf5f2',foreColor:'#32635c',font:'13px Arial'});
  const cards=[['Revenue','revenue',1,'B'],['Gross profit','gross',6,'D'],['Operating expenses','opex',11,'E'],['Operating result','operating',16,'F']];
  for(const [label,key,c,trend] of cards){
    card(sheet,9,c,4,label,mref(key),`=IF(ISNUMBER(${mref(key,8)}),TEXT(${mref(key,8)},"+0.0%;-0.0%")&" vs baseline","No comparison")`,`Model!${trend}165:INDEX(Model!${trend}165:${trend}169,Model!B3-4,1)`);
  }
  card(sheet,9,21,5,'Cash snapshot',`${data.snapshots.cashCents/100}`,'As of Sep 30 · rebased');
  chart(sheet,'Revenue trend',16,1,11,12,'columnClustered','Model!A165:A169','Model!B165:B169','Revenue · available months');
  chart(sheet,'Cash outlook',16,14,11,12,'line','Model!A121:A133','Model!J121:J133','Cash · 13-week scenario');
  section(sheet,28,'Performance against your baseline','Select a row, then View details. Expense increases are unfavorable.');
  pnlTable(sheet,30);
  section(sheet,38,'What moved operating result','Ranked by absolute impact on profit · current comparison');
  for(let i=0;i<3;i++){
    text(sheet,40+i,1,1,10,`=Model!F${191+i}`,{font:'bold 12px Arial'});
    sparkVariance(sheet,40+i,11,10,`Model!G${191+i}`,'MAX(1,MAX(Model!D191:D193))');
    text(sheet,40+i,21,1,5,`=Model!G${191+i}`,{formatter:delta,hAlign:2});favorable(sheet,40+i,21,1,5);
  }
  section(sheet,45,'The year so far','YTD includes available sample activity only; missing months are not verified zeros.');
  for(const [i,key] of ['revenue','directCosts','opex','operating'].entries())card(sheet,47,1+i*6,5,`YTD ${metrics.find(m=>m.key===key).label}`,mref(key,9),'Through selected month');
  text(sheet,54,1,2,25,'EXPLORE THE WORKBOOK   →   Compare actuals and plan in Variance Analysis, trace an account to Data, or change a green cell in Assumptions.',{wordWrap:true,backColor:colors.navy,foreColor:'#ffffff',font:'12px Arial'});
}
