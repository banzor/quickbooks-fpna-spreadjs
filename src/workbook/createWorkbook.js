import '@mescius/spread-sheets/styles/gc.spread.sheets.excel2013white.css';
import '@mescius/spread-sheets-shapes';
import '@mescius/spread-sheets-charts';
import '@mescius/spread-sheets-sparklines';
import { GC, S } from './theme.js';
import { buildModel } from './model.js';
import { buildAssumptions } from './sheets/assumptions.js';
import { buildDashboard } from './sheets/dashboard.js';
import { buildExecutiveSummary } from './sheets/executiveSummary.js';
import { buildMonthlyEconomics } from './sheets/monthlyEconomics.js';
import { buildCashWorkingCapital } from './sheets/cashWorkingCapital.js';
import { buildVarianceAnalysis } from './sheets/varianceAnalysis.js';
import { buildData } from './sheets/data.js';

export const sheetNames=['Dashboard','Executive Summary','Monthly Economics','Cash & Working Capital','Variance Analysis','Assumptions','Data','Model'];
export function createWorkbook(element){
  if(import.meta.env.VITE_SPREADJS_LICENSE_KEY)GC.Spread.Sheets.LicenseKey=import.meta.env.VITE_SPREADJS_LICENSE_KEY;
  const spread=new S.Workbook(element,{sheetCount:0,tabStripVisible:true,tabStripRatio:0.92,tabEditable:false,newTabVisible:false,allowSheetReorder:false,allowContextMenu:false,allowUserDragDrop:false,allowUserDragFill:false,allowUndo:true,highlightInvalidData:true,scrollbarMaxAlign:true,scrollbarShowMax:true});
  spread.suspendPaint();
  spread.suspendCalcService();
  const sheets=Object.fromEntries(sheetNames.map((name,index)=>{const sheet=new S.Worksheet(name);spread.addSheet(index,sheet);return[name,sheet];}));
  buildAssumptions(sheets.Assumptions);
  buildModel(sheets.Model);
  buildExecutiveSummary(sheets['Executive Summary']);
  buildDashboard(sheets.Dashboard);
  buildMonthlyEconomics(sheets['Monthly Economics']);
  buildCashWorkingCapital(sheets['Cash & Working Capital']);
  buildVarianceAnalysis(sheets['Variance Analysis']);
  buildData(sheets.Data);
  spread.resumeCalcService(true);
  spread.resumePaint();
  spread.setActiveSheet('Dashboard');
  return{spread,sheets};
}
