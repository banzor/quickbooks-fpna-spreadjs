import * as GC from '@mescius/spread-sheets';

export { GC };
export const S = GC.Spread.Sheets;
export const colors = { ink: '#183a4b', muted: '#748590', navy: '#103c50', teal: '#087f83', blue: '#3585b3', green: '#12866a', red: '#cb5265', pale: '#f3f7f8', line: '#e1e9ec', input: '#e6f5ef', white: '#ffffff' };
export const money = '$#,##0;($#,##0);"—"';
export const precise = '$#,##0.00;($#,##0.00);"—"';
export const percent = '0.0%;(0.0%);"—"';
export const delta = '+$#,##0;-$#,##0;"—"';
export const column = n => { let s = ''; for (n++; n; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
export const ref = (sheet, row, col) => `'${sheet}'!${column(col)}${row + 1}`;
export function style(sheet, row, col, rows, cols, props) {
  const value = Object.assign(new S.Style(), props);
  sheet.getRange(row, col, rows, cols).setStyle(value);
}
export function text(sheet, row, col, rows, cols, value, props = {}) {
  if (rows > 1 || cols > 1) sheet.addSpan(row, col, rows, cols);
  style(sheet, row, col, rows, cols, { font: '12px Arial', foreColor: colors.ink, vAlign: S.VerticalAlign.center, cellPadding: '0 10', ...props });
  if (typeof value === 'string' && value.startsWith('=')) sheet.setFormula(row, col, value.slice(1)); else sheet.setValue(row, col, value);
}
export function base(sheet, { rows = 80, cols = 27, technical = false } = {}) {
  sheet.setRowCount(rows);
  sheet.setColumnCount(cols);
  sheet.setDefaultStyle(Object.assign(new S.Style(), { font: '12px Arial', foreColor: colors.ink, backColor: '#ffffff', vAlign: S.VerticalAlign.center, cellPadding: '0 9', locked: true }));
  for (let c = 0; c < cols; c++) sheet.setColumnWidth(c, technical ? 108 : 44);
  for (let r = 0; r < rows; r++) sheet.setRowHeight(r, technical ? 27 : 24);
  if (!technical) { sheet.setColumnWidth(0, 20); sheet.setColumnWidth(26, 20); }
  sheet.options.gridline = { showHorizontalGridline: technical, showVerticalGridline: technical, color: '#edf1f3' };
  sheet.options.rowHeaderVisible = technical;
  sheet.options.colHeaderVisible = technical;
  sheet.options.allowCellOverflow = false;
  sheet.options.isProtected = true;
  sheet.options.protectionOptions = { allowSelectLockedCells: true, allowSelectUnlockedCells: true, allowOutlineRows: true, allowResizeColumns: technical, allowResizeRows: technical };
  sheet.options.sheetTabColor = technical ? '#a4b3b8' : colors.teal;
  sheet.options.selectionBorderColor = colors.teal;
  sheet.options.selectionBackColor = 'rgba(8,127,131,0.07)';
  sheet._rows = new Map();
}
export function heading(sheet, title, subtitle, eyebrow = 'FINANCIAL WORKSPACE') {
  text(sheet, 1, 1, 1, 25, eyebrow, { font: 'bold 10px Arial', foreColor: colors.teal });
  text(sheet, 2, 1, 2, 25, title, { font: 'bold 28px Arial' });
  text(sheet, 4, 1, 1, 25, subtitle, { foreColor: colors.muted, font: '11px Arial' });
}
export function section(sheet, row, title, subtitle = '') {
  text(sheet, row, 1, 1, 25, title, { font: 'bold 15px Arial' });
  if (subtitle) text(sheet, row + 1, 1, 1, 25, subtitle, { font: '11px Arial', foreColor: colors.muted });
}
export function card(sheet, row, col, width, label, formula, detail, spark) {
  style(sheet, row, col, 5, width, { backColor: colors.pale });
  text(sheet, row, col, 1, width, label.toUpperCase(), { font: 'bold 10px Arial', foreColor: colors.muted, backColor: colors.pale });
  text(sheet, row + 1, col, 2, width, `=${formula}`, { font: 'bold 25px Arial', formatter: money, backColor: colors.pale });
  if (detail) text(sheet, row + 3, col, 1, width, detail, { font: '10px Arial', foreColor: colors.muted, backColor: colors.pale });
  if (spark) text(sheet, row + 4, col, 1, width, `=LINESPARKLINE(${spark},0,,,"{seriesColor:${colors.teal},lineWeight:2,showLast:true,lastMarkerColor:${colors.teal}}")`, { backColor: colors.pale });
}
export function favorable(sheet, row, col, rows = 1, cols = 1, expense = false) {
  const operators = S.ConditionalFormatting.ComparisonOperators;
  for (const [op, color] of [[operators.greaterThan, expense ? colors.red : colors.green], [operators.lessThan, expense ? colors.green : colors.red]]) sheet.conditionalFormats.addCellValueRule(op, 0, 0, Object.assign(new S.Style(), { foreColor: color }), [new S.Range(row, col, rows, cols)]);
}
export function input(sheet, row, col, value, format = precise, min = -10000000, max = 10000000, integer = false) {
  sheet.setValue(row, col, value);
  sheet.getCell(row, col).locked(false).backColor(colors.input).foreColor(colors.teal).formatter(format);
  const validator = S.DataValidation.createNumberValidator(S.ConditionalFormatting.ComparisonOperators.between, min, max, integer);
  validator.inputTitle('Planning input');
  validator.inputMessage(`Enter ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}.`);
  validator.showInputMessage(true);
  validator.ignoreBlank(false);
  sheet.setDataValidator(row, col, validator);
  sheet._inputs ||= new Map();
  sheet._inputs.set(`${row}:${col}`, { value, min, max, integer });
}
export function note(sheet, row, col, rows, cols, value) {
  text(sheet, row, col, rows, cols, value, { wordWrap: true, backColor: '#edf7f4', foreColor: '#285a58', font: '13px Arial', locked: false, cellPadding: '10 14' });
  sheet._notes ||= new Map();
  sheet._notes.set(`${row}:${col}`, value);
}
export function sparkVariance(sheet, row, col, width, value, scale, expense = false) {
  text(sheet, row, col, 1, width, `=IF(ISNUMBER(${value}),VARISPARKLINE(${value},0,-(${scale}),${scale},0,0,FALSE,"${expense ? colors.red : colors.green}","${expense ? colors.green : colors.red}",FALSE),"")`);
}
export function chart(sheet, name, row, col, rows, cols, type, xValues, yValues, title) {
  let x = 0, y = 0, w = 0, h = 0;
  for (let c = 0; c < col; c++) x += sheet.getColumnWidth(c);
  for (let r = 0; r < row; r++) y += sheet.getRowHeight(r);
  for (let c = col; c < col + cols; c++) w += sheet.getColumnWidth(c);
  for (let r = row; r < row + rows; r++) h += sheet.getRowHeight(r);
  const ch = sheet.charts.add(name, S.Charts.ChartType[type], x, y, w, h);
  ch.title({ text: title, fontSize: 13, fontFamily: 'Arial', color: colors.ink });
  ch.legend({ visible: false });
  ch.chartArea({ backColor: '#ffffff', color: colors.muted, fontFamily: 'Arial', fontSize: 10, border: { color: colors.line, width: 1 } });
  const seriesStyle = type === 'waterfall' ? {} : { backColor: type === 'line' ? colors.teal : '#629cb5', border: { color: type === 'line' ? colors.teal : '#629cb5', width: type === 'line' ? 2.5 : 0 } };
  ch.series().add({ name: title, xValues, yValues, ...seriesStyle, gapWidth: 0.65 });
  const axes = ch.axes();
  axes.primaryValue.format = '$#,##0';
  axes.primaryValue.numberFormatLinked = false;
  axes.primaryValue.majorGridLine = { visible: true, color: '#e9eff2', width: 1 };
  axes.primaryCategory.majorGridLine = { visible: false };
  ch.axes(axes);
  if (type === 'waterfall') {
    const series = ch.series().get(0);
    series.subtotals = [0, 4];
    series.showConnectorLines = true;
    ch.series().set(0, series);
    ch.formatOvers({ 0: { backColor: colors.green }, 1: { backColor: colors.red }, 2: { backColor: colors.navy } });
  }
  return ch;
}
