// Reviewed primary-source projection v2; citation objects match the curriculum.
export const XYLAN_SOURCES=[
  {
    "id": "xylitol-source-ntu115-q2",
    "title": "臺大 115 食品化學：第 2 題五碳糖醇製備",
    "publisher": "國立臺灣大學圖書館／115 學年度碩士班招生試題",
    "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-239.pdf",
    "locator": "PDF 第 1 頁，第 2 題：半纖維素水解、還原及晶體溶解吸熱的五碳糖醇",
    "note": "題目要求以化學分子結構說明；本課是原創教學模型，並非官方解答或官方評分標準。"
  },
  {
    "id": "xylitol-source-xylan2016",
    "title": "木聚糖主鏈與植物細胞壁中的不同構形",
    "publisher": "Simmons 等，Nature Communications 7:13902（2016），doi:10.1038/ncomms13902",
    "url": "https://doi.org/10.1038/ncomms13902",
    "locator": "正文 PDF pp.2–3、Figure 1、Table 1；Supplementary Figure 1",
    "note": "支持木聚糖與木糖單元、主鏈與側鏈及環境相關構形；本課未取其實驗座標，三糖片段是省略側鏈的計算教學代表，不是完整半纖維素。"
  },
  {
    "id": "xylitol-source-hydrogenation2019",
    "title": "木糖以氫氣還原成木糖醇的原始研究",
    "publisher": "Liu、Zhu、Ma、Cheng，Research 2019:5178573，doi:10.34133/2019/5178573",
    "url": "https://doi.org/10.34133/2019/5178573",
    "locator": "Scheme 1；Results and Discussion；4.4 Catalytic Mechanism（作者提出的可能機制）",
    "note": "支持 C1 醛基還原成 CH₂OH 的淨轉換。文中轉化率和選擇性限於其催化實驗；本課不模擬催化表面、速率、收率或逐步機制。"
  },
  {
    "id": "xylitol-source-chebi",
    "title": "ChEBI：木聚糖、木糖異構式與木糖醇的化學身份",
    "publisher": "EMBL-EBI ChEBI；本次擷取 2026-10-13（Asia/Taipei）",
    "url": "https://www.ebi.ac.uk/chebi/CHEBI:17151",
    "locator": "CHEBI:15447／37166 木聚糖；15936 醛式 D-木糖；28518／28161 α／β-D-木吡喃糖；17151 木糖醇；28309 木二糖",
    "note": "核對分子式、SMILES、InChI 與立體化學身份。取得的 MOL 是二維結構，不能當作實驗三維座標；木糖醇中央位點使用小寫 r 的偽不對稱描述。"
  },
  {
    "id": "xylitol-source-sweetness2018",
    "title": "木糖醇與蔗糖的濃度—甜度感官量測",
    "publisher": "Wee、Tan、Forde，Nutrients 10(11):1632（2018），doi:10.3390/nu10111632",
    "url": "https://doi.org/10.3390/nu10111632",
    "locator": "Methods 2.2–2.5；Tables 2、4；Results 3.1、3.3",
    "note": "40 位成人、過濾水溶液、gLMS 感官評分；Table 4 是曲線估計的等甜濃度與甜度比，不能當作固定分子常數。原文未明確給供試溫度。"
  },
  {
    "id": "xylitol-source-properties",
    "title": "木糖醇晶體溶解吸熱與冷感的教學實驗說明",
    "publisher": "Wouters、Van Meervelt，Acta Crystallographica E 78:874–879（2022），doi:10.1107/S2056989022007617",
    "url": "https://doi.org/10.1107/S2056989022007617",
    "locator": "Section 4，Determination of the heat of dissolution；Figure 6 的數值範例是赤藻糖醇",
    "note": "支持木糖醇晶體溶解吸熱及冷感的定性說明；文中 19.2 kJ/mol 等量熱範例屬赤藻糖醇，本課不將其移用為木糖醇數據，也不把分子內共價鍵斷裂當成溶解。"
  }
];
export const XYLAN_SWEETNESS={
  "sourceId": "xylitol-source-sweetness2018",
  "locator": "Table 4, publisher PDF p.9; methods pp.3–5; Table 2 p.4",
  "dataKind": "author-reported fitted equi-sweetness concentrations and potency estimates from sensory dose-response data, not raw individual observations",
  "referenceSucrosePercentWv": [
    5,
    10,
    15
  ],
  "xylitolEquisweetPercentWv": [
    5.1,
    9.9,
    13.3
  ],
  "authorReportedPotency": [
    0.98,
    1.01,
    1.12
  ],
  "participants": 40,
  "servingTemperatureC": null,
  "sourceEvidenceSha256": "a409d8c13081ed1dbf013d0853747506d199958f5ebf085a1f9facffd6a2c929"
};
