import { base, heading, card, section, chart, note, text, colors } from '../theme.js';
import { assumptions, mref, data } from '../model.js';
import { pnlTable } from './dashboard.js';

export function buildExecutiveSummary(sheet){
  base(sheet,{rows:54});
  heading(sheet,'The management brief.','September 2026 · prepared October 14, 2026 · editable analyst notes','01 / EXECUTIVE SUMMARY');
  note(sheet,6,1,3,25,assumptions.notes.lead);
  [['Revenue',mref('revenue')],['Gross profit',mref('gross')],['Operating result',mref('operating')],['Cash snapshot',String(data.snapshots.cashCents/100)]].forEach(([label,formula],i)=>card(sheet,11,1+i*6,5,label,formula,i===3?'Sep 30 · rebased snapshot':'Selected month'));
  chart(sheet,'Executive revenue',18,1,10,12,'columnClustered','Model!A165:A169','Model!B165:B169','Revenue · sample activity');
  chart(sheet,'Executive cash',18,14,10,12,'line','Model!A121:A133','Model!J121:J133','Cash position · scenario');
  section(sheet,29,'The month in numbers','The comparator follows the toolbar selection across every view.');
  pnlTable(sheet,31);
  section(sheet,39,'What determined the result','Editable commentary · double-click the green note to make it your own.');
  note(sheet,41,1,3,25,assumptions.notes.result);
  text(sheet,46,1,1,25,'YTD SNAPSHOT · AVAILABLE SAMPLE ACTIVITY',{font:'bold 11px Arial',foreColor:colors.teal});
  [['revenue','Revenue'],['directCosts','Direct costs'],['opex','Operating expenses'],['operating','Operating result']].forEach(([key,label],i)=>card(sheet,48,1+i*6,5,label,mref(key,9)));
}
