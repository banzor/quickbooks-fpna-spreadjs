import { base, text, input, colors, precise, percent } from '../theme.js';
import { accountList, inputRow, assumptions, data, groupNames, weekInputStart, sourceAt } from '../model.js';

export function buildAssumptions(sheet) {
  base(sheet,{technical:true,rows:90,cols:15});
  sheet.setColumnWidth(0,300); sheet.setColumnWidth(1,130);
  text(sheet,0,0,2,14,'Your planning workbench',{font:'bold 25px Arial'});
  text(sheet,2,0,1,14,'Green cells are editable. Changes flow through the workbook immediately. Amounts are USD; dates are rebased sample data.',{foreColor:colors.muted});
  text(sheet,4,0,1,4,'SCENARIO DRIVERS',{font:'bold 11px Arial',foreColor:colors.teal});
  const drivers=[['Revenue plan / new receipts multiplier',assumptions.revenueFactor,'0.00"×"',0,5],['Cost plan / new payments multiplier',assumptions.costFactor,'0.00"×"',0,5],['Modeled actual COGS / revenue',assumptions.modeledCogsRate,percent,0,1],['Modeled plan COGS / revenue',assumptions.planCogsRate,percent,0,1]];
  drivers.forEach(([label,value,format,min,max],i)=>{text(sheet,5+i,0,1,3,label);input(sheet,5+i,3,value,format,min,max);});
  text(sheet,4,5,1,6,'CASH TIMING · SEPTEMBER 30 SNAPSHOT',{font:'bold 11px Arial',foreColor:colors.teal});
  text(sheet,5,5,1,2,'Opening cash');input(sheet,5,7,assumptions.openingCashCents/100);
  text(sheet,6,5,1,2,'Collection delay (weeks)');input(sheet,6,7,0,'0',0,9,true);
  text(sheet,7,5,1,2,'Payment delay (weeks)');input(sheet,7,7,0,'0',0,9,true);
  text(sheet,10,0,2,14,'Modeled COGS is a separate estimate, not an inventory valuation. Revenue/cost multipliers affect plans and new forecast activity; source revenue and expenses stay unchanged.',{wordWrap:true,backColor:colors.pale,foreColor:colors.muted});
  text(sheet,13,0,1,14,'MONTHLY PLAN · FIXED SEED, EDITABLE BY ACCOUNT',{font:'bold 12px Arial'});
  const months=Array.from({length:12},(_,i)=>new Date(2026,i,1).toLocaleString('en-US',{month:'short'}));
  sheet.setArray(15,0,[['Account','Category',...months]]);
  sheet.getRange(15,0,1,14).backColor(colors.navy).foreColor('#ffffff');
  for(const account of accountList){
    const r=inputRow(account.id), budget=assumptions.budgets.find(b=>b.accountId===account.id);
    sheet.setValue(r,0,account.fullName);sheet.setValue(r,1,groupNames[account.group]);
    for(let month=1;month<=12;month++){
      if(account.id==='modeled-cogs'){
        sheet.setFormula(r,month+1,`ROUND(${accountList.filter(a=>a.group==='revenue').reduce((n,a)=>n+sourceAt(a.id,month),0)}*$D$9*$D$7,2)`);
        sheet.getCell(r,month+1).formatter(precise).backColor(colors.pale);
      }else if(data.coverage[month-1].lineCount){input(sheet,r,month+1,budget.monthlyCents[month-1]/100);}
      else sheet.setValue(r,month+1,'—');
    }
  }
  text(sheet,50,0,1,14,'13-WEEK CASH INPUTS · OCTOBER 1 TO DECEMBER 30, 2026',{font:'bold 12px Arial'});
  text(sheet,51,0,1,14,'New activity below excludes opening AR/AP, which are collected/paid separately over four weeks after the timing delay.',{foreColor:colors.muted});
  sheet.setArray(53,0,[['Week starting','Week','New receipts','New payments','Basis']]);
  sheet.getRange(53,0,1,5).backColor(colors.navy).foreColor('#ffffff');
  assumptions.weeks.forEach((week,i)=>{
    const r=weekInputStart+i;
    sheet.setValue(r,0,week.startDate);sheet.setValue(r,1,week.week);
    input(sheet,r,2,week.newReceiptsCents/100,precise,0);input(sheet,r,3,week.newPaymentsCents/100,precise,0);
    text(sheet,r,4,1,6,'Illustrative new activity; scenario multipliers apply');
    sheet._rows.set(r,{week:i,label:`Week ${i+1}`});
  });
  text(sheet,70,0,1,14,'COMMENTARY · EDIT IN THE MANAGEMENT VIEWS',{font:'bold 12px Arial'});
  text(sheet,72,0,2,14,"='Executive Summary'!B7",{wordWrap:true,backColor:colors.pale});
  text(sheet,75,0,2,14,"='Cash & Working Capital'!B48",{wordWrap:true,backColor:colors.pale});
  sheet.frozenRowCount(3);
  sheet.frozenColumnCount(2);
}
