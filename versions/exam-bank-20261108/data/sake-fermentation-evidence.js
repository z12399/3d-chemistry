/** Source-bounded role network and qualitative brewery observations; no kinetics. */
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const SAKE_SOURCES = deepFreeze([
  {
    "id": "sake-source-ntu-114-microbiology",
    "title": "國立臺灣大學 114 學年度碩士班招生考試 食品微生物學",
    "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-259.pdf",
    "kind": "official-exam-scope",
    "localPath": "output/sensory-continuity-evidence-2026-10-13/official-gap-refresh/sources/ntu-114-microbiology-live.pdf",
    "sha256": "dc3d4f002917a37f63d9a344e1227e945fbfdca0ed8cc962e5df8e6950397eb7",
    "adoptedLocators": [
      "PDF p1 Q1"
    ],
    "boundary": "考題界定能力需求，不提供標準答案或科學數值。",
    "publisher": "National Taiwan University",
    "locator": "PDF p1 Q1",
    "note": "考題界定能力需求，不提供標準答案或科學數值。"
  },
  {
    "id": "sake-source-nrib-story-sake2",
    "title": "NRIB — The Story of Sake, Sake (Seishu) 2: The Integration of Science and Technology",
    "url": "https://www.nrib.go.jp/sake/story/pdf/SakeNo02_en.pdf",
    "kind": "official-scientific-guide",
    "localPath": "output/sake-fermentation-evidence-2026-10-13/source-review/sources/nrib-story-sake2.pdf",
    "sha256": "ce07d19be0e34fad0c61c899fbf3d1d80db51d2547004034a2a534b7895f2f16",
    "adoptedLocators": [
      "PDF/printed p4: Koji mold / Making koji",
      "PDF/printed p5: Yeast and role diagram",
      "PDF/printed p6: Shubo / Kimoto / Yamahai",
      "PDF/printed p7: Sokujo / Moromi"
    ],
    "boundary": "一般分工說明；p6 演替圖沒有可供本課採值的原始表格與方法，曲線數值、固定天數與普遍次序均不採用。文字抽取字型異常，採用宣稱均以渲染原頁確認。",
    "publisher": "National Research Institute of Brewing",
    "locator": "PDF/printed p4: Koji mold / Making koji; PDF/printed p5: Yeast and role diagram; PDF/printed p6: Shubo / Kimoto / Yamahai; PDF/printed p7: Sokujo / Moromi",
    "note": "一般分工說明；p6 演替圖沒有可供本課採值的原始表格與方法，曲線數值、固定天數與普遍次序均不採用。文字抽取字型異常，採用宣稱均以渲染原頁確認。"
  },
  {
    "id": "sake-source-nrib-comprehensive-guide",
    "title": "A Comprehensive Guide to Japanese Sake — NRIB / Japan Sake and Shochu Makers Association",
    "url": "https://www.nrib.go.jp/English/sake/pdf/guidesse01.pdf",
    "kind": "official-scientific-guide",
    "localPath": "output/sake-fermentation-evidence-2026-10-13/source-review/sources/nrib-comprehensive-guide.pdf",
    "sha256": "0da26fc9c2bf72487470125369f7b17918ebbe405a9680e7363cfebac66f01ea",
    "adoptedLocators": [
      "PDF p7 / printed p4 Fig.2.1",
      "PDF p8–9 / printed p5–6 §2.5, Figs.2.4–2.5",
      "PDF p10–11 / printed p7–8 §§2.6–2.7",
      "PDF p40 / printed p37 §8.4.2"
    ],
    "boundary": "提供製程與分工框架；本課不把來源中的示範溫度、期間、酒精濃度或比例當成所有酒廠的必然值。",
    "publisher": "National Research Institute of Brewing",
    "locator": "PDF p7 / printed p4 Fig.2.1; PDF p8–9 / printed p5–6 §2.5, Figs.2.4–2.5; PDF p10–11 / printed p7–8 §§2.6–2.7; PDF p40 / printed p37 §8.4.2",
    "note": "提供製程與分工框架；本課不把來源中的示範溫度、期間、酒精濃度或比例當成所有酒廠的必然值。"
  },
  {
    "id": "sake-source-nrib-sake-faq",
    "title": "NRIB Alcoholic Beverage Q&A — Seishu (sake)",
    "url": "https://www.nrib.go.jp/English/sake/esakefaq03.html",
    "kind": "official-scientific-faq",
    "localPath": "output/sake-fermentation-evidence-2026-10-13/source-review/sources/nrib-sake-faq.html",
    "adoptedLocators": [
      "Q4 What is Kimoto (Yamahai) shubo (seed mash)?"
    ],
    "boundary": "只採酸化來源與山廢取消山卸的界定；其他問答不作本課安全保證。",
    "sha256": "641e8b2afab7530f9c845f677bf95e6bdbe8ac281adf53497821fd11ec6ed82c",
    "publisher": "National Research Institute of Brewing",
    "locator": "Q4 What is Kimoto (Yamahai) shubo (seed mash)?",
    "note": "只採酸化來源與山廢取消山卸的界定；其他問答不作本課安全保證。"
  },
  {
    "id": "sake-source-jss-brewing-process",
    "title": "Japan Sake and Shochu Makers Association — Sake Brewing Processes and Flavor",
    "url": "https://japansake.or.jp/sake/en/professional/sake-brewing-processes-flavor/",
    "kind": "official-industry-guide",
    "localPath": "output/sake-fermentation-evidence-2026-10-13/source-review/sources/jss-brewing-process.html",
    "adoptedLocators": [
      "Koji Making / Koji in Sake Making",
      "Fermentation / Mother Culture / Shubo Needs to be Acidic",
      "Kimoto / Yamahai-moto and Sokujo-moto",
      "Main Mash / Saccharification and Alcoholic Fermentation"
    ],
    "boundary": "只交叉核對基本分工；35 g/L 敘述、滅菌／完全免污染措辭、確定風味效果與三段添料期間均不採用。",
    "sha256": "eb5e14251b6fe98884079d3294ff006c171bd9272463ab4a3e4d29cf6a99af53",
    "publisher": "Japan Sake and Shochu Makers Association",
    "locator": "Koji Making / Koji in Sake Making; Fermentation / Mother Culture / Shubo Needs to be Acidic; Kimoto / Yamahai-moto and Sokujo-moto; Main Mash / Saccharification and Alcoholic Fermentation",
    "note": "只交叉核對基本分工；35 g/L 敘述、滅菌／完全免污染措辭、確定風味效果與三段添料期間均不採用。"
  },
  {
    "id": "sake-source-aem2021",
    "title": "Changes in Bacterial and Chemical Components and Growth Prediction for Lactobacillus sakei during Kimoto-Style Fermentation Starter Preparation in Sake Brewing: a Comprehensive Analysis",
    "publisher": "American Society for Microbiology; Takahashi et al., 2021",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8105003/",
    "locator": "Discussion: three bacterial profiles; Methods: Samples analyzed / Bacterial population analysis",
    "note": "五酒藏、六批 kimoto-style 酒母的乳酸發酵期觀察；沒有速釀對照。",
    "localPath": "output/sake-fermentation-evidence-2026-10-13/study-review/aem2021/article-v2.html",
    "sha256": "3513eeaaed3d9dae9880fc05d0cae1c4c66243081c3e7466f4c57bf043649129"
  }
]);

export const SAKE_STAGES = deepFreeze([
  {
    "id": "koji",
    "label": "製麴",
    "note": "蒸米上培養麴菌，建立酵素來源。"
  },
  {
    "id": "starter",
    "label": "酒母",
    "note": "準備清酒酵母族群，並比較酸化來源。"
  },
  {
    "id": "moromi",
    "label": "醪",
    "note": "同槽內糖化與酒精發酵並行。"
  }
]);

export const SAKE_METHODS = deepFreeze([
  {
    "id": "kimoto-family",
    "label": "生酛系",
    "note": "包括生酛與山廢，利用乳酸菌形成酸性；山廢取消山卸研磨。"
  },
  {
    "id": "sokujo",
    "label": "速釀",
    "note": "直接加釀造用乳酸，不以乳酸菌產酸為必要步驟；不表示沒有乳酸菌。"
  }
]);

export const SAKE_ROLES = deepFreeze([
  {
    "id": "koji",
    "label": "麴菌／麴酵素",
    "note": "製麴以 Aspergillus oryzae 為例。米麴、麴菌和麴酵素須區分；醪中強調酵素作用。"
  },
  {
    "id": "lab",
    "label": "乳酸菌",
    "note": "生酛系酒母中產酸，透過環境影響其他微生物。"
  },
  {
    "id": "yeast",
    "label": "清酒酵母",
    "note": "以 Saccharomyces cerevisiae 說明利用糖的酒精發酵。"
  }
]);

export const SAKE_NODES = deepFreeze([
  {
    "id": "koji-fungus",
    "label": "麴菌",
    "kind": "organism"
  },
  {
    "id": "koji-enzymes",
    "label": "麴酵素",
    "kind": "catalyst"
  },
  {
    "id": "rice-starch",
    "label": "米澱粉",
    "kind": "substrate"
  },
  {
    "id": "fermentable-sugars",
    "label": "可發酵糖（含葡萄糖）",
    "kind": "material"
  },
  {
    "id": "sake-yeast",
    "label": "清酒酵母",
    "kind": "organism"
  },
  {
    "id": "ethanol-and-co2",
    "label": "乙醇與 CO₂",
    "kind": "product"
  },
  {
    "id": "lab",
    "label": "乳酸菌",
    "kind": "organism"
  },
  {
    "id": "lactic-acid",
    "label": "乳酸",
    "kind": "material"
  },
  {
    "id": "brewing-lactic-acid",
    "label": "釀造用乳酸",
    "kind": "ingredient"
  },
  {
    "id": "acidic-environment",
    "label": "酸性環境",
    "kind": "environment"
  },
  {
    "id": "microbial-community",
    "label": "酒母微生物族群",
    "kind": "community"
  },
  {
    "id": "starter-yeast-population",
    "label": "酒母中的酵母族群",
    "kind": "community"
  },
  {
    "id": "moromi-yeast",
    "label": "主醪起始酵母族群",
    "kind": "community"
  }
]);

export const SAKE_EDGES = deepFreeze([
  {
    "id": "koji-produces-enzymes",
    "from": "koji-fungus",
    "to": "koji-enzymes",
    "type": "enzyme-production",
    "claimId": "koji-growth-produces-enzymes",
    "emphasizeStages": [
      "koji"
    ],
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "label": "生長、產生酵素"
  },
  {
    "id": "starch-to-sugars",
    "from": "rice-starch",
    "to": "fermentable-sugars",
    "via": "koji-enzymes",
    "type": "material-conversion",
    "claimId": "koji-enzymes-release-sugars",
    "emphasizeStages": [
      "koji",
      "starter",
      "moromi"
    ],
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide"
    ],
    "label": "麴酵素水解、供糖"
  },
  {
    "id": "sugars-to-ethanol-co2",
    "from": "fermentable-sugars",
    "to": "ethanol-and-co2",
    "via": "sake-yeast",
    "type": "material-conversion",
    "claimId": "yeast-converts-glucose",
    "emphasizeStages": [
      "starter",
      "moromi"
    ],
    "sourceIds": [
      "sake-source-nrib-story-sake2"
    ],
    "label": "酵母利用糖發酵"
  },
  {
    "id": "lab-to-lactic-acid",
    "from": "lab",
    "to": "lactic-acid",
    "type": "biological-production",
    "claimId": "kimoto-family-biological-acidification",
    "emphasizeStages": [
      "starter"
    ],
    "methods": [
      "kimoto-family"
    ],
    "sourceIds": [
      "sake-source-nrib-sake-faq",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "label": "乳酸菌產酸"
  },
  {
    "id": "added-lactic-acid",
    "from": "brewing-lactic-acid",
    "to": "lactic-acid",
    "type": "ingredient-addition",
    "claimId": "sokujo-direct-acid-addition",
    "emphasizeStages": [
      "starter"
    ],
    "methods": [
      "sokujo"
    ],
    "sourceIds": [
      "sake-source-nrib-sake-faq",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "label": "直接加入乳酸"
  },
  {
    "id": "acid-environment",
    "from": "lactic-acid",
    "to": "acidic-environment",
    "type": "environmental-effect",
    "claimId": "acid-is-environmental-selection",
    "emphasizeStages": [
      "starter"
    ],
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "label": "使酒母酸化"
  },
  {
    "id": "environmental-selection",
    "from": "acidic-environment",
    "to": "microbial-community",
    "type": "environmental-effect",
    "claimId": "acid-is-environmental-selection",
    "emphasizeStages": [
      "starter"
    ],
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "label": "抑制部分不耐酸雜菌"
  },
  {
    "id": "yeast-inoculum",
    "from": "starter-yeast-population",
    "to": "moromi-yeast",
    "type": "stage-purpose",
    "claimId": "shubo-establishes-yeast",
    "emphasizeStages": [
      "starter"
    ],
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "label": "提供主醪起始族群"
  }
]);

export const SAKE_CELLS = deepFreeze([
  {
    "stage": "koji",
    "role": "koji",
    "claimIds": [
      "koji-is-cultured-rice",
      "koji-growth-produces-enzymes",
      "koji-enzymes-release-sugars"
    ],
    "result": "蒸米上培養麴菌，建立後續糖化所需的麴酵素。",
    "highlightEdges": [
      "koji-produces-enzymes",
      "starch-to-sugars"
    ],
    "method": "kimoto-family",
    "id": "koji--kimoto-family--koji",
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "koji",
    "role": "koji",
    "claimIds": [
      "koji-is-cultured-rice",
      "koji-growth-produces-enzymes",
      "koji-enzymes-release-sugars"
    ],
    "result": "蒸米上培養麴菌，建立後續糖化所需的麴酵素。",
    "highlightEdges": [
      "koji-produces-enzymes",
      "starch-to-sugars"
    ],
    "method": "sokujo",
    "id": "koji--sokujo--koji",
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "koji",
    "role": "lab",
    "claimIds": [
      "kimoto-family-biological-acidification",
      "sokujo-direct-acid-addition"
    ],
    "result": "乳酸菌的產酸分工主要在生酛系酒母；製麴以麴菌生長與產酵素為焦點。",
    "highlightEdges": [],
    "boundary": "非本階段主要分工，不表示不存在或菌數為零。",
    "method": "kimoto-family",
    "id": "koji--kimoto-family--lab",
    "sourceIds": [
      "sake-source-nrib-sake-faq",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ]
  },
  {
    "stage": "koji",
    "role": "lab",
    "claimIds": [
      "kimoto-family-biological-acidification",
      "sokujo-direct-acid-addition"
    ],
    "result": "乳酸菌的產酸分工主要在生酛系酒母；製麴以麴菌生長與產酵素為焦點。",
    "highlightEdges": [],
    "boundary": "非本階段主要分工，不表示不存在或菌數為零。",
    "method": "sokujo",
    "id": "koji--sokujo--lab",
    "sourceIds": [
      "sake-source-nrib-sake-faq",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ]
  },
  {
    "stage": "koji",
    "role": "yeast",
    "claimIds": [
      "koji-growth-produces-enzymes",
      "shubo-establishes-yeast"
    ],
    "result": "製麴先準備酵素；清酒酵母族群的建立放在酒母階段觀察。",
    "highlightEdges": [],
    "boundary": "不表示製麴時絕無野生酵母；不顯示虛構零值。",
    "method": "kimoto-family",
    "id": "koji--kimoto-family--yeast",
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ]
  },
  {
    "stage": "koji",
    "role": "yeast",
    "claimIds": [
      "koji-growth-produces-enzymes",
      "shubo-establishes-yeast"
    ],
    "result": "製麴先準備酵素；清酒酵母族群的建立放在酒母階段觀察。",
    "highlightEdges": [],
    "boundary": "不表示製麴時絕無野生酵母；不顯示虛構零值。",
    "method": "sokujo",
    "id": "koji--sokujo--yeast",
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ]
  },
  {
    "stage": "starter",
    "role": "koji",
    "claimIds": [
      "koji-enzymes-release-sugars",
      "koji-protein-hydrolysis"
    ],
    "result": "加入的米麴帶來酵素，水解米料並供應酵母可利用的糖。",
    "highlightEdges": [
      "starch-to-sugars"
    ],
    "method": "kimoto-family",
    "id": "starter--kimoto-family--koji",
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "starter",
    "role": "koji",
    "claimIds": [
      "koji-enzymes-release-sugars",
      "koji-protein-hydrolysis"
    ],
    "result": "加入的米麴帶來酵素，水解米料並供應酵母可利用的糖。",
    "highlightEdges": [
      "starch-to-sugars"
    ],
    "method": "sokujo",
    "id": "starter--sokujo--koji",
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "starter",
    "role": "lab",
    "method": "kimoto-family",
    "claimIds": [
      "kimoto-family-biological-acidification",
      "acid-is-environmental-selection"
    ],
    "result": "乳酸菌產乳酸，酸化酒母並改變其他微生物所處的環境。",
    "highlightEdges": [
      "lab-to-lactic-acid",
      "acid-environment",
      "environmental-selection"
    ],
    "id": "starter--kimoto-family--lab",
    "sourceIds": [
      "sake-source-nrib-sake-faq",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "starter",
    "role": "lab",
    "method": "sokujo",
    "claimIds": [
      "sokujo-direct-acid-addition",
      "acid-is-environmental-selection"
    ],
    "result": "此法直接加入乳酸；酒母仍須酸化，但不以乳酸菌產酸為必要步驟。",
    "highlightEdges": [
      "added-lactic-acid",
      "acid-environment",
      "environmental-selection"
    ],
    "id": "starter--sokujo--lab",
    "sourceIds": [
      "sake-source-nrib-sake-faq",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "starter",
    "role": "yeast",
    "claimIds": [
      "shubo-establishes-yeast",
      "yeast-converts-glucose",
      "acid-is-environmental-selection"
    ],
    "result": "在酒母中建立清酒酵母族群；酵母利用糖，並為主醪提供發酵起始族群。",
    "highlightEdges": [
      "sugars-to-ethanol-co2",
      "yeast-inoculum"
    ],
    "method": "kimoto-family",
    "id": "starter--kimoto-family--yeast",
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "starter",
    "role": "yeast",
    "claimIds": [
      "shubo-establishes-yeast",
      "yeast-converts-glucose",
      "acid-is-environmental-selection"
    ],
    "result": "在酒母中建立清酒酵母族群；酵母利用糖，並為主醪提供發酵起始族群。",
    "highlightEdges": [
      "sugars-to-ethanol-co2",
      "yeast-inoculum"
    ],
    "method": "sokujo",
    "id": "starter--sokujo--yeast",
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "moromi",
    "role": "koji",
    "claimIds": [
      "koji-enzymes-release-sugars",
      "moromi-parallel-fermentation",
      "moromi-receives-koji-and-starter"
    ],
    "result": "麴酵素持續水解澱粉供糖，與酵母耗糖發酵並行。",
    "highlightEdges": [
      "starch-to-sugars"
    ],
    "boundary": "酵素仍有作用，不是麴菌仍在增殖的證據。",
    "method": "kimoto-family",
    "id": "moromi--kimoto-family--koji",
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-jss-brewing-process"
    ]
  },
  {
    "stage": "moromi",
    "role": "koji",
    "claimIds": [
      "koji-enzymes-release-sugars",
      "moromi-parallel-fermentation",
      "moromi-receives-koji-and-starter"
    ],
    "result": "麴酵素持續水解澱粉供糖，與酵母耗糖發酵並行。",
    "highlightEdges": [
      "starch-to-sugars"
    ],
    "boundary": "酵素仍有作用，不是麴菌仍在增殖的證據。",
    "method": "sokujo",
    "id": "moromi--sokujo--koji",
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-jss-brewing-process"
    ]
  },
  {
    "stage": "moromi",
    "role": "lab",
    "claimIds": [
      "acid-is-environmental-selection",
      "moromi-parallel-fermentation",
      "sokujo-direct-acid-addition"
    ],
    "result": "乳酸菌不是本圖醪中主要酒精生產者；回到酒母可比較酸化來源。",
    "highlightEdges": [],
    "boundary": "不得把先前的酸化作用畫成醪中持續必需的乳酸菌增殖；也不主張 LAB 完全不存在。",
    "method": "kimoto-family",
    "id": "moromi--kimoto-family--lab",
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2",
      "sake-source-jss-brewing-process",
      "sake-source-nrib-sake-faq"
    ]
  },
  {
    "stage": "moromi",
    "role": "lab",
    "claimIds": [
      "acid-is-environmental-selection",
      "moromi-parallel-fermentation",
      "sokujo-direct-acid-addition"
    ],
    "result": "乳酸菌不是本圖醪中主要酒精生產者；回到酒母可比較酸化來源。",
    "highlightEdges": [],
    "boundary": "不得把先前的酸化作用畫成醪中持續必需的乳酸菌增殖；也不主張 LAB 完全不存在。",
    "method": "sokujo",
    "id": "moromi--sokujo--lab",
    "sourceIds": [
      "sake-source-nrib-comprehensive-guide",
      "sake-source-nrib-story-sake2",
      "sake-source-jss-brewing-process",
      "sake-source-nrib-sake-faq"
    ]
  },
  {
    "stage": "moromi",
    "role": "yeast",
    "claimIds": [
      "yeast-converts-glucose",
      "moromi-parallel-fermentation"
    ],
    "result": "清酒酵母利用麴酵素釋出的糖，產生乙醇與 CO₂；糖化和發酵可同時進行。",
    "highlightEdges": [
      "sugars-to-ethanol-co2"
    ],
    "method": "kimoto-family",
    "id": "moromi--kimoto-family--yeast",
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-jss-brewing-process"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  },
  {
    "stage": "moromi",
    "role": "yeast",
    "claimIds": [
      "yeast-converts-glucose",
      "moromi-parallel-fermentation"
    ],
    "result": "清酒酵母利用麴酵素釋出的糖，產生乙醇與 CO₂；糖化和發酵可同時進行。",
    "highlightEdges": [
      "sugars-to-ethanol-co2"
    ],
    "method": "sokujo",
    "id": "moromi--sokujo--yeast",
    "sourceIds": [
      "sake-source-nrib-story-sake2",
      "sake-source-nrib-comprehensive-guide",
      "sake-source-jss-brewing-process"
    ],
    "boundary": "顯示的是本階段分工；連線不表示實測速率、濃度或菌數。"
  }
]);

export const SAKE_STUDY = deepFreeze({
  "id": "aem2021-kimoto-profiles",
  "title": "同是生酛系，乳酸菌時序也可不同",
  "sourceIds": [
    "sake-source-aem2021"
  ],
  "measurement": "菌量由 16S/SSU rRNA 基因 qPCR 定量 × 定序讀數比例 ÷ rrn 操作子拷貝數估算；不是可培養 CFU，也不是只有相對豐度。",
  "boundary": "這是五家酒藏、六批酒母乳酸發酵期的觀察；不同酒藏不是可操控的處理組。沒有速釀對照，不推定固定天數、菌數、pH 或產酒量。",
  "sharedObservation": "五家酒藏最後採樣時，L. sakei 都是最多的菌種。",
  "quantitativeSeries": null,
  "crossLessonLinks": [
    {"label":"澱粉與結構","href":"#learn/carbohydrates/carb-starch-texture/observe","boundary":"作為澱粉與糖化的前置概念，並非清酒製程模擬。"},
    {"label":"發酵與風味","href":"#learn/flavor/flavor-fermentation/observe","boundary":"作為發酵產物的延伸概念，不推定清酒風味或產量。"}
  ],
  "patterns": [
    {
      "id": "A",
      "label": "酒藏 A",
      "breweryIds": [
        "A"
      ],
      "observation": "大部分製備期間，球狀乳酸菌比桿狀乳酸菌多。",
      "interpretation": "乳酸菌的先後變化可不同；這些案例不能當成所有生酛系酒母的固定時間表。",
      "boundary": "依作者質性分組，無精確交替日期；未選中的菌群不表示不存在。",
      "locator": "Discussion: bacterial transition profiles; Figure 4 referenced by authors, not digitized",
      "sourceIds": [
        "sake-source-aem2021"
      ],
      "displaySteps": [
        {
          "label": "大部分製備期間",
          "detail": "球狀乳酸菌較桿狀乳酸菌多"
        }
      ]
    },
    {
      "id": "B",
      "label": "酒藏 B",
      "breweryIds": [
        "B"
      ],
      "observation": "早期球狀乳酸菌較多；中期桿狀乳酸菌超過球狀乳酸菌，之後佔優勢。",
      "interpretation": "乳酸菌的先後變化可不同；這些案例不能當成所有生酛系酒母的固定時間表。",
      "boundary": "依作者質性分組，無精確交替日期；未選中的菌群不表示不存在。",
      "locator": "Discussion: bacterial transition profiles; Figure 4 referenced by authors, not digitized",
      "sourceIds": [
        "sake-source-aem2021"
      ],
      "displaySteps": [
        {
          "label": "早期",
          "detail": "球狀乳酸菌較多"
        },
        {
          "label": "中期起",
          "detail": "桿狀乳酸菌超過球菌，之後佔優勢"
        }
      ]
    },
    {
      "id": "C-E",
      "label": "酒藏 C、D、E",
      "breweryIds": [
        "C",
        "D",
        "E"
      ],
      "observation": "整段觀察期間，桿狀乳酸菌比球狀乳酸菌多。",
      "interpretation": "乳酸菌的先後變化可不同；這些案例不能當成所有生酛系酒母的固定時間表。",
      "boundary": "依作者質性分組，無精確交替日期；未選中的菌群不表示不存在。",
      "locator": "Discussion: bacterial transition profiles; Figure 4 referenced by authors, not digitized",
      "sourceIds": [
        "sake-source-aem2021"
      ],
      "displaySteps": [
        {
          "label": "整段觀察期間",
          "detail": "桿狀乳酸菌較球狀乳酸菌多"
        }
      ]
    }
  ]
});

export const SAKE_LIMITS = deepFreeze([
  "醪的糖化與酒精發酵兩條關係同時可見；選擇角色只改變重點，不把另一過程關掉。",
  "製麴、酒母、醪是階段焦點，不是每個材料只經過一次的單一路徑。",
  "未強調邊或角色表示非當前教學焦點，不表示濃度、活性或菌數為零。",
  "酸化的間接環境作用與糖/乙醇物質轉化在圖例及視覺上區分。",
  "此圖只說明分工，不提供速率、pH、菌數、糖濃度或產酒量。",
  "本課沒有全國酒廠可共用的菌數曲線、固定演替次序、酵素動力學或 pH 實測。",
  "酸化不代表完全消除所有其他微生物，不能宣稱最後必然只剩清酒酵母。",
  "酸化抑制部分微生物不能推出無污染、滅菌或食品安全達標。",
  "pH 與滴定酸度不可互換；乳酸菌相對豐度、qPCR 基因拷貝數、可培養 CFU 與代謝活性不可互換。",
  "麴菌名、酵母名是代表性教學層級；不把所有乳酸菌視為同一菌種，也不把所有 LAB 都視為永遠有益。",
  "研究只涵蓋這批 kimoto-style 酒母的乳酸發酵期，不能代表所有酒藏或速釀。",
  "球菌／桿菌是形態群組，L. sakei 是菌種層級；群組多寡與單一菌種優勢不可混為一談。",
  "原文 Results/圖示標 cells/g、Methods 寫 cells/mL；本課不採精確菌數或自行換算。",
  "原研究生長模型僅在五酒藏中的兩家較符合；此處不使用它預測發酵，也不採普遍 pH 門檻。",
  "本頁採作者質性歸納，沒有可供讀取的菌數時間序列；不能從此圖計算菌數或生長率。"
]);
