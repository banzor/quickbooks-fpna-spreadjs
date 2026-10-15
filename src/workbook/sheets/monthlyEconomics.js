import { base, heading, card, text, section, colors, money, percent, favorable, S } from '../theme.js';
import { accountList, accountRow, groupNames, groups, mref } from '../model.js';

export function buildMonthlyEconomics(sheet){
  base(sheet,{rows:80});
  heading(sheet,'From revenue to result.','Select an account and View details to trace its activity. Use the outline controls to expand or collapse categories.','02 / MONTHLY ECONOMICS');
  [['Revenue','revenue'],['Direct costs','directCosts'],['Gross profit','gross'],['Operating costs','opex'],['Operating result','operating']].forEach(([label,key],i)=>card(sheet,6,1+i*5,i===4?5:4,label,mref(key),key==='directCosts'?'Includes modeled COGS':'Selected month'));
  text(sheet,12,1,1,25,'=IF(ISNUMBER(Model!C17),"Gross margin  "&TEXT(Model!C17,"0.0%")&"   ·   "&TEXT(Model!I17,"+0.0;-0.0")&" pp vs selected baseline","Gross margin unavailable")',{foreColor:colors.teal,font:'bold 12px Arial'});
  section(sheet,13,'Where the money goes','Composition by ledger account · plans are illustrative and editable.');
  [[1,12,'Account'],[13,4,'Actual'],[17,4,'Plan'],[21,3,'Share'],[24,2,'Δ']].forEach(([c,w,t])=>text(sheet,15,c,1,w,t,{backColor:colors.navy,foreColor:'#ffffff',font:'bold 11px Arial'}));
  sheet.rowOutlines.direction(S.Outlines.OutlineDirection.backward);
  let row=16;
  for(const group of groups){
    const members=accountList.filter(a=>a.group===group);
    const start=row;
    text(sheet,row,1,1,12,groupNames[group],{font:'bold 13px Arial',backColor:colors.pale});
    text(sheet,row,13,1,4,`=${mref(group)}`,{formatter:money,hAlign:2,backColor:colors.pale,font:'bold 12px Arial'});
    text(sheet,row,17,1,4,`=${mref(group,3)}`,{formatter:money,hAlign:2,backColor:colors.pale});
    sheet._rows.set(row,{group,label:groupNames[group]});row++;
    for(const a of members){
      const n=accountRow(a.id)+1;
      text(sheet,row,1,1,12,`   ${a.name}`,{foreColor:a.origin==='modeled'?colors.teal:colors.ink});
      text(sheet,row,13,1,4,`=Model!C${n}`,{formatter:money,hAlign:2});
      text(sheet,row,17,1,4,`=Model!D${n}`,{formatter:money,hAlign:2});
      text(sheet,row,21,1,3,`=IF(${mref(group)}=0,"",Model!C${n}/${mref(group)})`,{formatter:percent,hAlign:2});
      text(sheet,row,24,1,2,`=Model!C${n}-Model!D${n}`,{formatter:money,hAlign:2});
      favorable(sheet,row,24,1,2,['directCosts','opex','otherExpenses'].includes(group));
      sheet._rows.set(row,{accountId:a.id,group,label:a.fullName});row++;
    }
    if(members.length)sheet.rowOutlines.group(start+1,members.length);
    row++;
  }
  sheet.frozenRowCount(5);
  sheet.setRowCount(row+3);
}
