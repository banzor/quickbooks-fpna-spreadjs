import { base, heading, card, chart, text, colors, money, delta, percent, favorable, sparkVariance, S } from '../theme.js';
import { accountList, accountRow, groupNames, groups, mref, metrics } from '../model.js';

export function buildVarianceAnalysis(sheet){
  base(sheet,{rows:100,cols:28});sheet.setColumnWidth(26,44);sheet.setColumnWidth(27,20);
  heading(sheet,'Understand what changed.','Actual vs selected baseline · MTD and available YTD activity · green = favorable, red = unfavorable','04 / VARIANCE ANALYSIS');
  ['revenue','directCosts','gross','operating'].forEach((key,i)=>card(sheet,6,1+i*6,5,metrics.find(m=>m.key===key).label,mref(key),'Selected month'));
  chart(sheet,'Operating bridge',12,1,8,17,'waterfall','Model!A181:A185','Model!B181:B185','Operating result · comparator to actual');
  text(sheet,12,19,1,8,'READING THE BRIDGE',{font:'bold 11px Arial',foreColor:colors.teal});
  text(sheet,14,19,2,8,'Revenue adds to profit. Direct costs and operating expenses subtract from profit. The final bar reconciles to actual operating result.',{wordWrap:true,font:'12px Arial',foreColor:colors.muted});
  text(sheet,17,19,2,8,'Select an account below, then View details to see its source transactions. Modeled COGS opens its assumption instead.',{wordWrap:true,font:'12px Arial',backColor:colors.pale});
  text(sheet,21,1,1,6,'ACCOUNT COMPARISON',{font:'bold 11px Arial'});
  text(sheet,21,7,1,10,'MONTH TO DATE',{font:'bold 11px Arial',foreColor:colors.teal});
  text(sheet,21,17,1,10,'YEAR TO DATE · AVAILABLE ACTIVITY',{font:'bold 11px Arial',foreColor:colors.teal});
  const headers=[[1,6,'Account'],[7,2,'Actual'],[9,2,'Baseline'],[11,2,'Δ $'],[13,2,'Impact'],[15,2,'Δ %'],[17,2,'Actual'],[19,2,'Baseline'],[21,2,'Δ $'],[23,2,'Impact'],[25,2,'Δ %']];
  headers.forEach(([c,w,label])=>text(sheet,23,c,1,w,label,{font:'bold 10px Arial',backColor:colors.navy,foreColor:'#ffffff',hAlign:c===1?0:2}));
  sheet.rowOutlines.direction(S.Outlines.OutlineDirection.backward);
  let row=24;
  const render=(r,label,modelRow,expense,summary=false)=>{
    const n=modelRow+1, props={font:`${summary?'bold ':''}11px Arial`,backColor:summary?colors.pale:'#ffffff'};
    text(sheet,r,1,1,6,label,props);
    for(const [c,mc,format]of [[7,'C',money],[9,'G',money],[11,'H',delta],[15,'I',percent],[17,'J',money],[19,'N',money],[21,'O',delta],[25,'P',percent]])text(sheet,r,c,1,2,`=Model!${mc}${n}`,{...props,formatter:format,hAlign:2});
    favorable(sheet,r,11,1,2,expense);favorable(sheet,r,15,1,2,expense);favorable(sheet,r,21,1,2,expense);favorable(sheet,r,25,1,2,expense);
    sparkVariance(sheet,r,13,2,`Model!H${n}`,'MAX(1,MAX(Model!H9:H62),-MIN(Model!H9:H62))',expense);
    sparkVariance(sheet,r,23,2,`Model!O${n}`,'MAX(1,MAX(Model!O9:O62),-MIN(Model!O9:O62))',expense);
  };
  for(const group of groups){
    const start=row,members=accountList.filter(a=>a.group===group),expense=['directCosts','opex','otherExpenses'].includes(group);
    render(row,groupNames[group],metrics.find(m=>m.key===group).row,expense,true);sheet._rows.set(row,{group,label:groupNames[group]});row++;
    for(const a of members){render(row,`  ${a.name}`,accountRow(a.id),expense);sheet._rows.set(row,{accountId:a.id,group,label:a.fullName});row++;}
    if(members.length)sheet.rowOutlines.group(start+1,members.length);
  }
  row++;render(row,'OPERATING RESULT',12,false,true);sheet._rows.set(row,{group:'operating',label:'Operating result'});
  text(sheet,row+3,1,2,26,'Prior-month YTD compares cumulative available activity through the previous month. Illustrative PY is generated comparison data. Blank percentages indicate a zero baseline.',{wordWrap:true,font:'11px Arial',foreColor:colors.muted});
  sheet.setRowCount(row+7);
}
