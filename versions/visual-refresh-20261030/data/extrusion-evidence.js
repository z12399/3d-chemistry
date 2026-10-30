// Frozen source projection: original Table 2 observations, without interpolation.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const EXTRUSION_SOURCES=freeze([
  {
    "id": "extrusion-source-gonzalez2013",
    "title": "Extrusion Conditions and Amylose Content Affect Physicochemical Properties of Extrudates Obtained from Brown Rice Grains",
    "publisher": "Gonzalez et al.; International Journal of Food Science（2013）",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4745535/",
    "locator": "Methods 2.1 Materials; Methods 2.2 Extrusion process; Methods 2.3 Statistical Analysis; Table 2 caption, all data rows and F/P footnote",
    "note": "採 Methods 2.1–2.3 與 Table 2 的 22 列離散結果。保留三次中心條件；只採 SMEC、直徑比 E 與乾基比容 SV。含水百分比乾／濕基、溫度位置與逐格不確定度未交代；研究觀察不能外推最佳參數、營養或殺菌安全。",
    "localPath": "output/sensory-continuity-evidence-2026-10-13/official-gap-refresh/extrusion-source-review/sources/brown-rice-europepmc-xml.xml",
    "sha256": "1a00f8c4fdb6252d1c76f02dfb3d3a7c361b6f8801571b3ace4a77a376ad7bdd"
  },
  {
    "id": "extrusion-source-usda-process",
    "title": "Process Packs Protein into Snacks",
    "publisher": "USDA Agricultural Research Service",
    "url": "https://www.ars.usda.gov/news-events/news/research-news/2003/process-packs-protein-into-snacks/",
    "locator": "Paragraph beginning Most crunchy snacks; prior paragraph listing expanded snacks",
    "note": "採螺桿混合、輸送與加熱描述，並以膨發穀物零食、早餐穀物作兩個食品用途例子。這是雙螺桿說明，研究設備另為單螺桿；不採歷史蛋白比例與市場宣稱。",
    "localPath": "output/sensory-continuity-evidence-2026-10-13/official-gap-refresh/extrusion-source-review/sources/usda-extrusion-process.html",
    "sha256": "987312a39f621b280f173e131aedf5bdd417b921acd40ae9f229951356c198de"
  },
  {
    "id": "extrusion-source-fao-die",
    "title": "2. Cereal and pulse-based products",
    "publisher": "FAO",
    "url": "https://www.fao.org/4/x5434e/x5434e06.htm",
    "locator": "Extrusion section following dough/batter processes",
    "note": "採物料經模口成形及後續處理依產品而異的工序概念。成形不等於每種擠壓都熟化或膨發；不把麵條製程混作米研究數據。",
    "localPath": "output/sensory-continuity-evidence-2026-10-13/official-gap-refresh/extrusion-source-review/sources/fao-extrusion-die.html",
    "sha256": "a792d960eaa6562fb8aa3c40a66e2235a5a6a0110f9ec1aef9cdbc9ab3d2a688"
  },
  {
    "id": "extrusion-source-ntu114-q6",
    "title": "114 食品加工學原卷第6題",
    "publisher": "National Taiwan University",
    "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-258.pdf",
    "locator": "PDF page 1 question 6",
    "note": "原卷第 6 題要求擠壓加工目的與兩種食品例子。本課機理、實測資料比較與練習是原創教學延伸，不是官方標準答案。",
    "localPath": "output/sensory-continuity-evidence-2026-10-13/official-gap-refresh/sources/ntu-114-processing-live.pdf",
    "sha256": "6398a78b996a3bc3026c56a4f1dec981379f080de593dd5f419f8c885afd1b36"
  },
  {
    "id": "extrusion-source-fao-shear",
    "title": "Fish Feeds Processing and Technology",
    "publisher": "FAO, Nutrition in Marine Aquaculture training session, 1986",
    "url": "https://www.fao.org/fishery/docs/CDrom/aquaculture/a0845t/volume1/docrep/field/007/s5347e/S5347E09.htm",
    "locator": "5. EXTRUSION-COOKING, 5.1 Principle; 5.2 Extruders",
    "note": "僅採 §5.1–5.2 的螺桿壓縮／剪切、摩擦生熱、額外加熱與所述膨發程序出模汽化的定性機理。此為飼料來源，不移用溫壓、含水量、營養效果或安全保存條件。",
    "localPath": "output/sensory-continuity-evidence-2026-10-13/official-gap-refresh/extrusion-source-review/sources/fao-extrusion-thermal-shear.html",
    "sha256": "8e02be05a26de8da58eb4db819046fb71509a4ee6ae83221b1978f5901a2010a"
  }
]);
export const EXTRUSION_ROWS=freeze([
  {
    "id": "gr2013-r01-fortuna",
    "tableRow": 1,
    "variety": "Fortuna",
    "moisturePercentReported": 14.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 160.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "703",
      "E": "3.36",
      "SV": "5.39",
      "WA": "5.1",
      "S": "33.0"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 703.0,
      "diameterExpansionRatio": 3.36,
      "specificVolumeMlPerGDryMatter": 5.39
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 1, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r01-paso144",
    "tableRow": 1,
    "variety": "Paso 144",
    "moisturePercentReported": 14.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 160.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "637",
      "E": "3.46",
      "SV": "7.26",
      "WA": "6.6",
      "S": "20.1"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 637.0,
      "diameterExpansionRatio": 3.46,
      "specificVolumeMlPerGDryMatter": 7.26
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 1, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r02-fortuna",
    "tableRow": 2,
    "variety": "Fortuna",
    "moisturePercentReported": 14.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "671",
      "E": "3.38",
      "SV": "6.52",
      "WA": "5.9",
      "S": "30.8"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 671.0,
      "diameterExpansionRatio": 3.38,
      "specificVolumeMlPerGDryMatter": 6.52
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 2, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r02-paso144",
    "tableRow": 2,
    "variety": "Paso 144",
    "moisturePercentReported": 14.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "590",
      "E": "3.50",
      "SV": "8.27",
      "WA": "8.4",
      "S": "17.0"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 590.0,
      "diameterExpansionRatio": 3.5,
      "specificVolumeMlPerGDryMatter": 8.27
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 2, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r03-fortuna",
    "tableRow": 3,
    "variety": "Fortuna",
    "moisturePercentReported": 14.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 190.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "620",
      "E": "3.36",
      "SV": "8.64",
      "WA": "6,5",
      "S": "31.9"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 620.0,
      "diameterExpansionRatio": 3.36,
      "specificVolumeMlPerGDryMatter": 8.64
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 3, F columns",
    "ancillaryNormalization": {
      "WA": "Source prints 6,5; interpreted as decimal comma only if separately needed. Runtime projection excludes WA/S."
    }
  },
  {
    "id": "gr2013-r03-paso144",
    "tableRow": 3,
    "variety": "Paso 144",
    "moisturePercentReported": 14.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 190.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "493",
      "E": "3.42",
      "SV": "7.89",
      "WA": "7.9",
      "S": "17.5"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 493.0,
      "diameterExpansionRatio": 3.42,
      "specificVolumeMlPerGDryMatter": 7.89
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 3, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r04-fortuna",
    "tableRow": 4,
    "variety": "Fortuna",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 160.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "609",
      "E": "3.60",
      "SV": "5.43",
      "WA": "5.7",
      "S": "24.9"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 609.0,
      "diameterExpansionRatio": 3.6,
      "specificVolumeMlPerGDryMatter": 5.43
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 4, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r04-paso144",
    "tableRow": 4,
    "variety": "Paso 144",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 160.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "585",
      "E": "3.40",
      "SV": "6.12",
      "WA": "6.9",
      "S": "19.5"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 585.0,
      "diameterExpansionRatio": 3.4,
      "specificVolumeMlPerGDryMatter": 6.12
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 4, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r05-fortuna",
    "tableRow": 5,
    "variety": "Fortuna",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": 1,
    "rawSourceStrings": {
      "SMEC": "547",
      "E": "3.14",
      "SV": "5.22",
      "WA": "7.5",
      "S": "23.4"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 547.0,
      "diameterExpansionRatio": 3.14,
      "specificVolumeMlPerGDryMatter": 5.22
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 5, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r05-paso144",
    "tableRow": 5,
    "variety": "Paso 144",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": 1,
    "rawSourceStrings": {
      "SMEC": "575",
      "E": "3.01",
      "SV": "6.65",
      "WA": "7.5",
      "S": "13.5"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 575.0,
      "diameterExpansionRatio": 3.01,
      "specificVolumeMlPerGDryMatter": 6.65
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 5, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r06-fortuna",
    "tableRow": 6,
    "variety": "Fortuna",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": 2,
    "rawSourceStrings": {
      "SMEC": "534",
      "E": "3.03",
      "SV": "5.65",
      "WA": "7.3",
      "S": "23.3"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 534.0,
      "diameterExpansionRatio": 3.03,
      "specificVolumeMlPerGDryMatter": 5.65
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 6, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r06-paso144",
    "tableRow": 6,
    "variety": "Paso 144",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": 2,
    "rawSourceStrings": {
      "SMEC": "543",
      "E": "3.16",
      "SV": "6.98",
      "WA": "7.3",
      "S": "12.1"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 543.0,
      "diameterExpansionRatio": 3.16,
      "specificVolumeMlPerGDryMatter": 6.98
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 6, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r07-fortuna",
    "tableRow": 7,
    "variety": "Fortuna",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": 3,
    "rawSourceStrings": {
      "SMEC": "541",
      "E": "3.12",
      "SV": "5.29",
      "WA": "7.2",
      "S": "25.8"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 541.0,
      "diameterExpansionRatio": 3.12,
      "specificVolumeMlPerGDryMatter": 5.29
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 7, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r07-paso144",
    "tableRow": 7,
    "variety": "Paso 144",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": 3,
    "rawSourceStrings": {
      "SMEC": "566",
      "E": "3.17",
      "SV": "6.90",
      "WA": "7.22",
      "S": "12.9"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 566.0,
      "diameterExpansionRatio": 3.17,
      "specificVolumeMlPerGDryMatter": 6.9
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 7, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r08-fortuna",
    "tableRow": 8,
    "variety": "Fortuna",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 190.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "541",
      "E": "2.89",
      "SV": "7.23",
      "WA": "7.0",
      "S": "27.5"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 541.0,
      "diameterExpansionRatio": 2.89,
      "specificVolumeMlPerGDryMatter": 7.23
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 8, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r08-paso144",
    "tableRow": 8,
    "variety": "Paso 144",
    "moisturePercentReported": 16.5,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 190.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "483",
      "E": "2.95",
      "SV": "7.83",
      "WA": "8.3",
      "S": "17.2"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 483.0,
      "diameterExpansionRatio": 2.95,
      "specificVolumeMlPerGDryMatter": 7.83
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 8, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r09-fortuna",
    "tableRow": 9,
    "variety": "Fortuna",
    "moisturePercentReported": 19.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 160.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "483",
      "E": "2.55",
      "SV": "3.47",
      "WA": "6.0",
      "S": "21.5"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 483.0,
      "diameterExpansionRatio": 2.55,
      "specificVolumeMlPerGDryMatter": 3.47
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 9, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r09-paso144",
    "tableRow": 9,
    "variety": "Paso 144",
    "moisturePercentReported": 19.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 160.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "511",
      "E": "2.92",
      "SV": "4.53",
      "WA": "7.6",
      "S": "14.8"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 511.0,
      "diameterExpansionRatio": 2.92,
      "specificVolumeMlPerGDryMatter": 4.53
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 9, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r10-fortuna",
    "tableRow": 10,
    "variety": "Fortuna",
    "moisturePercentReported": 19.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "462",
      "E": "2.77",
      "SV": "4.29",
      "WA": "7.2",
      "S": "21.0"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 462.0,
      "diameterExpansionRatio": 2.77,
      "specificVolumeMlPerGDryMatter": 4.29
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 10, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r10-paso144",
    "tableRow": 10,
    "variety": "Paso 144",
    "moisturePercentReported": 19.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 175.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "501",
      "E": "2.76",
      "SV": "5.39",
      "WA": "7.0",
      "S": "11.1"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 501.0,
      "diameterExpansionRatio": 2.76,
      "specificVolumeMlPerGDryMatter": 5.39
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 10, P columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r11-fortuna",
    "tableRow": 11,
    "variety": "Fortuna",
    "moisturePercentReported": 19.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 190.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "409",
      "E": "2.46",
      "SV": "5.94",
      "WA": "7.7",
      "S": "26.1"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 409.0,
      "diameterExpansionRatio": 2.46,
      "specificVolumeMlPerGDryMatter": 5.94
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 11, F columns",
    "ancillaryNormalization": null
  },
  {
    "id": "gr2013-r11-paso144",
    "tableRow": 11,
    "variety": "Paso 144",
    "moisturePercentReported": 19.0,
    "moistureBasis": "unknown-not-explicitly-stated",
    "extrusionTemperatureC": 190.0,
    "centerRunOrdinal": null,
    "rawSourceStrings": {
      "SMEC": "407",
      "E": "2.18",
      "SV": "5.84",
      "WA": "8.1",
      "S": "15.5"
    },
    "adoptedEndpoints": {
      "smecJPerGFeedMoisture": 407.0,
      "diameterExpansionRatio": 2.18,
      "specificVolumeMlPerGDryMatter": 5.84
    },
    "uncertainty": {
      "cellSd": null,
      "cellSe": null,
      "cellCi": null,
      "pairwiseSignificance": null
    },
    "sourceLocator": "Gonzalez et al. 2013, Table 2, data row 11, P columns",
    "ancillaryNormalization": null
  }
]);
export const EXTRUSION_STUDY=freeze({
  "material": "dehulled/brown rice grits retaining bran and germ; two commercial varieties from Santa Fe, Argentina",
  "varieties": [
    "Fortuna",
    "Paso 144"
  ],
  "gritParticleSizeMm": [
    0.42,
    1.19
  ],
  "machine": "Brabender 20 DN single-screw extruder",
  "compressionRatio": "4:1",
  "die": {
    "diameterMm": 3,
    "lengthMm": 20
  },
  "screwRpm": 150,
  "moistureLevelsReportedPercent": [
    14,
    16.5,
    19
  ],
  "moistureBasis": null,
  "temperatureLevelsC": [
    160,
    175,
    190
  ],
  "temperatureLocation": null,
  "conditioning": "Water added 1 hour before each run to reach prescribed moisture; wet/dry denominator not explicitly stated.",
  "design": "3^2 factorial with three center runs, total 11 runs per variety; 22 variety-specific reported endpoint rows.",
  "centerRows": [
    5,
    6,
    7
  ],
  "steadyCollection": "Samples collected after stationary condition; torque and output mass flow measured simultaneously.",
  "postTreatment": "All extrudates air-dried in oven at 50C to reported moisture 6%; dried portions sealed in plastic bags until evaluation. Final moisture basis is unspecified.",
  "measurementStages": {
    "SMEC": "during stable extrusion, computed from torque and output flow",
    "E": "dried extrudate; average diameter of ten pieces divided by 3mm die diameter",
    "SV": "dried extrudate; volume/dry-weight of approx 15cm pieces, ten pieces averaged"
  },
  "unspecified": [
    "feed-rate setpoint and each run throughput/torque values",
    "exact thermal zones and whether T is measured material temperature",
    "6% final moisture wet/dry basis",
    "sample storage duration before testing",
    "per-cell SD/SE/CI and raw independent determinations"
  ]
});
export const EXTRUSION_ENDPOINTS=freeze({
  "SMEC": {
    "label": "比機械能耗 SMEC",
    "unit": "J/g, mass output at feed-moisture reference",
    "formulaAsReported": "SMEC = 61.6e-3 * torque(BU) * screw_rpm / mass_output(g/min)",
    "boundary": "Mechanical energy per mass; not all process electricity, thermal input or drying energy. Torque T in equation differs from extrusion temperature T."
  },
  "E": {
    "label": "直徑膨脹比 E=D/d",
    "unit": "dimensionless",
    "formula": "mean extrudate diameter / die diameter",
    "boundary": "Not length, area or volume expansion; source axial/radial name conflict preserved."
  },
  "SV": {
    "label": "乾基比容 SV",
    "unit": "mL/g dry matter (equivalent to cm3/g)",
    "formula": "extrudate volume / dry-basis weight",
    "boundary": "Not same quantity as E; cannot turn into porosity without extra measurements."
  },
  "WA": {
    "adoptedForRuntime": false,
    "unit": "mL water/g sample",
    "method": "Bauman method on prepared flour; per-mass dry/wet basis not separately specified here."
  },
  "S": {
    "adoptedForRuntime": false,
    "unit": "g soluble solids per 100g flour dry basis, reported %",
    "method": "2.5g flour dispersed in50mL water, agitation30min, centrifuge2000g, evaporate at105C."
  }
});
export const EXTRUSION_PROCESS_STEPS=freeze([
  {
    "id": "mix-convey",
    "label": "混合與輸送",
    "mechanism": "螺桿使物料混合並沿機筒前進；選定熱擠壓範例再接到壓縮、剪切與加熱。",
    "sourceIds": [
      "extrusion-source-usda-process",
      "extrusion-source-fao-shear"
    ],
    "boundary": "原料、螺桿數與配置依設備而異；本研究為單螺桿，USDA 說明為雙螺桿。",
    "layer": "general-process"
  },
  {
    "id": "thermal-shear",
    "label": "熱與剪切作用",
    "mechanism": "螺桿壓縮、剪切使機械能耗散為熱，設備也可額外供熱；物料結構隨條件改變。",
    "sourceIds": [
      "extrusion-source-usda-process",
      "extrusion-source-fao-shear"
    ],
    "boundary": "定性機理沒有給出各段食品溫度、停留時間、剪切速率或糊化百分比；不代表所有擠壓都完成熟化。",
    "layer": "general-process"
  },
  {
    "id": "die-forming",
    "label": "通過模口成形",
    "mechanism": "受推動的物料通過模口，形成相應形狀；模口幾何與材料狀態共同影響結果。",
    "sourceIds": [
      "extrusion-source-fao-die",
      "extrusion-source-fao-shear"
    ],
    "boundary": "成形是一般工序，模口並不保證一定得到膨發產品；3 mm 是所選米研究的模口直徑。",
    "layer": "general-process"
  },
  {
    "id": "conditional-expansion",
    "label": "出模後的條件式膨發",
    "mechanism": "在來源描述的熱膨發程序中，出模水分汽化可使結構膨發，形成較疏鬆的產品。",
    "sourceIds": [
      "extrusion-source-fao-shear",
      "extrusion-source-gonzalez2013"
    ],
    "boundary": "是否膨發及其程度取決於物料與條件；資料未逐段量到壓力、汽化量或孔隙率。",
    "layer": "general-process"
  },
  {
    "id": "study-post-treatment",
    "label": "研究樣品的後處理",
    "mechanism": "本研究將擠出樣品在 50°C 乾燥至作者所報 6% 含水量，裝袋後測量 E 與 SV；SMEC 於穩定擠壓時另算。",
    "sourceIds": [
      "extrusion-source-gonzalez2013"
    ],
    "boundary": "這是所選研究的樣品流程；6% 的乾／濕基與保存時間未說明，不是所有擠壓食品通用的乾燥規範。",
    "layer": "study-protocol"
  }
]);
export const EXTRUSION_FOOD_USES=freeze([
  {
    "id": "expanded-grain-snacks",
    "label": "膨發穀物零食",
    "purpose": "結合熱與剪切、模口成形及適當條件下的膨發，建立產品形狀與疏鬆口感。",
    "sourceIds": [
      "extrusion-source-usda-process",
      "extrusion-source-fao-die",
      "extrusion-source-fao-shear"
    ],
    "boundary": "USDA 舉 corn puffs 等用途；本課的米研究 22 列不是這些商品的品質或安全確效。"
  },
  {
    "id": "breakfast-cereal",
    "label": "早餐穀物",
    "purpose": "以擠壓處理穀物原料並成形，依產品目標安排膨發與後續處理。",
    "sourceIds": [
      "extrusion-source-usda-process",
      "extrusion-source-fao-die"
    ],
    "boundary": "這是官方來源列出的食品用途，不表示每種早餐穀物都使用同一流程或研究參數。"
  }
]);
export const EXTRUSION_LIMITS=freeze([
  {
    "id": "amylose-disagreement",
    "locator": "Abstract versus Methods 2.1",
    "observed": "Paso 144 is 27% in abstract and 28% in Methods; Fortuna is 16% in both.",
    "treatment": "保留兩處原文。品種卡可標「Paso 144：27%／28%，原文不一致」，不悄悄統一。兩品種另有脂質／蛋白／纖維等差異，不能把品種比較說成純 amylose 單因子因果。",
    "label": "直鏈澱粉比例不一致"
  },
  {
    "id": "expansion-label",
    "locator": "Methods 2.2 versus Abstract/Results expansion section",
    "observed": "Methods calls E axial expansion, defines E=D/d using extrudate and die diameter; abstract/results call it radial.",
    "treatment": "採「直徑膨脹比 E=D/d」並標原文命名不一致；不稱軸向長度比、面積比或體积比。",
    "label": "膨脹方向命名不一致"
  },
  {
    "id": "moisture-basis",
    "locator": "Methods 2.2, M levels and post-drying target",
    "observed": "14/16.5/19% grits moisture and the 6% drying target have no explicit wet/dry basis.",
    "treatment": "只寫作者所報含水百分比；乾／濕基 unknown，不反算加水量、不改名濕基。",
    "label": "含水量的乾／濕基未說明"
  },
  {
    "id": "temperature-location",
    "locator": "Methods 2.2",
    "observed": "T is called extrusion temperature; exact zone, sensor location, material temperature and setpoint/measurement distinction are not specified in the available method.",
    "treatment": "採「擠壓溫度（作者所報）」；不改稱模頭實測溫度或食品內部溫度。",
    "label": "溫度量測位置未說明"
  },
  {
    "id": "measurement-replication",
    "locator": "Methods 2.2 and 2.3; Table 2",
    "observed": "Methods describes averages of duplicate determinations, ten diameter measurements, ten pieces for SV, and three center-point runs in the design. Per-cell SD/SE/CI and raw determinations are absent.",
    "treatment": "三個中心製程列逐筆保留；不能把十塊樣品當十次獨立製程，不能替22格加誤差棒或新檢定。",
    "label": "重複製程與不確定度"
  },
  {
    "id": "table3-inconsistencies",
    "locator": "Results paragraph before Table 3 and Table 3",
    "observed": "Text says lack of fit P>0.5 except Paso WA, but table includes 0.0794/0.0515/0.2398/0.1593/0.1951; other text/table values and duplicated column labels also merit caution.",
    "treatment": "本契約不採 Table 3 推定誤差或顯著性，也不採原 RSM 曲面。保留原文問題，非自行更正。",
    "label": "未採用的統計表問題"
  },
  {
    "id": "decimal-comma",
    "locator": "Table 2 row 3, Fortuna WA",
    "observed": "The source prints 6,5, while most other WA values use decimal points.",
    "treatment": "rawSourceStrings保留6,5；旁證可明示以小數逗點讀成6.5。runtime只採SMEC/E/SV，不需要改這格。",
    "label": "原表小數逗點"
  },
  {
    "id": "endpoint-conditions",
    "locator": "Methods 2.2",
    "observed": "SMEC is calculated at steady operation from torque and mass output referenced to feeding moisture. Extrudates are then air-dried at 50C to reported moisture 6%, sealed in plastic bags until evaluation. E and SV follow this sample preparation.",
    "treatment": "SMEC與後乾燥E/SV的量測阶段分開。SV是乾基比容；SMEC不是乾基、不是電耗或全製程能耗。",
    "label": "量測階段與分母不同"
  },
  {
    "id": "abstract-range",
    "locator": "Abstract versus Table 2",
    "observed": "Abstract lists Paso solubility lower endpoint 11.0%; Table 2 minimum is 11.1%.",
    "treatment": "原表數據投影保留11.1，不用摘要範圍改表。S只作旁證。",
    "label": "摘要與表格範圍不一致"
  }
]);
