import { base, heading, card, text, section, chart, note, favorable, money, colors } from '../theme.js';
import { data, assumptions, cashStart } from '../model.js';

export function buildCashWorkingCapital(sheet){
  base(sheet,{rows:61});
  heading(sheet,'Keep the next 13 weeks in view.','Snapshot: September 30, 2026 · forecast: October 1–December 30 · illustrative cash scenario','03 / CASH & WORKING CAPITAL');
  [['Cash snapshot',String(data.snapshots.cashCents/100)],['Receivables',String(data.snapshots.receivablesCents/100)],['Payables',String(data.snapshots.payablesCents/100)],['Forecast low point','Model!C138']].forEach(([label,formula],i)=>card(sheet,6,1+i*6,5,label,formula,i<3?'Rebased source snapshot':'Across all 13 weeks'));
  text(sheet,12,1,1,8,'=IF(ISNUMBER(Model!C141),"DSO estimate  ·  "&TEXT(Model!C141,"0")&" days","DSO estimate · Not available")',{foreColor:colors.muted});
  text(sheet,12,9,1,8,'=IF(ISNUMBER(Model!C142),"DPO estimate  ·  "&TEXT(Model!C142,"0")&" days","DPO estimate · Not available")',{foreColor:colors.muted});
  text(sheet,12,17,1,9,'=IF(ISNUMBER(Model!C143),"Timing gap  ·  "&TEXT(Model!C143,"0")&" days","Timing gap · Not available")',{foreColor:colors.muted});
  chart(sheet,'Cash detail',14,1,10,25,'line','Model!A121:A133','Model!J121:J133','Ending cash by week');
  section(sheet,25,'The weekly cash walk','Select a week and Edit assumptions. New activity and opening AR/AP are modeled separately.');
  [[1,2,'Week'],[3,5,'Starting'],[8,4,'Opening cash'],[12,4,'Receipts'],[16,4,'Payments'],[20,6,'Ending cash']].forEach(([c,w,t])=>text(sheet,27,c,1,w,t,{font:'bold 10px Arial',backColor:colors.navy,foreColor:'#ffffff'}));
  for(let i=0;i<13;i++){
    const r=28+i,n=cashStart+i+1,backColor=i%2?'#ffffff':colors.pale;
    text(sheet,r,1,1,2,i+1,{backColor});text(sheet,r,3,1,5,assumptions.weeks[i].startDate,{backColor});
    for(const [c,w,mc] of [[8,4,'C'],[12,4,'H'],[16,4,'I'],[20,6,'J']])text(sheet,r,c,1,w,`=Model!${mc}${n}`,{backColor,formatter:money,hAlign:2,font:mc==='J'?'bold 12px Arial':'12px Arial'});
    favorable(sheet,r,20,1,6);sheet._rows.set(r,{week:i,label:`Week ${i+1} · ${assumptions.weeks[i].startDate}`});
  }
  text(sheet,42,1,1,25,'="Low point: "&TEXT(Model!C138,"$#,##0")&" in week "&Model!C139&". Closing cash: "&TEXT(Model!C140,"$#,##0")',{font:'bold 13px Arial',foreColor:colors.teal});
  text(sheet,44,1,2,25,'DSO uses September sample revenue / 30; DPO uses September sample direct costs / 30. These are indicative timing estimates, not a full cash conversion cycle.',{font:'11px Arial',wordWrap:true,foreColor:colors.muted});
  section(sheet,46,'Risks to watch');note(sheet,47,1,3,25,assumptions.notes.cashRisk);
  section(sheet,52,'Decisions & follow-ups');note(sheet,53,1,3,25,assumptions.notes.followUp);
}
