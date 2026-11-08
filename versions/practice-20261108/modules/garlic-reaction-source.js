/** Exact reviewed garlic data. Source integrity, not experimental validation.
 * No I/O, source fallback, self-declared digest trust or accessor invocation.
 */
export const GARLIC_SOURCE_DATA_SHA256 = '4431d518e83ed652cacae0917c9a1dfe79eded15ab829013857eb8603af4649a';
export const GARLIC_DATASET_IDENTITY = 'garlic-reaction-ledger@2026-10-16.1#4431d518e83ed652cacae0917c9a1dfe79eded15ab829013857eb8603af4649a';
const PINNED = {
  "schema": "garlic-reaction-ledger/v1",
  "version": "2026-10-16.1",
  "id": "garlic-reaction-ledger",
  "researchProvenance": [
    {
      "path": "output/garlic-reaction-science-2026-10-16/manifest-v1.json",
      "bytes": 5774,
      "sha256": "9739375ea7074ec419a460cd0e2875d6bca6f8a67f1cac4c9e3c999e72f98005"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/finite-reaction-contract-v1.json",
      "bytes": 6574,
      "sha256": "fdb372f11a75fed5c7990ab58b934b445398eb23cbbccb4126377828e7dc8626"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/cns-atom-fate-v1.json",
      "bytes": 5441,
      "sha256": "ec625ad777eeb83d98c04e7392627e5c6125e898637395aa9568b98ada3c235d"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/enumeration-and-label-scope-v1.json",
      "bytes": 1560,
      "sha256": "2ba4c29ff6a1228b29db86a59aea2796530065cac5219a6c17467affaefed70c"
    },
    {
      "path": "output/garlic-reaction-evidence-2026-10-16/BRIEF.md",
      "bytes": 13161,
      "sha256": "a06d00f1e7fb726963620a424fc67ff4a079ee53e02b18cdaf592fa42d7a1c90"
    }
  ],
  "formulaProvenance": [
    {
      "path": "output/garlic-reaction-science-2026-10-16/sources-v1/pubchem-alliin.json",
      "bytes": 260,
      "sha256": "5cc16ed334c4f04ffc37269fefe730bba68bd76a2fa15bd6167e65561fc8f670"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/sources-v1/pubchem-allylsulfenic-acid.json",
      "bytes": 222,
      "sha256": "b802237059b8dfb74d041c73cb811a6533fe7f8e4d56c8587c982f5835be5ba7"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/sources-v1/pubchem-aminoacrylic-acid.json",
      "bytes": 233,
      "sha256": "e1840027c8e754f87a0ae3934fb1b38b4c8d7b5743e36be81c709791a46fd817"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/sources-v1/pubchem-pyruvic-acid.json",
      "bytes": 230,
      "sha256": "5524be1c21b6e3cb70023ddc78dd61a7c384fbf6f14e0f97090b6a1e2e77ca77"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/sources-v1/pubchem-ammonia.json",
      "bytes": 204,
      "sha256": "e8d23c427ed3ca0025c0ee8feab238a7603db62b8a84acac75ca148999399b90"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/sources-v1/pubchem-allicin.json",
      "bytes": 237,
      "sha256": "a6480f51c849cdccb6ac065722a143386463cf06799cb21844ef715267898699"
    },
    {
      "path": "output/garlic-reaction-science-2026-10-16/sources-v1/pubchem-water.json",
      "bytes": 204,
      "sha256": "b7d5555a6e5bb82789c6f49664b16634aa06113fe3a91662969cfe3799c4a728"
    }
  ],
  "species": [
    {
      "id": "alliin",
      "label": "蒜胺酸",
      "formula": "C6H11NO3S",
      "structure": {
        "trackedAtoms": [
          {
            "localId": "C1",
            "element": "C",
            "hydrogens": 0,
            "x": 40,
            "y": 76
          },
          {
            "localId": "C2",
            "element": "C",
            "hydrogens": 1,
            "x": 40,
            "y": 140
          },
          {
            "localId": "C3",
            "element": "C",
            "hydrogens": 2,
            "x": 40,
            "y": 204
          },
          {
            "localId": "S",
            "element": "S",
            "hydrogens": 0,
            "x": 40,
            "y": 268
          },
          {
            "localId": "C4",
            "element": "C",
            "hydrogens": 2,
            "x": 40,
            "y": 332
          },
          {
            "localId": "C5",
            "element": "C",
            "hydrogens": 1,
            "x": 40,
            "y": 396
          },
          {
            "localId": "C6",
            "element": "C",
            "hydrogens": 2,
            "x": 40,
            "y": 460
          },
          {
            "localId": "N",
            "element": "N",
            "hydrogens": 2,
            "x": 144,
            "y": 140
          }
        ],
        "untrackedAtoms": [
          {
            "localId": "O1",
            "element": "O",
            "hydrogens": 0,
            "x": 144,
            "y": 76
          },
          {
            "localId": "O2",
            "element": "O",
            "hydrogens": 1,
            "x": 40,
            "y": 12
          },
          {
            "localId": "O3",
            "element": "O",
            "hydrogens": 0,
            "x": 144,
            "y": 268
          }
        ],
        "trackedBonds": [
          {
            "from": "C1",
            "to": "C2",
            "order": 1
          },
          {
            "from": "C2",
            "to": "C3",
            "order": 1
          },
          {
            "from": "C3",
            "to": "S",
            "order": 1
          },
          {
            "from": "S",
            "to": "C4",
            "order": 1
          },
          {
            "from": "C4",
            "to": "C5",
            "order": 1
          },
          {
            "from": "C5",
            "to": "C6",
            "order": 2
          },
          {
            "from": "C2",
            "to": "N",
            "order": 1
          }
        ],
        "untrackedBonds": [
          {
            "from": "C1",
            "to": "O1",
            "order": 2
          },
          {
            "from": "C1",
            "to": "O2",
            "order": 1
          },
          {
            "from": "S",
            "to": "O3",
            "order": 2
          }
        ],
        "caption": "中性2D骨架；省略C2與S的立體構型。O與H是局部未追蹤標記。"
      },
      "cid": 9576089,
      "charge": 0,
      "elementCounts": {
        "C": 6,
        "H": 11,
        "N": 1,
        "O": 3,
        "S": 1
      },
      "formulaSourceId": "garlic-pubchem-alliin"
    },
    {
      "id": "allyl-sulfenic-acid",
      "label": "烯丙基次磺酸",
      "formula": "C3H6OS",
      "structure": {
        "trackedAtoms": [
          {
            "localId": "S",
            "element": "S",
            "hydrogens": 0,
            "x": 40,
            "y": 40
          },
          {
            "localId": "C4",
            "element": "C",
            "hydrogens": 2,
            "x": 40,
            "y": 104
          },
          {
            "localId": "C5",
            "element": "C",
            "hydrogens": 1,
            "x": 40,
            "y": 168
          },
          {
            "localId": "C6",
            "element": "C",
            "hydrogens": 2,
            "x": 40,
            "y": 232
          }
        ],
        "untrackedAtoms": [
          {
            "localId": "O1",
            "element": "O",
            "hydrogens": 1,
            "x": 144,
            "y": 40
          }
        ],
        "trackedBonds": [
          {
            "from": "S",
            "to": "C4",
            "order": 1
          },
          {
            "from": "C4",
            "to": "C5",
            "order": 1
          },
          {
            "from": "C5",
            "to": "C6",
            "order": 2
          }
        ],
        "untrackedBonds": [
          {
            "from": "S",
            "to": "O1",
            "order": 1
          }
        ],
        "caption": "S–OH為局部次磺酸結構；O/H不對應唯一來源。"
      },
      "cid": 14917355,
      "charge": 0,
      "elementCounts": {
        "C": 3,
        "H": 6,
        "N": 0,
        "O": 1,
        "S": 1
      },
      "formulaSourceId": "garlic-pubchem-allyl-sulfenic-acid"
    },
    {
      "id": "aminoacrylic-acid",
      "label": "2-胺基丙烯酸",
      "formula": "C3H5NO2",
      "structure": {
        "trackedAtoms": [
          {
            "localId": "C1",
            "element": "C",
            "hydrogens": 0,
            "x": 40,
            "y": 76
          },
          {
            "localId": "C2",
            "element": "C",
            "hydrogens": 0,
            "x": 40,
            "y": 140
          },
          {
            "localId": "C3",
            "element": "C",
            "hydrogens": 2,
            "x": 40,
            "y": 204
          },
          {
            "localId": "N",
            "element": "N",
            "hydrogens": 2,
            "x": 144,
            "y": 140
          }
        ],
        "untrackedAtoms": [
          {
            "localId": "O1",
            "element": "O",
            "hydrogens": 0,
            "x": 144,
            "y": 76
          },
          {
            "localId": "O2",
            "element": "O",
            "hydrogens": 1,
            "x": 40,
            "y": 12
          }
        ],
        "trackedBonds": [
          {
            "from": "C1",
            "to": "C2",
            "order": 1
          },
          {
            "from": "C2",
            "to": "C3",
            "order": 2
          },
          {
            "from": "C2",
            "to": "N",
            "order": 1
          }
        ],
        "untrackedBonds": [
          {
            "from": "C1",
            "to": "O1",
            "order": 2
          },
          {
            "from": "C1",
            "to": "O2",
            "order": 1
          }
        ],
        "caption": "中性2-胺基丙烯酸；教學停格不表示可穩定保存。"
      },
      "cid": 123991,
      "charge": 0,
      "elementCounts": {
        "C": 3,
        "H": 5,
        "N": 1,
        "O": 2,
        "S": 0
      },
      "formulaSourceId": "garlic-pubchem-aminoacrylic-acid"
    },
    {
      "id": "pyruvic-acid",
      "label": "丙酮酸",
      "formula": "C3H4O3",
      "structure": {
        "trackedAtoms": [
          {
            "localId": "C1",
            "element": "C",
            "hydrogens": 0,
            "x": 40,
            "y": 76
          },
          {
            "localId": "C2",
            "element": "C",
            "hydrogens": 0,
            "x": 40,
            "y": 140
          },
          {
            "localId": "C3",
            "element": "C",
            "hydrogens": 3,
            "x": 40,
            "y": 204
          }
        ],
        "untrackedAtoms": [
          {
            "localId": "O1",
            "element": "O",
            "hydrogens": 0,
            "x": 144,
            "y": 76
          },
          {
            "localId": "O2",
            "element": "O",
            "hydrogens": 1,
            "x": 40,
            "y": 12
          },
          {
            "localId": "O3",
            "element": "O",
            "hydrogens": 0,
            "x": 144,
            "y": 140
          }
        ],
        "trackedBonds": [
          {
            "from": "C1",
            "to": "C2",
            "order": 1
          },
          {
            "from": "C2",
            "to": "C3",
            "order": 1
          }
        ],
        "untrackedBonds": [
          {
            "from": "C1",
            "to": "O1",
            "order": 2
          },
          {
            "from": "C1",
            "to": "O2",
            "order": 1
          },
          {
            "from": "C2",
            "to": "O3",
            "order": 2
          }
        ],
        "caption": "中性丙酮酸，不是pyruvate陰離子；新羰基O只作局部結構標記。"
      },
      "cid": 1060,
      "charge": 0,
      "elementCounts": {
        "C": 3,
        "H": 4,
        "N": 0,
        "O": 3,
        "S": 0
      },
      "formulaSourceId": "garlic-pubchem-pyruvic-acid"
    },
    {
      "id": "ammonia",
      "label": "氨",
      "formula": "NH3",
      "structure": {
        "trackedAtoms": [
          {
            "localId": "N",
            "element": "N",
            "hydrogens": 3,
            "x": 40,
            "y": 40
          }
        ],
        "untrackedAtoms": [],
        "trackedBonds": [],
        "untrackedBonds": [],
        "caption": "NH3的H只計局部數量，不追溯唯一來源。"
      },
      "cid": 222,
      "charge": 0,
      "elementCounts": {
        "C": 0,
        "H": 3,
        "N": 1,
        "O": 0,
        "S": 0
      },
      "formulaSourceId": "garlic-pubchem-ammonia"
    },
    {
      "id": "allicin",
      "label": "蒜素",
      "formula": "C6H10OS2",
      "structure": {
        "trackedAtoms": [
          {
            "localId": "A.C6",
            "element": "C",
            "hydrogens": 2,
            "x": 30,
            "y": 30
          },
          {
            "localId": "A.C5",
            "element": "C",
            "hydrogens": 1,
            "x": 30,
            "y": 94
          },
          {
            "localId": "A.C4",
            "element": "C",
            "hydrogens": 2,
            "x": 30,
            "y": 158
          },
          {
            "localId": "A.S",
            "element": "S",
            "hydrogens": 0,
            "x": 30,
            "y": 222
          },
          {
            "localId": "B.S",
            "element": "S",
            "hydrogens": 0,
            "x": 150,
            "y": 222
          },
          {
            "localId": "B.C4",
            "element": "C",
            "hydrogens": 2,
            "x": 150,
            "y": 158
          },
          {
            "localId": "B.C5",
            "element": "C",
            "hydrogens": 1,
            "x": 150,
            "y": 94
          },
          {
            "localId": "B.C6",
            "element": "C",
            "hydrogens": 2,
            "x": 150,
            "y": 30
          }
        ],
        "untrackedAtoms": [
          {
            "localId": "O1",
            "element": "O",
            "hydrogens": 0,
            "x": 30,
            "y": 286
          }
        ],
        "trackedBonds": [
          {
            "from": "A.C6",
            "to": "A.C5",
            "order": 2
          },
          {
            "from": "A.C5",
            "to": "A.C4",
            "order": 1
          },
          {
            "from": "A.C4",
            "to": "A.S",
            "order": 1
          },
          {
            "from": "A.S",
            "to": "B.S",
            "order": 1
          },
          {
            "from": "B.S",
            "to": "B.C4",
            "order": 1
          },
          {
            "from": "B.C4",
            "to": "B.C5",
            "order": 1
          },
          {
            "from": "B.C5",
            "to": "B.C6",
            "order": 2
          }
        ],
        "untrackedBonds": [
          {
            "from": "A.S",
            "to": "O1",
            "order": 2
          }
        ],
        "caption": "固定把A.S畫成S=O只是圖示慣例；交換A/B不改未標記物種。"
      },
      "cid": 65036,
      "charge": 0,
      "elementCounts": {
        "C": 6,
        "H": 10,
        "N": 0,
        "O": 1,
        "S": 2
      },
      "formulaSourceId": "garlic-pubchem-allicin"
    },
    {
      "id": "water",
      "label": "水",
      "formula": "H2O",
      "structure": {
        "trackedAtoms": [],
        "untrackedAtoms": [
          {
            "localId": "O1",
            "element": "O",
            "hydrogens": 2,
            "x": 40,
            "y": 40
          }
        ],
        "trackedBonds": [],
        "untrackedBonds": [],
        "caption": "水只在總帳；這個局部H2O記號不具有跨反應原子身分。"
      },
      "cid": 962,
      "charge": 0,
      "elementCounts": {
        "C": 0,
        "H": 2,
        "N": 0,
        "O": 1,
        "S": 0
      },
      "formulaSourceId": "garlic-pubchem-water"
    }
  ],
  "initial": {
    "inventory": {
      "alliin": 2,
      "allyl-sulfenic-acid": 0,
      "aminoacrylic-acid": 0,
      "pyruvic-acid": 0,
      "ammonia": 0,
      "allicin": 0,
      "water": 2
    },
    "conditions": {
      "contact": false,
      "enzymeActive": true,
      "plpAvailable": true
    }
  },
  "operations": [
    {
      "id": "mix",
      "label": "讓兩者接觸",
      "enabledMessage": "可讓蒜胺酸與催化系統接觸。",
      "appliedMessage": "已讓蒜胺酸與催化系統接觸；物質數量不變。",
      "evidenceRefs": [
        {
          "sourceId": "cf-alliinase-shimon2007",
          "locator": "Introduction: compartment separation and tissue damage"
        }
      ]
    },
    {
      "id": "disable-catalyst",
      "label": "設為催化不可用",
      "enabledMessage": "可把催化條件設成不可用。",
      "appliedMessage": "催化條件已設為不可用；現有物質保留。",
      "evidenceRefs": [
        {
          "sourceId": "cf-alliinase",
          "locator": "模型條件切換；EC條目僅支持上游催化反應／PLP角色，不是熱處理後下游產物測量"
        }
      ]
    },
    {
      "id": "cleave-alliin",
      "label": "催化一次",
      "enabledMessage": "可裂解1份蒜胺酸。",
      "appliedMessage": "1份蒜胺酸裂解，形成1份烯丙基次磺酸與1份2-胺基丙烯酸。",
      "evidenceRefs": [
        {
          "sourceId": "cf-alliinase",
          "locator": "EC 4.4.1.4: reaction and cofactor"
        },
        {
          "sourceId": "cf-alliinase-shimon2007",
          "locator": "Introduction: PLP-dependent alpha,beta-elimination and released aminoacrylate"
        },
        {
          "sourceId": "cf-allicin-formation2014",
          "locator": "Figure 1, physical PDF page 3: Step 1"
        }
      ]
    },
    {
      "id": "hydrolyze-aminoacrylate",
      "label": "水解一次",
      "enabledMessage": "可讓1份2-胺基丙烯酸與1份水反應。",
      "appliedMessage": "1份2-胺基丙烯酸與1份水反應，形成1份丙酮酸與1份氨。",
      "evidenceRefs": [
        {
          "sourceId": "cf-alliinase-shimon2007",
          "locator": "Introduction: released aminoacrylate decomposes to pyruvate and ammonia"
        },
        {
          "sourceId": "garlic-pubchem-aminoacrylic-acid",
          "locator": "Neutral-formula balance with pyruvic acid, ammonia and water"
        },
        {
          "sourceId": "garlic-pubchem-pyruvic-acid",
          "locator": "MolecularFormula and Charge 0"
        },
        {
          "sourceId": "garlic-pubchem-ammonia",
          "locator": "MolecularFormula and Charge 0"
        },
        {
          "sourceId": "garlic-pubchem-water",
          "locator": "MolecularFormula and Charge 0"
        }
      ]
    },
    {
      "id": "condense-sulfenic",
      "label": "縮合一次",
      "enabledMessage": "可讓2份烯丙基次磺酸縮合。",
      "appliedMessage": "2份烯丙基次磺酸縮合，形成1份蒜素與1份水。",
      "evidenceRefs": [
        {
          "sourceId": "cf-allicin-formation2014",
          "locator": "Figure 1, physical PDF page 3: Step 2"
        },
        {
          "sourceId": "cf-alliinase-shimon2007",
          "locator": "Introduction: two allylsulfenic-acid molecules form allicin"
        },
        {
          "sourceId": "garlic-pubchem-allicin",
          "locator": "Neutral-formula balance with two sulfenic-acid units and water"
        }
      ]
    }
  ],
  "reasonMessages": {
    "ALREADY_MIXED": "已處於接觸狀態，本次未改變物質。",
    "CATALYST_ALREADY_INACTIVE": "催化已不可用，本次未改變物質。",
    "CONTACT_REQUIRED": "尚未讓蒜胺酸與催化系統接觸。",
    "CATALYST_INACTIVE": "催化不可用，不能再裂解蒜胺酸。",
    "PLP_UNAVAILABLE": "PLP不可用，不能進行此催化裂解。",
    "ALLIIN_DEPLETED": "沒有剩餘蒜胺酸可供裂解。",
    "AMINOACRYLIC_ACID_REQUIRED": "尚無2-胺基丙烯酸可供水解。",
    "WATER_REQUIRED": "帳中沒有足夠的水可供此步水解。",
    "TWO_SULFENIC_ACIDS_REQUIRED": "需要兩份烯丙基次磺酸才能縮合。"
  },
  "reactions": [
    {
      "id": "cleave-alliin",
      "reactants": {
        "alliin": 1
      },
      "products": {
        "allyl-sulfenic-acid": 1,
        "aminoacrylic-acid": 1
      },
      "requires": [
        "contact",
        "enzymeActive",
        "plpAvailable"
      ]
    },
    {
      "id": "hydrolyze-aminoacrylate",
      "reactants": {
        "aminoacrylic-acid": 1,
        "water": 1
      },
      "products": {
        "pyruvic-acid": 1,
        "ammonia": 1
      },
      "requires": []
    },
    {
      "id": "condense-sulfenic",
      "reactants": {
        "allyl-sulfenic-acid": 2
      },
      "products": {
        "allicin": 1,
        "water": 1
      },
      "requires": []
    }
  ],
  "sources": [
    {
      "id": "cf-alliinase",
      "title": "SIB ENZYME — alliin lyase EC 4.4.1.4",
      "url": "https://enzyme.expasy.org/EC/4.4.1.4",
      "locator": "EC 4.4.1.4: reaction and cofactor",
      "readScope": "完整短條目：lyase反應與PLP；未提供速率、加熱門檻或同位素來源。"
    },
    {
      "id": "cf-alliinase-shimon2007",
      "title": "Shimon et al. (2007) — alliinase and the PLP-bound aminoacrylate intermediate",
      "url": "https://www.sciencedirect.com/science/article/pii/S0022283606015816",
      "locator": "Abstract and indexed Introduction; DOI 10.1016/j.jmb.2006.11.041",
      "readScope": "已讀公開摘要與出版社可讀索引introduction，未讀出版社完整PDF；反應背景與PLP結合中間體的原始結構觀察分開。PubMed下載challenge排除。"
    },
    {
      "id": "cf-allicin-formation2014",
      "title": "Wallock-Richards et al. (2014) — Fig. 1 allicin formation",
      "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0112726",
      "locator": "Figure 1, physical PDF page 3; DOI 10.1371/journal.pone.0112726",
      "readScope": "原始PDF第3頁Fig.1已視讀：第一步裂解與兩份次磺酸縮合；此圖沒有畫氨基丙烯酸水解支線。是論文背景圖，不使用抗菌或健康結果。"
    },
    {
      "id": "garlic-rcsb-2hox",
      "title": "RCSB PDB 2HOX — alliinase intermediate complex",
      "url": "https://www.rcsb.org/structure/2HOX",
      "locator": "Entry title, citation and ligand metadata",
      "readScope": "只讀官方metadata及關聯P1T身分；沒有分析座標。PLP加合物不當作自由氨基丙烯酸。"
    },
    {
      "id": "garlic-pubchem-alliin",
      "title": "PubChem — 蒜胺酸 (CID 9576089)",
      "url": "https://pubchem.ncbi.nlm.nih.gov/compound/9576089",
      "locator": "MolecularFormula, Charge and standardized structure record",
      "readScope": "核對中性分子式、Charge 0及身分；不據此推論反應機理、溶液主要酸鹼型態或同位素來源。"
    },
    {
      "id": "garlic-pubchem-allyl-sulfenic-acid",
      "title": "PubChem — 烯丙基次磺酸 (CID 14917355)",
      "url": "https://pubchem.ncbi.nlm.nih.gov/compound/14917355",
      "locator": "MolecularFormula, Charge and standardized structure record",
      "readScope": "核對中性分子式、Charge 0及身分；不據此推論反應機理、溶液主要酸鹼型態或同位素來源。"
    },
    {
      "id": "garlic-pubchem-aminoacrylic-acid",
      "title": "PubChem — 2-胺基丙烯酸 (CID 123991)",
      "url": "https://pubchem.ncbi.nlm.nih.gov/compound/123991",
      "locator": "MolecularFormula, Charge and standardized structure record",
      "readScope": "核對中性分子式、Charge 0及身分；不據此推論反應機理、溶液主要酸鹼型態或同位素來源。"
    },
    {
      "id": "garlic-pubchem-pyruvic-acid",
      "title": "PubChem — 丙酮酸 (CID 1060)",
      "url": "https://pubchem.ncbi.nlm.nih.gov/compound/1060",
      "locator": "MolecularFormula, Charge and standardized structure record",
      "readScope": "核對中性分子式、Charge 0及身分；不據此推論反應機理、溶液主要酸鹼型態或同位素來源。"
    },
    {
      "id": "garlic-pubchem-ammonia",
      "title": "PubChem — 氨 (CID 222)",
      "url": "https://pubchem.ncbi.nlm.nih.gov/compound/222",
      "locator": "MolecularFormula, Charge and standardized structure record",
      "readScope": "核對中性分子式、Charge 0及身分；不據此推論反應機理、溶液主要酸鹼型態或同位素來源。"
    },
    {
      "id": "garlic-pubchem-allicin",
      "title": "PubChem — 蒜素 (CID 65036)",
      "url": "https://pubchem.ncbi.nlm.nih.gov/compound/65036",
      "locator": "MolecularFormula, Charge and standardized structure record",
      "readScope": "核對中性分子式、Charge 0及身分；不據此推論反應機理、溶液主要酸鹼型態或同位素來源。"
    },
    {
      "id": "garlic-pubchem-water",
      "title": "PubChem — 水 (CID 962)",
      "url": "https://pubchem.ncbi.nlm.nih.gov/compound/962",
      "locator": "MolecularFormula, Charge and standardized structure record",
      "readScope": "核對中性分子式、Charge 0及身分；不據此推論反應機理、溶液主要酸鹼型態或同位素來源。"
    }
  ],
  "limits": [
    "這是七物種、三個總括反應的示意計量帳本；數字不是mol、濃度、食品產率或溶劑分子模擬。",
    "固定起點是2份蒜胺酸與2份水；兩次水解共消耗2份水，縮合生成1份水，因此完整淨反應只消耗1份水。",
    "採中性分子記帳：丙酮酸為C3H4O3、氨為NH3，不預測溶液pH或主要酸鹼型態。",
    "2D骨架省略立體構型，沒有模擬立體選擇性；x/y只是排版CSS座標，不是實驗幾何或3D結構。",
    "C/N/S對應保留分子骨架；A/B是固定帳本標記，不是獨特實測分子或同位素身分。",
    "O與H只記局部結構及總數，未指定跨反應來源；將A.S畫成S=O只是圖示慣例。",
    "每次反應是總括結構變化，沒有表示完整基元機理、電子箭、分子動力學或速率。",
    "畫面停格只供查看，不能解讀成可任意停止真實反應或穩定保存短命中間體。",
    "催化失活只是本輪條件切換：不給加熱溫度或時間，也不代表任何熱／酸處理都不影響下游。",
    "不包含自由鍵編輯、硫元素電子工作台、自由初值、降解網路、氣味或健康預測。",
    "來源開啟、操作與保存不等於理解、掌握或實驗驗證。"
  ]
};

function deepFreeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
deepFreeze(PINNED);

// Inspect descriptors, then recurse into their data values. Object order is
// irrelevant; every field, array item/order/length and primitive is exact.
function exactSnapshot(actual, expected) {
  if (expected === null || typeof expected !== 'object') {
    if (!Object.is(actual, expected)) throw new TypeError('Unreviewed source value');
    return expected;
  }
  if (actual === null || typeof actual !== 'object') throw new TypeError('Source data object required');
  const isArray = Array.isArray(expected);
  if (Array.isArray(actual) !== isArray) throw new TypeError('Source shape changed');
  const prototype = Object.getPrototypeOf(actual);
  if (isArray ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('Source prototype changed');
  }
  const expectedKeys = Reflect.ownKeys(expected);
  const actualKeys = Reflect.ownKeys(actual);
  if (actualKeys.length !== expectedKeys.length || actualKeys.some(key => typeof key !== 'string' || !expectedKeys.includes(key))) {
    throw new TypeError('Unknown or missing source field');
  }
  const snapshot = isArray ? [] : {};
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(actual, key);
    const expectedDescriptor = Object.getOwnPropertyDescriptor(expected, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== expectedDescriptor.enumerable) {
      throw new TypeError('Source requires own data fields');
    }
    const child = exactSnapshot(descriptor.value, expectedDescriptor.value);
    if (isArray && key === 'length') {
      if (snapshot.length !== child) throw new TypeError('Source array length changed');
    } else {
      Object.defineProperty(snapshot, key, {value: child, enumerable: true, writable: true, configurable: true});
    }
  }
  return Object.freeze(snapshot);
}

/** A detached immutable reviewed snapshot, or null. Caller data is never read
 * after comparison and no caller-owned object is exposed in the result.
 */
export function getGarlicSourceSnapshot(dataset) {
  try { return exactSnapshot(dataset, PINNED); }
  catch { return null; }
}

/** No trusted source or numeric board is returned on any mismatch. */
export function validateGarlicDataset(dataset) {
  const accepted = getGarlicSourceSnapshot(dataset) !== null;
  return deepFreeze({ok: accepted, errors: accepted ? [] : ['SOURCE_DATA_MISMATCH: not the exact reviewed garlic dataset'],
    sourceIdentity: accepted ? GARLIC_DATASET_IDENTITY : null});
}
