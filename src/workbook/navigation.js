import { S } from './theme.js';
import { accountList, inputRow, weekInputStart } from './model.js';
import { renderData } from './sheets/data.js';

export function createNavigation({spread,sheets,state,onChange}){
  const capture=()=>{const sheet=spread.getActiveSheet();return{name:sheet.name(),row:sheet.getActiveRowIndex(),col:sheet.getActiveColumnIndex()};};
  const go=(name,{row=0,col=0,remember=false}={})=>{
    if(!spread.getActiveSheet().endEdit())return;
    if(remember)state.returnTo=capture();
    if(name==='Model')sheets.Model.visible(true);
    spread.setActiveSheet(name);
    const sheet=sheets[name];
    sheet.setSelection(row,col,1,1);
    sheet.showCell(row===0?sheet.frozenRowCount():row,col,row===0?S.VerticalPosition.top:S.VerticalPosition.nearest,S.HorizontalPosition.nearest);
    spread.focus();
    onChange();
  };
  const selected=()=>{const s=spread.getActiveSheet();return s._rows?.get(s.getActiveRowIndex());};
  const edit=()=>{
    const item=selected();
    if(item?.week!==undefined){go('Assumptions',{row:weekInputStart+item.week,col:3,remember:true});return;}
    if(item?.accountId==='modeled-cogs'){go('Assumptions',{row:7,col:3,remember:true});return;}
    const account=accountList.find(a=>a.id===item?.accountId)||accountList.find(a=>a.group===item?.group)||accountList[0];
    go('Assumptions',{row:inputRow(account.id),col:state.month+1,remember:true});
  };
  const details=()=>{
    const item=selected();
    if(!item){go('Variance Analysis',{remember:true});return;}
    if(item.accountId==='modeled-cogs'||item.week!==undefined){edit();return;}
    const filter={section:'transactions',period:`2026-${String(state.month).padStart(2,'0')}`,accountId:item.accountId,group:item.group,label:item.label};
    renderData(sheets.Data,filter);
    go('Data',{row:6,col:3,remember:true});
  };
  const back=()=>{if(state.returnTo){const target=state.returnTo;state.returnTo=null;go(target.name,target);}};
  return{go,selected,edit,details,back};
}
