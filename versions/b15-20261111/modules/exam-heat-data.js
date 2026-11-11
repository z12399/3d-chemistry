// 由 scripts/build-exam-heat.py 從 data/exam-map.json 產生，請勿手改。
// shareP：114–115 學年平均占分（%）；shareS：103–113 學年平均占分（%）；unmapped：地圖沒有這個主題（新主題或未編碼），改以 examRefs 推算 primaryLessons。
export const EXAM_HEAT = Object.freeze({
 "chemistry": {
  "name": "食品化學",
  "mapKey": "chem",
  "direction": [
   "蛋白質比重明顯上升：占分約 27.5%（103–113 學年為 12.4%）。兩年都考等電點／淨電荷、溶解度（pH、有機溶劑）與疏水作用；114 年用一整組小題串起胺基酸、三級結構、纖維狀蛋白與水合（含水合容量公式、溫度與 pH 的影響）；115 年改考 Henderson-Hasselbalch 計算、胰蛋白酶抑制劑與 PER 的雙軸圖、亞硝胺生成、替代蛋白評估。",
   "脂質仍是最大主題（約 30%），而且兩年都以「氧化機制」為核心：114 年考 2,4-癸二烯醛的結構與生成、油炸四條指標曲線、抗壞血酸棕櫚酸酯與不皂化物；115 年考油酸氧化的 9-／10-ROOH 與光敏氧化、β-POS 與 fat bloom、金屬離子與維生素 E。",
   "糖與褐變各有固定的一題：114 年是澱粉轉果糖糖漿（用結構說明）與酵素性／非酵素性褐變比較；115 年是木糖醇製程（半纖維素水解＋還原）與梅納反應和相對蒸氣壓（RVP）。糖題的共同模式是「用分子結構說明工業轉化」。",
   "色素、植化素與風味：114 年考類黃酮八類骨架、含 N／O／S 雜環風味；115 年考配醣體的腸道吸收、白藜蘆醇、花青素與甜菜紅素在酸性／中性產品的選用、大蒜素的酵素與基質區隔。",
   "題型：112 年起已沒有選擇題；114–115 年機制推理占分 53%（103–113 年為 34%），圖表判讀 10%（原 4%）。乳化、泡沫與凝膠這一主題在這兩年完全沒有出現（原約 10%），但這只有兩年，不代表之後不考。"
  ],
  "topics": {
   "lipids": {
    "shareP": 30.0,
    "shareS": 21.9,
    "inBoth": true,
    "y114": 30.0,
    "y115": 30.0,
    "nQ": 39
   },
   "proteins": {
    "shareP": 27.5,
    "shareS": 12.4,
    "inBoth": true,
    "y114": 30.0,
    "y115": 25.0,
    "nQ": 62
   },
   "pigments": {
    "shareP": 14.5,
    "shareS": 12.3,
    "inBoth": true,
    "y114": 10.0,
    "y115": 19.0,
    "nQ": 20
   },
   "carbohydrates": {
    "shareP": 10.0,
    "shareS": 15.6,
    "inBoth": true,
    "y114": 10.0,
    "y115": 10.0,
    "nQ": 17
   },
   "browning": {
    "shareP": 10.0,
    "shareS": 11.3,
    "inBoth": true,
    "y114": 10.0,
    "y115": 10.0,
    "nQ": 17
   },
   "flavor": {
    "shareP": 8.0,
    "shareS": 3.3,
    "inBoth": true,
    "y114": 10.0,
    "y115": 6.0,
    "nQ": 8
   },
   "colloids": {
    "shareP": 0.0,
    "shareS": 10.0,
    "inBoth": false,
    "y114": null,
    "y115": null,
    "nQ": 13
   },
   "processing": {
    "shareP": 0.0,
    "shareS": 5.7,
    "inBoth": false,
    "y114": null,
    "y115": null,
    "nQ": 7
   },
   "enzymes": {
    "shareP": 0.0,
    "shareS": 4.4,
    "inBoth": false,
    "y114": null,
    "y115": null,
    "nQ": 12
   },
   "water": {
    "shareP": 0.0,
    "shareS": 2.2,
    "inBoth": false,
    "y114": null,
    "y115": null,
    "nQ": 3
   },
   "vitamins": {
    "shareP": 0.0,
    "shareS": 0.5,
    "inBoth": false,
    "y114": null,
    "y115": null,
    "nQ": 1
   },
   "minerals": {
    "shareP": 0.0,
    "shareS": 0.5,
    "inBoth": false,
    "y114": null,
    "y115": null,
    "nQ": 1
   }
  }
 },
 "processing": {
  "name": "食品加工學",
  "mapKey": "proc",
  "direction": [
   "兩年各有一題相同模板的計算題：乾基／濕基含水量換算後，用「每小時去除 5 公斤水」算乾燥時間（114 年蘋果、115 年稻穀）。物料衡算占分約 15%，兩年都是固定得分點。",
   "乾燥是最大主題（約 18%）：114 年考熱風乾燥 vs 冷凍乾燥、冷凍乾燥的崩塌；115 年考濕空氣圖、乾燥的目的與水分移除機制、乾燥造成的品質變化。",
   "熱處理約 17.5%，兩年都考 D 值／z 值與升降溫速率：114 年考殺菁終點與脫氣；115 年考罐頭冷點（傳導 vs 對流）、體積與升降溫時間、巴氏殺菌 vs 滅菌。",
   "包裝：114 年考 MAP 與包材選擇；115 年考包裝四功能（containment、protection、convenience、communication）。",
   "題型：每卷題數增加（約 13 題，103–113 年約 8.7 題），單題平均配分降到 7.7 分（原 12.6 分）；設計題占分降到 5%（原 24%），比較題 16%、計算題 11%。114 年另考滲透壓／逆滲透、擠壓、稻穀磨粉、超臨界 CO2、油脂精製五步驟；115 年另考單效與多效蒸發、益生菌凍乾、固態 vs 液態發酵。"
  ],
  "topics": {
   "proc-drying": {
    "shareP": 18.0,
    "shareS": 14.8,
    "inBoth": true,
    "y114": 5.0,
    "y115": 31.0,
    "nQ": 18
   },
   "proc-thermal-processing": {
    "shareP": 17.5,
    "shareS": 11.2,
    "inBoth": true,
    "y114": 20.0,
    "y115": 15.0,
    "nQ": 14
   },
   "proc-balances": {
    "shareP": 15.0,
    "shareS": 1.0,
    "inBoth": true,
    "y114": 10.0,
    "y115": 20.0,
    "nQ": 4
   },
   "proc-separation": {
    "shareP": 10.0,
    "shareS": 6.6,
    "inBoth": false,
    "y114": 20.0,
    "y115": null,
    "nQ": 7
   },
   "proc-packaging": {
    "shareP": 9.0,
    "shareS": 3.6,
    "inBoth": true,
    "y114": 10.0,
    "y115": 8.0,
    "nQ": 7
   },
   "proc-freezing": {
    "shareP": 5.0,
    "shareS": 14.0,
    "inBoth": false,
    "y114": 10.0,
    "y115": null,
    "nQ": 12
   },
   "proc-grain-processing": {
    "shareP": 5.0,
    "shareS": 11.2,
    "inBoth": false,
    "y114": 10.0,
    "y115": null,
    "nQ": 11
   },
   "proc-evaporation": {
    "shareP": 5.0,
    "shareS": 6.4,
    "inBoth": false,
    "y114": null,
    "y115": 10.0,
    "nQ": 5
   },
   "proc-oil-refining": {
    "shareP": 5.0,
    "shareS": 0.0,
    "inBoth": false,
    "y114": 10.0,
    "y115": null,
    "nQ": 1
   },
   "proc-fermentation": {
    "shareP": 3.5,
    "shareS": 5.8,
    "inBoth": false,
    "y114": null,
    "y115": 7.0,
    "nQ": 9
   },
   "proc-energy": {
    "shareP": 2.5,
    "shareS": 1.8,
    "inBoth": false,
    "y114": null,
    "y115": 5.0,
    "nQ": 3
   },
   "proc-process-design": {
    "shareP": 0.0,
    "shareS": 6.1,
    "inBoth": false,
    "y114": null,
    "y115": null,
    "nQ": 5
   }
  }
 },
 "microbiology": {
  "name": "食品微生物學",
  "mapKey": "micro",
  "direction": [
   "發酵占約 44.5%（103–113 年 38.5%），且有固定模板「製程、原料、風味來源、參與微生物＋安全疑慮」：114 年是醬油（含減鹽的安全疑慮），115 年是納豆。另有 114 年清酒的菌群角色與互動、115 年乳酸菌飲品菌株選擇與無乳糖發酵乳的微生物酵素。",
   "食品危害與菌體特性兩年都出現：114 年海鮮病原菌與預防、革蘭氏陽性／陰性菌的熱與冷藏差異；115 年家禽兩種危害（來源與控制）、殺菌不足後孢子 vs 沙門氏菌存活、革蘭氏染色。熱抵抗、內生孢子、細胞壁是共同重點。",
   "名詞解釋每年一大題（114 年 20 分、115 年 15 分），而且偏新概念：114 年 Lactic antagonism、Postbiotics、12D concept、Seed culture、Feedback inhibition；115 年 Precision fermentation、Synbiotics、SIMs、Competitive exclusion、Hurdle technology。",
   "題型：案例題占分 20%（103–113 年 9%），機制題 33.5%（原 21.5%），記憶題降到 33%（原 43%）。114 年有 18 分的抗氧化壓力與 DNA 修復機制題；115 年有 PCR／qPCR 與菌株溯源（跨國沙門氏菌事件）。"
  ],
  "topics": {
   "micro-fermentation": {
    "shareP": 44.5,
    "shareS": 38.5,
    "inBoth": true,
    "y114": 40.0,
    "y115": 49.0,
    "nQ": 49
   },
   "micro-identity": {
    "shareP": 16.0,
    "shareS": 4.8,
    "inBoth": true,
    "y114": 22.0,
    "y115": 10.0,
    "nQ": 9
   },
   "micro-hazards": {
    "shareP": 13.0,
    "shareS": 12.5,
    "inBoth": true,
    "y114": 10.0,
    "y115": 16.0,
    "nQ": 16
   },
   "micro-environment": {
    "shareP": 9.0,
    "shareS": 11.9,
    "inBoth": false,
    "y114": 18.0,
    "y115": null,
    "nQ": 17
   },
   "micro-measurement": {
    "shareP": 7.5,
    "shareS": 6.8,
    "inBoth": false,
    "y114": null,
    "y115": 15.0,
    "nQ": 11
   },
   "micro-growth": {
    "shareP": 5.0,
    "shareS": 0.9,
    "inBoth": false,
    "y114": 10.0,
    "y115": null,
    "nQ": 2
   },
   "micro-control": {
    "shareP": 2.5,
    "shareS": 10.5,
    "inBoth": false,
    "y114": null,
    "y115": 5.0,
    "nQ": 16
   },
   "micro-cases": {
    "shareP": 0.0,
    "shareS": 14.1,
    "inBoth": false,
    "y114": null,
    "y115": null,
    "nQ": 19
   },
   "micro-fermented-foods": {
    "shareP": null,
    "shareS": null,
    "inBoth": null,
    "y114": null,
    "y115": null,
    "nQ": null,
    "unmapped": true,
    "derived": true,
    "primaryLessons": 3
   }
  }
 }
});
export const PRIMARY_YEARS = Object.freeze([114, 115]);
export function topicHeat(subjectId, topicId) { return EXAM_HEAT[subjectId]?.topics?.[topicId] ?? null; }
export function heatLabel(h) {
  if (!h) return '';
  if (h.unmapped) return h.primaryLessons > 0 ? `近兩年有 ${h.primaryLessons} 課直接對應考題` : '尚未整理';
  if (h.shareP > 0) return `近兩年占 ${h.shareP}%`;
  return h.shareS > 0 ? `近兩年沒考（以前約 ${h.shareS}%）` : '13 年沒考過';
}
export function heatClass(h) { if (!h) return 'heat-unknown'; if (h.unmapped) return h.primaryLessons >= 2 ? 'heat-hot' : h.primaryLessons > 0 ? 'heat-warm' : 'heat-unknown'; return h.shareP >= 10 ? 'heat-hot' : h.shareP > 0 ? 'heat-warm' : 'heat-cold'; }
export function heatRank(h) { if (!h) return -1; if (h.unmapped) return h.primaryLessons > 0 ? 1 : -1; return h.shareP; }
