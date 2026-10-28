import type { Workbook } from "exceljs";

type Scalar = string | number | boolean | null;
export function applyCreditFormulas(
  book: Workbook,
  state: Record<string, Scalar>,
  result: Record<string, Scalar | string[]>,
) {
  // Run after branding inserts its four header rows, so references use final addresses.
  const s = Object.fromEntries(Object.keys(state).map((key, i) => [key, `'Scenario'!$B$${i + 9}`]));
  const r = Object.fromEntries(Object.keys(result).map((key, i) => [key, `'Results'!B${i + 6}`]));
  const liquid = `${s["fuel"]}<>"rng"`;
  const lcfs = `${s["mode"]}<>"rfs"`;
  const rfs = `${s["mode"]}<>"lcfs"`;
  const rawEnergy = `${s["quantity"]}*IF(${s["unit"]}="MMBtu",'Conversion factors'!$B$6*1000000,1)`;
  const formulas: Record<string, string> = {
    gallons: `IF(${liquid},${s["quantity"]}/IF(${s["unit"]}="litre",'Conversion factors'!$B$7,1),"")`,
    energyMj: `IF(${liquid},${r["gallons"]}*${s["energy"]},${rawEnergy}*IF(${s["basis"]}="HHV",${s["hhvToLhv"]},1))`,
    ev: `IF(${rfs},IF(${s["fuel"]}="rng",1,IF(${s["evMode"]}="custom",${s["customEV"]},IF(${s["fuel"]}="rd",IF(${s["year"]}=2026,1.7,1.5),IF(${s["fuel"]}="bd",1.5,1)))),"")`,
    lcfsEnergy: `IF(${lcfs},IF(${liquid},${r["energyMj"]},${rawEnergy}*${s["lcfsBasisFactor"]})*${s["lcfsShare"]}/100,"")`,
    delta: `IF(${lcfs},${s["benchmark"]}*${s["eer"]}-${s["ci"]},"")`,
    lcfsTonnes: `IF(${lcfs},${r["delta"]}*${r["lcfsEnergy"]}/1000000,"")`,
    rinError: `IF(${rfs},IF(${s["dcode"]}="","Select the D-code from the registered/approved pathway to calculate RINs.",IF(AND(${s["fuel"]}="rd",${s["year"]}=2026,${s["evMode"]}="standard",${s["energy"]}/'Conversion factors'!$B$6<123500),"The 2026 1.7 factor requires LHV ≥ 123,500 Btu/gal. Enter an EPA-approved alternative equivalence value.","")),"")`,
    rins: `IF(AND(${rfs},${r["rinError"]}=""),IF(${liquid},${r["gallons"]}*${r["ev"]},${r["energyMj"]}/(77000*'Conversion factors'!$B$6))*${s["rfsShare"]}/100,"")`,
    lcfsValue: `IF(ISNUMBER(${r["lcfsTonnes"]}),${r["lcfsTonnes"]}*${s["lcfsPrice"]},"")`,
    rinValue: `IF(ISNUMBER(${r["rins"]}),${r["rins"]}*${s["rinPrice"]},"")`,
    combined: `IF(AND(${s["mode"]}="both",${s["lcfsConfirmed"]},${s["rfsConfirmed"]},ISNUMBER(${r["rins"]})),${r["lcfsValue"]}+${r["rinValue"]},"")`,
  };
  for (const [key, formula] of Object.entries(formulas)) {
    if (!r[key]) throw new Error(`Missing credit export result: ${key}`);
    book.getWorksheet("Results")!.getCell(r[key]!.split("!")[1]!).value = {
      formula,
      result: (result[key] as number | string) ?? "",
    };
  }
  const link = (sheet: string, cell: string, key: string) => {
    book.getWorksheet(sheet)!.getCell(cell).value = {
      formula: `IF(ISNUMBER(${r[key]}),${r[key]},"")`,
      result: (result[key] as number | string) ?? "",
    };
  };
  for (const [key, cell] of Object.entries({
    lcfsTonnes: "B7",
    rins: "B8",
    lcfsValue: "B9",
    rinValue: "B10",
    combined: "B11",
  }))
    link("Executive summary", cell, key);
  for (const [key, cell] of Object.entries({
    lcfsTonnes: "A7",
    rins: "D7",
    combined: "G7",
    lcfsValue: "E16",
    rinValue: "E17",
  }))
    link("Overview", cell, key);
  book.calcProperties.fullCalcOnLoad = true;
}
