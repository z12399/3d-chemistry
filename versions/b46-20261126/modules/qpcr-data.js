// Primary sources and packet-specific locators; illustrative values are not measurements.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const QPCR_SOURCES=freeze([
  {
    "id": "qpcr-source-miqe2025",
    "title": "MIQE 2.0：qPCR效率、Cq與報告條件",
    "publisher": "Bustin 等，Clinical Chemistry 71(6):634–651（2025），doi:10.1093/clinchem/hvaf043",
    "url": "https://doi.org/10.1093/clinchem/hvaf043",
    "locator": "正式版PDF pp.7–12／印刷pp.640–645；效率、基線與閾值、數量與對照",
    "note": "來源支持量測原理及報告界線；本課點值為指定示例。p.640斜率方向文字與同頁公式衝突，保留疑義並按公式獨立查核。"
  },
  {
    "id": "qpcr-source-fda2023",
    "title": "FDA：食品與環境樣本的qPCR快速篩檢",
    "publisher": "U.S. FDA，Second Edition，November 30, 2023",
    "url": "https://www.fda.gov/media/168834/download",
    "locator": "PDF pp.4、6、15：用途、增菌後樣本來源、推定陽性的確認",
    "note": "特定方法的篩檢用途；不能將增菌後Cq換算原食品活菌數，或把其LOD50當本模型LOD／LOQ。"
  },
  {
    "id": "qpcr-source-ntu115-q2-1",
    "title": "臺大115食品微生物學：第2題第1小題 PCR／qPCR用途與優點",
    "publisher": "國立臺灣大學圖書館／115學年度碩士班招生試題",
    "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-241.pdf",
    "locator": "PDF第1頁，第2題第1小題；第2小題菌株比對與溯源是另一要求",
    "note": "本課原創模型對應部分能力，不是官方解答；模型曲線、標準點與題例均非事件實測資料。"
  }
]);
