// Review candidate revision 2: runtime singular class IDs; original source families retained.

export const FLAVONOID_CLASS_INFO = [
  {
    "id": "chalcone",
    "labelZh": "查耳酮類",
    "labelEn": "Chalcones",
    "representativeId": "naringenin-chalcone",
    "ruleSummary": "開鏈 α,β-不飽和酮連接兩個苯環。",
    "featureRules": [
      "本例沒有封閉的含氧 C 環。",
      "辨認羰基碳、α 碳及 β 碳；不要套用環狀 C2/C3/C4 編號。"
    ],
    "locator": "Flv-2.1.4；Flv-3.3",
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-naringenin-chalcone"
    ],
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.4；Flv-3.3"
      }
    ],
    "foodCaseIds": [
      "food-chalcone"
    ],
    "healthCaseIds": [],
    "healthNotProvided": true,
    "healthBoundary": "本課未提供此類的特定人體效果結論；不等於已證明無效。",
    "sourceFamily": "chalcones"
  },
  {
    "id": "flavone",
    "labelZh": "黃酮類",
    "labelEn": "Flavones",
    "representativeId": "apigenin",
    "ruleSummary": "B 環接 C2，C2=C3 且 C4=O。",
    "featureRules": [
      "本課 flavone 代表 C3 不帶 OH。",
      "A/B 環的 OH 數目不是這組比較的主判據。"
    ],
    "locator": "Flv-2.1.1.2，母體 5",
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-apigenin"
    ],
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.2，母體 5"
      }
    ],
    "foodCaseIds": [
      "food-flavone"
    ],
    "healthCaseIds": [],
    "healthNotProvided": true,
    "healthBoundary": "本課未提供此類的特定人體效果結論；不等於已證明無效。",
    "sourceFamily": "flavones"
  },
  {
    "id": "flavanone",
    "labelZh": "黃烷酮類",
    "labelEn": "Flavanones",
    "representativeId": "s-naringenin",
    "ruleSummary": "B 環接 C2，C2–C3 單鍵且 C4=O。",
    "featureRules": [
      "本課 flavanone 代表 C3 不帶 OH。",
      "此固定代表 C2 為 S；不能把所選構型說成全家族唯一構型。"
    ],
    "locator": "Flv-2.1.1.1；Flv-3.1.1.3 Example 5",
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-s-naringenin"
    ],
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.1；Flv-3.1.1.3 Example 5"
      }
    ],
    "foodCaseIds": [
      "food-flavanone"
    ],
    "healthCaseIds": [],
    "healthNotProvided": true,
    "healthBoundary": "本課未提供此類的特定人體效果結論；不等於已證明無效。",
    "sourceFamily": "flavanones"
  },
  {
    "id": "flavonol",
    "labelZh": "黃酮醇類",
    "labelEn": "Flavonols",
    "representativeId": "quercetin",
    "ruleSummary": "flavone 母體在 C3 帶 OH；糖苷可由此氧連接糖。",
    "featureRules": [
      "苷元同時有 C2=C3、C4=O 與 C3-OH。",
      "isoquercetin 的 C3-O-糖是 flavonol glycoside，不是游離 C3-OH。"
    ],
    "locator": "Flv-2.1.1.2，母體 6；Flv-3.2.1.4",
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-quercetin"
    ],
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.2，母體 6；Flv-3.2.1.4"
      }
    ],
    "foodCaseIds": [
      "food-flavonol"
    ],
    "healthCaseIds": [],
    "healthNotProvided": true,
    "healthBoundary": "本課未提供此類的特定人體效果結論；不等於已證明無效。",
    "sourceFamily": "flavonols"
  },
  {
    "id": "flavanonol",
    "labelZh": "二氫黃酮醇類",
    "labelEn": "Flavanonols (dihydroflavonols)",
    "representativeId": "taxifolin",
    "ruleSummary": "C2–C3 單鍵，C4=O，C3 帶 OH。",
    "featureRules": [
      "與 flavonol 比 C2/C3 飽和度；與 flavan-3-ol 比 C4 羰基。",
      "半系統名用 3-hydroxyflavan-4-one；flavanonol 是本課家族慣用名。"
    ],
    "locator": "Flv-3.1.1.3 Example 7；ChEBI:48039 Definition",
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-taxifolin",
      "flav-source-chebi48039",
      "flav-source-chebi17948"
    ],
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-3.1.1.3 Example 7；ChEBI:48039 Definition"
      },
      {
        "sourceId": "flav-source-chebi48039",
        "locator": "Definition; taxifolin incoming relationship"
      }
    ],
    "foodCaseIds": [
      "food-flavanonol"
    ],
    "healthCaseIds": [],
    "healthNotProvided": true,
    "healthBoundary": "本課未提供此類的特定人體效果結論；不等於已證明無效。",
    "sourceFamily": "flavanonols"
  },
  {
    "id": "isoflavone",
    "labelZh": "異黃酮類",
    "labelEn": "Isoflavones",
    "representativeId": "genistein",
    "ruleSummary": "B 環接 C3，母體有 C2=C3 與 C4=O。",
    "featureRules": [
      "與 apigenin 的關鍵是 B 環連接位置。",
      "螢幕左右擺法不是 C2/C3 的化學編號。"
    ],
    "locator": "Flv-2.1.2.2，母體 9",
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-genistein"
    ],
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.2.2，母體 9"
      }
    ],
    "foodCaseIds": [
      "food-isoflavone"
    ],
    "healthCaseIds": [],
    "healthNotProvided": true,
    "healthBoundary": "本課未提供此類的特定人體效果結論；不等於已證明無效。",
    "sourceFamily": "isoflavones"
  },
  {
    "id": "flavanol",
    "labelZh": "黃烷醇類",
    "labelEn": "Flavanols (flavan-3-ols)",
    "representativeId": "catechin",
    "ruleSummary": "C2–C3 單鍵，C3 帶 OH，沒有 C4 羰基。",
    "featureRules": [
      "不要把 flavanol 與 flavonol 的拼字、母體混用。",
      "本例是 2R,3S 的 (+)-catechin；其他立體異構體不由此被排除出家族。"
    ],
    "locator": "Flv-2.1.1.1，母體 2",
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-catechin"
    ],
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.1，母體 2"
      }
    ],
    "foodCaseIds": [
      "food-flavanol"
    ],
    "healthCaseIds": [
      "health-medium-artifact",
      "health-cosmos-rct"
    ],
    "healthNotProvided": false,
    "healthBoundary": "同類母體只供研究索引；下列研究的受試成分不等於此頁單一結構代表。",
    "sourceFamily": "flavanols"
  },
  {
    "id": "anthocyanidin",
    "labelZh": "花青素苷元類",
    "labelEn": "Anthocyanidins",
    "representativeId": "cyanidin",
    "ruleSummary": "辨認共軛 flavylium 陽離子母體；本例淨形式電荷 +1。",
    "featureRules": [
      "cyanidin 是苷元；相應糖苷 anthocyanins 另須標糖與連接位置。",
      "Kekulé 圖的一組局部雙鍵只是共振表示；不用唯一 C2/C3 鍵級作家族判據。"
    ],
    "locator": "Flv-2.1.1.3；Flv-3.5.1 Example 40；3.5.2 Example 41",
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-cyanidin"
    ],
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.3；Flv-3.5.1 Example 40；3.5.2 Example 41"
      }
    ],
    "foodCaseIds": [
      "food-anthocyanidin"
    ],
    "healthCaseIds": [
      "health-anthocyanin-cohort"
    ],
    "healthNotProvided": false,
    "healthBoundary": "同類母體只供研究索引；下列研究的受試成分不等於此頁單一結構代表。",
    "sourceFamily": "anthocyanidins"
  }
];

export const FLAVONOID_LESSON_SOURCES = [
  {
    "id": "flav-source-ntu114-q4",
    "title": "國立臺灣大學 114 學年度食品化學試題，第 4 題",
    "publisher": "國立臺灣大學圖書館考古題系統",
    "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-257.pdf",
    "type": "official-exam-question",
    "locator": "PDF 第 1 頁第 4 題，10 分；八英文家族名稱已目視核對",
    "claimScope": "確認題目要求共同碳骨架、C 環、雙鍵、羥基、八家族、食物分布與健康影響。",
    "limitations": "原卷未附答案；不能當作分類、健康效應或官方評分依據。",
    "localFile": "sources/ntu-114-257.pdf",
    "sha256": "87f8031d7c661548e24950014cb9bfaff493aa2a86f40389b312fb2fc0de2726",
    "note": "確認題目要求共同碳骨架、C 環、雙鍵、羥基、八家族、食物分布與健康影響。 原卷未附答案；不能當作分類、健康效應或官方評分依據。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/ntu-114-257.pdf"
  },
  {
    "id": "flav-source-iupac2017",
    "title": "Nomenclature of flavonoids (IUPAC Recommendations 2017)",
    "publisher": "IUPAC/IUBMB; Pure and Applied Chemistry 2018, 90(9), 1429–1486",
    "url": "https://iupac.qmul.ac.uk/flavonoid/",
    "type": "nomenclature-recommendation",
    "locator": "Flv-2.1、2.1.1.1–3、2.1.2.2、2.1.4；Flv-3.1.1.3、3.2.1.4、3.3、3.5",
    "claimScope": "所选八類的母體、位置編號、取代與糖苷命名。",
    "limitations": "是命名與結構依據；不證明食物含量或人體健康效應。八類之外還有 aurones、neoflavonoids 等。",
    "localFile": "sources/iupac-flavonoid-nomenclature.html",
    "sha256": "7bee9693718332964460435b8b116651129ff18b460b44e4d48fc5255998280f",
    "note": "所选八類的母體、位置編號、取代與糖苷命名。 是命名與結構依據；不證明食物含量或人體健康效應。八類之外還有 aurones、neoflavonoids 等。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/iupac-flavonoid-nomenclature.html"
  },
  {
    "id": "flav-source-chebi48039",
    "title": "ChEBI:48039 — dihydroflavonols",
    "publisher": "EMBL-EBI ChEBI",
    "url": "https://www.ebi.ac.uk/chebi/CHEBI:48039",
    "type": "curated-chemical-ontology",
    "locator": "Definition；Outgoing relations；Incoming relation taxifolin CHEBI:38747",
    "claimScope": "二氫黃酮醇的 C3-OH 與 flavanone 母體；支持家族可有包含關係。",
    "limitations": "不是全部 flavonoids 的互斥分類樹，也不提供健康因果。",
    "localFile": "sources/chebi-dihydroflavonols.html",
    "sha256": "aeb95953f9e8c5fea39d6628b43e6702016bb05571f748c1a22b6bb1598aa9e8",
    "note": "二氫黃酮醇的 C3-OH 與 flavanone 母體；支持家族可有包含關係。 不是全部 flavonoids 的互斥分類樹，也不提供健康因果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/chebi-dihydroflavonols.html"
  },
  {
    "id": "flav-source-chebi17948",
    "title": "ChEBI:17948 — (+)-taxifolin",
    "publisher": "EMBL-EBI ChEBI",
    "url": "https://www.ebi.ac.uk/chebi/CHEBI:17948",
    "type": "curated-chemical-identity",
    "locator": "Definition；formula/charge/SMILES/InChIKey；IUPAC name",
    "claimScope": "獨立交叉核對 (+)-taxifolin 為 2R,3R 且 InChIKey 與 PubChem 相同。",
    "limitations": "不把其對映異構體或未指定立體的 taxifolin 混為同一固定代表。",
    "localFile": "sources/chebi-plus-taxifolin.html",
    "sha256": "100c0ecb95680cb25c207f9a74ec0577c2a6bef5034061eace3140ede8ca05ab",
    "note": "獨立交叉核對 (+)-taxifolin 為 2R,3R 且 InChIKey 與 PubChem 相同。 不把其對映異構體或未指定立體的 taxifolin 混為同一固定代表。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/chebi-plus-taxifolin.html"
  },
  {
    "id": "flav-source-pubchem-smiles",
    "title": "PubChem glossary and PUG REST — SMILES fields",
    "publisher": "NIH/NLM/NCBI PubChem",
    "url": "https://pubchem.ncbi.nlm.nih.gov/docs/glossary#section=SMILES",
    "type": "official-api-documentation",
    "locator": "Glossary SMILES；PUG REST compound property table",
    "claimScope": "SMILES 含立體與同位素；ConnectivitySMILES 只有連接資訊。",
    "limitations": "canonical 次序依軟體；不同字串必須用分子圖核對，不能把文本位置當原子身份。",
    "localFile": "sources/pubchem-glossary-markdown.md",
    "sha256": "0fe0c7d5cf8c2766daeb0bfbbb087ad60ab734bb34335ac2fcdf9cd6ddda2e97",
    "note": "SMILES 含立體與同位素；ConnectivitySMILES 只有連接資訊。 canonical 次序依軟體；不同字串必須用分子圖核對，不能把文本位置當原子身份。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-glossary-markdown.md"
  },
  {
    "id": "flav-source-pubchem-naringenin-chalcone",
    "title": "PubChem CID 5280960 — Naringenin chalcone",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/5280960",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-naringenin-chalcone-properties.json",
    "caseId": "naringenin-chalcone",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-naringenin-chalcone-2d.json",
      "sha256": "eaca1596cb16bfa64d3e8d4b2fd0b586274eee375d37667e000764f69c75cea6",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280960/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-naringenin-chalcone-2d.sdf",
      "sha256": "56874de918e0766bf1db9b8f6299ac93e576a169447a74330309a162c33bc5c4",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280960/record/SDF?record_type=2d"
    },
    "sha256": "c66582ebeaa8644e08cd7de9f67ad52fd633a2124c34f8862227880d5cb0f0ab",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-naringenin-chalcone-properties.json"
  },
  {
    "id": "flav-source-pubchem-apigenin",
    "title": "PubChem CID 5280443 — Apigenin",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/5280443",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-apigenin-properties.json",
    "caseId": "apigenin",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-apigenin-2d.json",
      "sha256": "4a140b05df619d9858fbffd57f1a76b67f698698619c16d0c1f1894d29b1b77c",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280443/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-apigenin-2d.sdf",
      "sha256": "c2db6e744e5569d900504c86cf45cfea9e5d349bbbcc170c110b103979b647c2",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280443/record/SDF?record_type=2d"
    },
    "sha256": "1ec073f669e3c054abd753349d7eba83fda60c2f27e58b0d3e2224470f7b4181",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-apigenin-properties.json"
  },
  {
    "id": "flav-source-pubchem-s-naringenin",
    "title": "PubChem CID 439246 — (2S)-Naringenin",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/439246",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-s-naringenin-properties.json",
    "caseId": "s-naringenin",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-s-naringenin-2d.json",
      "sha256": "0e866a32822c9f96dd28c57efe9e1ffb249b090035f9bfde56822a8ad714a820",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/439246/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-s-naringenin-2d.sdf",
      "sha256": "10d73253207ccd1e7700d81f70c4989232871ad18ec5d2607d99a0847ff4b98f",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/439246/record/SDF?record_type=2d"
    },
    "sha256": "da5d5feaf3b1564693bb29f3d850bb436f194919b4ba0cda0009971b758a65f0",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-s-naringenin-properties.json"
  },
  {
    "id": "flav-source-pubchem-quercetin",
    "title": "PubChem CID 5280343 — Quercetin",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/5280343",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-quercetin-properties.json",
    "caseId": "quercetin",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-quercetin-2d.json",
      "sha256": "e7d22e81bcdc2cb9499dede0455023fbbc3255f2884ff2229cbdf0e937ca2d93",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280343/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-quercetin-2d.sdf",
      "sha256": "83d6a3018258141263e90140c9fda00c141bdf5667154ea3d4dc8f4930b50562",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280343/record/SDF?record_type=2d"
    },
    "sha256": "3534ba5a1f67d6ecde7654eb2f78ba6a1434033730b582840ba1a94f2584ceb9",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-quercetin-properties.json"
  },
  {
    "id": "flav-source-pubchem-taxifolin",
    "title": "PubChem CID 439533 — (+)-Taxifolin",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/439533",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-taxifolin-properties.json",
    "caseId": "taxifolin",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-taxifolin-2d.json",
      "sha256": "ac819bc98ca2aa10c4754270368906d3d11a23a9a0cf025cc0e8062aa8fddafe",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/439533/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-taxifolin-2d.sdf",
      "sha256": "b0947a0008f618646a55ffba8dd21be9e44c6427887b21d22741813de2119dc3",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/439533/record/SDF?record_type=2d"
    },
    "sha256": "650dbc7c4de4e10615d80780039f8d8ae49d3ab6a9007b9fd1a09c55efd0d7bf",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-taxifolin-properties.json"
  },
  {
    "id": "flav-source-pubchem-genistein",
    "title": "PubChem CID 5280961 — Genistein",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/5280961",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-genistein-properties.json",
    "caseId": "genistein",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-genistein-2d.json",
      "sha256": "3b3b6516887e872ca7be7808ebd8468bc3d15be0074b4c53dc91f42525d3ac13",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280961/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-genistein-2d.sdf",
      "sha256": "bb6f01d078d51de7b0bb971a187a95c064353028cf8023fd4891c97bbb535592",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280961/record/SDF?record_type=2d"
    },
    "sha256": "1a46189257f8167d40d8ede999c233d4eb70d259f590707552927bec8a4d0154",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-genistein-properties.json"
  },
  {
    "id": "flav-source-pubchem-catechin",
    "title": "PubChem CID 9064 — (+)-Catechin",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/9064",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-catechin-properties.json",
    "caseId": "catechin",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-catechin-2d.json",
      "sha256": "21e5c79926237177299fbb3824a5efc430b3c20ad55b1e169ef862451983e841",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/9064/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-catechin-2d.sdf",
      "sha256": "9c7e88c97b341bc49dcc6a5b7168ab8978e9a7b453cfbe17d9aef52b28d2fb3f",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/9064/record/SDF?record_type=2d"
    },
    "sha256": "09b1ff621b3961d4aee3a4f06d024501371790d781d1cc1bd064f48e79bc3cb9",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-catechin-properties.json"
  },
  {
    "id": "flav-source-pubchem-cyanidin",
    "title": "PubChem CID 128861 — Cyanidin (flavylium cation)",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/128861",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-cyanidin-properties.json",
    "caseId": "cyanidin",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-cyanidin-2d.json",
      "sha256": "6730d06509a080cd9ac427c825b512e584f3ed44739d7588f205be573e37a455",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/128861/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-cyanidin-2d.sdf",
      "sha256": "943958dff0278a280488c84867fd453e01ec340b5df632e27c8949c7a8a19547",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/128861/record/SDF?record_type=2d"
    },
    "sha256": "a14f6c7e21595086bc468c73575eb63aa44f5b64e2c582372572ffe117944a83",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-cyanidin-properties.json"
  },
  {
    "id": "flav-source-pubchem-isoquercetin",
    "title": "PubChem CID 5280804 — Isoquercetin (quercetin 3-O-beta-D-glucopyranoside)",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/5280804",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-isoquercetin-properties.json",
    "caseId": "isoquercetin",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-isoquercetin-2d.json",
      "sha256": "5c555ef24791afb9637d690ed33c044f5e7b51f05d719ebe6b1fdab0e53a2676",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280804/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-isoquercetin-2d.sdf",
      "sha256": "897efe03c1db5880117ceae087d5acb9e4f622993aad39bbeadee8f0fce43d27",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280804/record/SDF?record_type=2d"
    },
    "sha256": "7a28cd3119b14a9e853490f096cbace2114996c3199288b0f9c4b0309dcdc8fb",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-isoquercetin-properties.json"
  },
  {
    "id": "flav-source-pubchem-isorhamnetin",
    "title": "PubChem CID 5281654 — Isorhamnetin (3-prime-O-methylquercetin)",
    "publisher": "NIH/NLM/NCBI PubChem; retrieved 2026-10-13",
    "url": "https://pubchem.ncbi.nlm.nih.gov/compound/5281654",
    "type": "chemical-identity-and-computed-depiction",
    "locator": "PUG REST property JSON: SMILES, MolecularFormula, InChIKey, IUPACName, Charge; 2D record JSON/SDF: atoms, bonds, stereo, coordinates",
    "claimScope": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。",
    "limitations": "二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localFile": "sources/pubchem-isorhamnetin-properties.json",
    "caseId": "isorhamnetin",
    "graph": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-isorhamnetin-2d.json",
      "sha256": "eb3b5d3c1da2710d60cd8af995143fb27f0aede1c912c55c8adcd55bda2a1deb",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5281654/record/JSON?record_type=2d",
      "atomLocator": "PC_Compounds[0].atoms (aid is PubChem identifier)",
      "bondLocator": "PC_Compounds[0].bonds",
      "coordinateLocator": "PC_Compounds[0].coords",
      "atomIdsAreRdkitIndices": false
    },
    "sdf": {
      "path": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-isorhamnetin-2d.sdf",
      "sha256": "c154023db8f60b6cc2b18f8cd3c23ad845c54205ec76aac7271ff63e4992dd88",
      "url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5281654/record/SDF?record_type=2d"
    },
    "sha256": "617adc835ebfc94e146616a93a58e042512e4edc450a5c57c14bf63fd5b1d88c",
    "note": "指定化合物的同位素／立體化學形式、電荷、原子與鍵圖。 二維座標是計算描圖；既非溶液唯一構形、反應路徑、食品分析值，也非健康效果。",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/chemistry-sources/sources/pubchem-isorhamnetin-properties.json"
  },
  {
    "id": "food-usda-flav3-3",
    "title": "USDA Database for the Flavonoid Content of Selected Foods, Release 3.3 (2018)",
    "type": "official-food-composition-compilation",
    "url": "https://www.ars.usda.gov/ARSUserFiles/80400525/Data/Flav/Flav3.3.pdf",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/food-health-sources/sources/usda-flavonoids-3-3.pdf",
    "sha256": "1a834af756893054af7c284dd4a1c4eb56e990864ba8243cb2f24cbfe4468e59",
    "locator": "Methods PDF pp.5-7; food tables PDF pp.30, 52, 84, 86, 106-107",
    "year": 2018,
    "accessLevel": "full PDF; relevant table pages visually inspected",
    "publisher": "USDA Agricultural Research Service",
    "note": "已取得內容：full PDF; relevant table pages visually inspected。用途和推論限制依對應 foodCase／healthCase；不可跨成分、樣品狀態或研究族群外推。"
  },
  {
    "id": "food-usda-isoflav2",
    "title": "USDA Database for the Isoflavone Content of Selected Foods, Release 2.0 (2008)",
    "type": "official-food-composition-compilation",
    "url": "https://www.ars.usda.gov/ARSUserFiles/80400525/Data/isoflav/Isoflav_R2.pdf",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/food-health-sources/sources/usda-isoflavones-2.pdf",
    "sha256": "92712ead02bb450aa78cde0361086a75fa7caed3089243d7cdc763052d21b4a2",
    "locator": "Methods PDF pp.3-4; tofu NDB 16427, PDF p.32 / printed p.30",
    "year": 2008,
    "accessLevel": "full PDF; tofu page visually inspected",
    "publisher": "USDA Agricultural Research Service",
    "note": "已取得內容：full PDF; tofu page visually inspected。用途和推論限制依對應 foodCase／healthCase；不可跨成分、樣品狀態或研究族群外推。"
  },
  {
    "id": "food-adato2009",
    "title": "Adato et al. Fruit-Surface Flavonoid Accumulation in Tomato Is Controlled by a SlMYB12-Regulated Transcriptional Network",
    "type": "primary-plant-composition-study",
    "url": "https://doi.org/10.1371/journal.pgen.1000777",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/food-health-sources/sources/adato-2009.pdf",
    "sha256": "de0de9f86c3ed728cdf6adef476fc73db2936be374086b48457ac46d7a102be7",
    "locator": "Abstract p.1; results metabolite profiling, Table 2 / Figure 5; targeted cuticle analysis",
    "year": 2009,
    "accessLevel": "full PDF and publisher HTML; presence claim only",
    "doi": "10.1371/journal.pgen.1000777",
    "publisher": "原始研究（2009）；來源擷取 2026-10-13",
    "note": "已取得內容：full PDF and publisher HTML; presence claim only。用途和推論限制依對應 foodCase／healthCase；不可跨成分、樣品狀態或研究族群外推。"
  },
  {
    "id": "food-serni2022",
    "title": "Serni et al. Characterization of phenolic profile in dried grape skin of Vitis vinifera L. cv. Pinot Blanc with UHPLC-MS/MS and its development during ripening",
    "type": "primary-food-composition-study",
    "url": "https://doi.org/10.1016/j.jfca.2022.104731",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/food-health-sources/sources/serni-2022-pinot-blanc-attempt2.pdf",
    "sha256": "90ef2768347737763228c6401cc47ac75ff05e7102f1d5f617023eb8e221b89b",
    "locator": "Methods pp.2-4; astilbin identification p.5; Table 2 p.6; Figure 3 p.9",
    "year": 2022,
    "accessLevel": "full PDF from research-institution asset host",
    "doi": "10.1016/j.jfca.2022.104731",
    "publisher": "原始研究（2022）；來源擷取 2026-10-13",
    "note": "已取得內容：full PDF from research-institution asset host。用途和推論限制依對應 foodCase／healthCase；不可跨成分、樣品狀態或研究族群外推。"
  },
  {
    "id": "health-long2000",
    "title": "Long, Clement & Halliwell. Artifacts in cell culture: rapid generation of hydrogen peroxide on addition of polyphenols to commonly used cell culture media",
    "type": "primary-in-vitro-chemistry",
    "url": "https://pubmed.ncbi.nlm.nih.gov/10873562/",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/food-health-sources/sources/long-2000-core.json",
    "sha256": "fb3226ef2ceb875014f9b8ebee090c3ced36e9d26090a130d1d21b98ec4d2fb7",
    "locator": "Author abstract, sentence on Dulbecco's modified Eagle medium; Europe PMC record abstractText",
    "year": 2000,
    "accessLevel": "author abstract only, via Europe PMC bibliographic record; full paper not inspected",
    "doi": "10.1006/bbrc.2000.2895",
    "pmid": "10873562",
    "publisher": "原始研究（2000）；來源擷取 2026-10-13",
    "note": "已取得內容：author abstract only, via Europe PMC bibliographic record; full paper not inspected。用途和推論限制依對應 foodCase／healthCase；不可跨成分、樣品狀態或研究族群外推。"
  },
  {
    "id": "health-cassidy2013",
    "title": "Cassidy et al. High anthocyanin intake is associated with a reduced risk of myocardial infarction in young and middle-aged women",
    "type": "primary-prospective-cohort",
    "url": "https://pubmed.ncbi.nlm.nih.gov/23319811/",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/food-health-sources/sources/cassidy-2013-core.json",
    "sha256": "ef52aa7a99089c6911394dcfd05b0142cbe78eb729dcb4fee7a273004d2442c6",
    "locator": "Author abstract: Methods and results; exposure, cohort and adjusted HR",
    "year": 2013,
    "accessLevel": "author abstract verified in Europe PMC; indexed primary body also read; full local PDF unavailable",
    "doi": "10.1161/CIRCULATIONAHA.112.122408",
    "pmid": "23319811",
    "publisher": "原始研究（2013）；來源擷取 2026-10-13",
    "note": "已取得內容：author abstract verified in Europe PMC; indexed primary body also read; full local PDF unavailable。用途和推論限制依對應 foodCase／healthCase；不可跨成分、樣品狀態或研究族群外推。"
  },
  {
    "id": "health-cosmos2022",
    "title": "Sesso et al. Effect of cocoa flavanol supplementation for the prevention of cardiovascular disease events: COSMOS randomized clinical trial",
    "type": "primary-randomized-clinical-trial",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9170467/",
    "localSnapshot": "output/flavonoid-structure-2026-10-13/food-health-sources/sources/cosmos-2022-attempt2.xml",
    "sha256": "70efd028f0d3b7a2b49a57691c0ee640791f19404a0a7ed5c879510e53a752a0",
    "locator": "Abstract; Methods: Primary and secondary trial outcomes / Statistical analyses; Results; Discussion limitations",
    "year": 2022,
    "accessLevel": "full primary paper JATS XML from Europe PMC",
    "doi": "10.1093/ajcn/nqac055",
    "pmid": "35294962",
    "publisher": "原始研究（2022）；來源擷取 2026-10-13",
    "note": "已取得內容：full primary paper JATS XML from Europe PMC。用途和推論限制依對應 foodCase／healthCase；不可跨成分、樣品狀態或研究族群外推。"
  }
];

export const FLAVONOID_FOOD_CASES = [
  {
    "id": "food-chalcone",
    "classId": "chalcone",
    "foodZh": "番茄果皮",
    "compound": "naringenin chalcone",
    "form": "開鏈 chalcone；與環化後的 naringenin 分開辨識",
    "statement": "原始番茄基因型比較研究在一般型果皮偵測 naringenin chalcone；無色果皮 y 變異的此色素缺失。",
    "measurement": null,
    "sourceIds": [
      "food-adato2009"
    ],
    "locator": "Abstract p.1; metabolite-profiling results; Table 2 and Figure 5",
    "caveat": "品種與成熟度影響組成；本課只提供具名存在證據，不把文中引用的角質層乾重百分比當作整顆番茄食品濃度。",
    "healthBoundary": "本食品分析只支持分布與成分量，不能單憑此值推論人體療效。",
    "representativeId": "naringenin-chalcone",
    "measurementStatus": "qualitative-presence-only",
    "sourceClassId": "chalcone",
    "evidenceRefs": [
      {
        "sourceId": "food-adato2009",
        "locator": "Abstract p.1; metabolite-profiling results; Table 2 and Figure 5"
      }
    ],
    "label": "番茄果皮",
    "boundedSummary": "原始番茄基因型比較研究在一般型果皮偵測 naringenin chalcone；無色果皮 y 變異的此色素缺失。 形式：開鏈 chalcone；與環化後的 naringenin 分開辨識。品種與成熟度影響組成；本課只提供具名存在證據，不把文中引用的角質層乾重百分比當作整顆番茄食品濃度。",
    "sourceFamily": "chalcones"
  },
  {
    "id": "food-flavone",
    "classId": "flavone",
    "foodZh": "新鮮巴西里（parsley）",
    "compound": "apigenin",
    "form": "苷元換算值",
    "statement": "新鮮巴西里可作為 apigenin 類 flavone 的食品例。",
    "measurement": {
      "value": 215.46,
      "unit": "mg/100 g",
      "basis": "可食部鮮重；苷元換算",
      "n": 26,
      "min": 0.0,
      "max": 630.0,
      "uncertainty": 36.08,
      "uncertaintyType": "SEM",
      "confidenceCode": "B"
    },
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 11297; PDF p.86 / printed p.83; Apigenin row",
    "caveat": "USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 100 g 是報告基準，不是建議攝取量；不同來源變異很大。",
    "healthBoundary": "本食品分析只支持分布與成分量，不能單憑此值推論人體療效。",
    "representativeId": "apigenin",
    "sourceClassId": "flavone",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 11297; PDF p.86 / printed p.83; Apigenin row"
      }
    ],
    "label": "新鮮巴西里（parsley）",
    "boundedSummary": "新鮮巴西里可作為 apigenin 類 flavone 的食品例。 形式：苷元換算值。USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 100 g 是報告基準，不是建議攝取量；不同來源變異很大。",
    "sourceFamily": "flavones"
  },
  {
    "id": "food-flavanone",
    "classId": "flavanone",
    "foodZh": "生甜橙（各商業品種）",
    "compound": "naringenin",
    "form": "苷元換算值；本資料不提供對映異構體比例",
    "statement": "USDA 生甜橙資料列有 naringenin 類 flavanone。",
    "measurement": {
      "value": 15.32,
      "unit": "mg/100 g",
      "basis": "可食部鮮重；苷元換算",
      "n": 22,
      "min": 3.65,
      "max": 45.42,
      "uncertainty": 1.76,
      "uncertaintyType": "SEM",
      "confidenceCode": "B"
    },
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 09200; PDF p.52 / printed p.49; Naringenin row",
    "caveat": "USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 不把食品分析名稱自動解讀為單一純 (2S)-naringenin 暴露。",
    "healthBoundary": "本食品分析只支持分布與成分量，不能單憑此值推論人體療效。",
    "representativeId": "s-naringenin",
    "sourceClassId": "flavanone",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 09200; PDF p.52 / printed p.49; Naringenin row"
      }
    ],
    "label": "生甜橙（各商業品種）",
    "boundedSummary": "USDA 生甜橙資料列有 naringenin 類 flavanone。 形式：苷元換算值；本資料不提供對映異構體比例。USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 不把食品分析名稱自動解讀為單一純 (2S)-naringenin 暴露。",
    "sourceFamily": "flavanones"
  },
  {
    "id": "food-flavonol",
    "classId": "flavonol",
    "foodZh": "生洋蔥",
    "compound": "quercetin",
    "form": "苷元換算值",
    "statement": "生洋蔥資料含 quercetin 類 flavonol。",
    "measurement": {
      "value": 20.3,
      "unit": "mg/100 g",
      "basis": "可食部鮮重；苷元換算",
      "n": 400,
      "min": 1.5,
      "max": 90.75,
      "uncertainty": 0.78,
      "uncertaintyType": "SEM",
      "confidenceCode": "A"
    },
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 11282; PDF p.84 / printed p.81; Quercetin row",
    "caveat": "USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 不以此庫不同批次的生／熟食品均值直接估算烹煮損失。",
    "healthBoundary": "本食品分析只支持分布與成分量，不能單憑此值推論人體療效。",
    "representativeId": "quercetin",
    "sourceClassId": "flavonol",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 11282; PDF p.84 / printed p.81; Quercetin row"
      }
    ],
    "label": "生洋蔥",
    "boundedSummary": "生洋蔥資料含 quercetin 類 flavonol。 形式：苷元換算值。USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 不以此庫不同批次的生／熟食品均值直接估算烹煮損失。",
    "sourceFamily": "flavonols"
  },
  {
    "id": "food-flavanonol",
    "classId": "flavanonol",
    "foodZh": "Pinot Blanc 白葡萄的乾燥果皮",
    "compound": "astilbin（taxifolin-3-O-rhamnoside）",
    "form": "flavanonol 糖苷；與互動代表 taxifolin 苷元分開",
    "statement": "UHPLC-MS/MS 以標準品確認 astilbin；成熟採樣點果皮乾重平均 754.2 mg/kg。",
    "measurement": {
      "value": 754.2,
      "unit": "mg/kg dry weight",
      "basis": "分離、乾燥葡萄皮；不是整顆鮮葡萄",
      "n": 5,
      "min": null,
      "max": null,
      "uncertainty": 252.4,
      "uncertaintyType": "reported ± value; Table 2 does not explicitly label its dispersion statistic",
      "samplingDayOfYear": 246,
      "harvestYear": 2018
    },
    "sourceIds": [
      "food-serni2022"
    ],
    "locator": "Identity p.5; Table 2 p.6, Astilbin row, sampling 7 / DOY 246; unit definition p.4",
    "caveat": "單一義大利葡萄園、2018 年；36 組樣本跨 7 時點。數值是 astilbin 糖苷，不可直接貼到游離 taxifolin 或鮮果；Table 2 的 ± 定義未在表內明示，故不擅標 SD 或 SEM。",
    "healthBoundary": "本食品分析只支持分布與成分量，不能單憑此值推論人體療效。",
    "representativeId": "taxifolin",
    "sourceClassId": "flavanonol",
    "evidenceRefs": [
      {
        "sourceId": "food-serni2022",
        "locator": "Identity p.5; Table 2 p.6, Astilbin row, sampling 7 / DOY 246; unit definition p.4"
      }
    ],
    "label": "Pinot Blanc 白葡萄的乾燥果皮",
    "boundedSummary": "UHPLC-MS/MS 以標準品確認 astilbin；成熟採樣點果皮乾重平均 754.2 mg/kg。 形式：flavanonol 糖苷；與互動代表 taxifolin 苷元分開。單一義大利葡萄園、2018 年；36 組樣本跨 7 時點。數值是 astilbin 糖苷，不可直接貼到游離 taxifolin 或鮮果；Table 2 的 ± 定義未在表內明示，故不擅標 SD 或 SEM。",
    "sourceFamily": "flavanonols"
  },
  {
    "id": "food-isoflavone",
    "classId": "isoflavone",
    "foodZh": "硫酸鈣製一般生豆腐",
    "compound": "genistein",
    "form": "苷元換算值",
    "statement": "豆腐可作為 genistein 類 isoflavone 的食品例。",
    "measurement": {
      "value": 12.99,
      "unit": "mg/100 g",
      "basis": "可食部鮮重；苷元換算",
      "n": 10,
      "min": 2.89,
      "max": 18.66,
      "uncertainty": 4.19,
      "uncertaintyType": "SD",
      "confidenceCode": "B"
    },
    "sourceIds": [
      "food-usda-isoflav2"
    ],
    "locator": "NDB 16427; PDF p.32 / printed p.30; Genistein row",
    "caveat": "USDA 異黃酮庫將 glucoside 換算為各自苷元後彙整；此表誤差欄是 SD，與 flavonoid 庫的 SEM 不同。不是所有豆腐製程共用一個固定含量。",
    "healthBoundary": "本食品分析只支持分布與成分量，不能單憑此值推論人體療效。",
    "representativeId": "genistein",
    "sourceClassId": "isoflavone",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-isoflav2",
        "locator": "NDB 16427; PDF p.32 / printed p.30; Genistein row"
      }
    ],
    "label": "硫酸鈣製一般生豆腐",
    "boundedSummary": "豆腐可作為 genistein 類 isoflavone 的食品例。 形式：苷元換算值。USDA 異黃酮庫將 glucoside 換算為各自苷元後彙整；此表誤差欄是 SD，與 flavonoid 庫的 SEM 不同。不是所有豆腐製程共用一個固定含量。",
    "sourceFamily": "isoflavones"
  },
  {
    "id": "food-flavanol",
    "classId": "flavanol",
    "foodZh": "以自來水沖泡的紅茶",
    "compound": "(+)-catechin",
    "form": "flavan-3-ol 單體；此列沒有糖苷換算",
    "statement": "USDA 沖泡紅茶資料含 (+)-catechin。",
    "measurement": {
      "value": 1.51,
      "unit": "mg/100 g infusion",
      "basis": "茶湯；資料統一至 1% 沖泡濃度（1 g 茶葉/100 mL 水）",
      "n": 55,
      "min": 0.35,
      "max": 4.79,
      "uncertainty": 0.07,
      "uncertaintyType": "SEM",
      "confidenceCode": "B"
    },
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 14355, spans PDF pp.106-107 / printed pp.103-104; (+)-Catechin row on p.107; preparation normalization PDF p.6",
    "caveat": "不是乾茶葉每 100 g，也不是任意泡法的一杯茶。Catechin 單體不可和 proanthocyanidin 聚合物或可可抽出物總 flavanols 混用。",
    "healthBoundary": "本食品分析只支持分布與成分量，不能單憑此值推論人體療效。",
    "representativeId": "catechin",
    "sourceClassId": "flavanol",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 14355, spans PDF pp.106-107 / printed pp.103-104; (+)-Catechin row on p.107; preparation normalization PDF p.6"
      }
    ],
    "label": "以自來水沖泡的紅茶",
    "boundedSummary": "USDA 沖泡紅茶資料含 (+)-catechin。 形式：flavan-3-ol 單體；此列沒有糖苷換算。不是乾茶葉每 100 g，也不是任意泡法的一杯茶。Catechin 單體不可和 proanthocyanidin 聚合物或可可抽出物總 flavanols 混用。",
    "sourceFamily": "flavanols"
  },
  {
    "id": "food-anthocyanidin",
    "classId": "anthocyanidin",
    "foodZh": "栽培高叢藍莓（生）",
    "compound": "cyanidin",
    "form": "食品 anthocyanins 以 cyanidin 苷元換算",
    "statement": "高叢藍莓資料有 cyanidin 類色素的苷元換算量。",
    "measurement": {
      "value": 8.46,
      "unit": "mg/100 g",
      "basis": "可食部鮮重；苷元換算",
      "n": 55,
      "min": 0.5,
      "max": 73.86,
      "uncertainty": 1.79,
      "uncertaintyType": "SEM",
      "confidenceCode": "B"
    },
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 09050; PDF p.30 / printed p.27; Cyanidin row",
    "caveat": "食品主要以 anthocyanin 糖苷等形式存在；此值不是游離 cyanidin、不是所有花青素總量，也不代表人體吸收量。",
    "healthBoundary": "本食品分析只支持分布與成分量，不能單憑此值推論人體療效。",
    "representativeId": "cyanidin",
    "sourceClassId": "anthocyanidin",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 09050; PDF p.30 / printed p.27; Cyanidin row"
      }
    ],
    "label": "栽培高叢藍莓（生）",
    "boundedSummary": "高叢藍莓資料有 cyanidin 類色素的苷元換算量。 形式：食品 anthocyanins 以 cyanidin 苷元換算。食品主要以 anthocyanin 糖苷等形式存在；此值不是游離 cyanidin、不是所有花青素總量，也不代表人體吸收量。",
    "sourceFamily": "anthocyanidins"
  }
];

export const FLAVONOID_HEALTH_CASES = [
  {
    "id": "health-medium-artifact",
    "stage": "in-vitro",
    "stageZh": "體外化學／機制限制",
    "classIds": [
      "flavanol"
    ],
    "title": "培養液本身會改變氧化還原結果",
    "compound": "(-)-epigallocatechin (EGC) 與 (-)-epigallocatechin gallate (EGCG)",
    "exposure": "分別加入 1 mM（1000 μM）；2 小時內觀察。",
    "systemOrPopulation": "Dulbecco's modified Eagle medium（DMEM）培養液；不是人體試驗。",
    "endpoint": "培養液中 H₂O₂ 濃度",
    "result": "原文摘要報告：上述條件下 H₂O₂ 可達 >400 μM。",
    "limits": [
      "這是培養液化學反應的量測，不能推成喝茶後人體有同濃度、同效果。",
      "這個數值對應 EGC／EGCG；不可改貼為 (+)-catechin 或 quercetin 的 >400 μM。摘要對後兩者只描述較低但仍可觀的 H₂O₂。",
      "只有原始摘要已核讀；全方法、重複數、完整濃度曲線在本課保留未知。",
      "體外抗氧化／促氧化反應具有系統依賴性，不能直接等同疾病風險或人體療效。"
    ],
    "numericEvidence": {
      "inputConcentration": 1,
      "inputUnit": "mM",
      "timeWithinHours": 2,
      "h2o2LowerBound": 400,
      "h2o2Unit": "μM",
      "comparison": ">",
      "replicateN": null
    },
    "sourceIds": [
      "health-long2000"
    ],
    "locator": "Author abstract; DMEM quantitative sentence (PMID 10873562).",
    "inferenceBoundary": "同類分子與不同系統不能自動共用作用強度；此例不提供人體健康效益結論。",
    "sourceClassIds": [
      "flavanol"
    ],
    "evidenceRefs": [
      {
        "sourceId": "health-long2000",
        "locator": "Author abstract; DMEM quantitative sentence (PMID 10873562)."
      }
    ],
    "testedSubstanceIsDisplayedRepresentative": false,
    "boundedSummary": "(-)-epigallocatechin (EGC) 與 (-)-epigallocatechin gallate (EGCG)；Dulbecco's modified Eagle medium（DMEM）培養液；不是人體試驗。 分別加入 1 mM（1000 μM）；2 小時內觀察。 終點：培養液中 H₂O₂ 濃度。原文摘要報告：上述條件下 H₂O₂ 可達 >400 μM。 同類分子與不同系統不能自動共用作用強度；此例不提供人體健康效益結論。",
    "sourceFamilies": [
      "flavanols"
    ]
  },
  {
    "id": "health-anthocyanin-cohort",
    "stage": "observational",
    "stageZh": "人體觀察關聯",
    "classIds": [
      "anthocyanidin"
    ],
    "title": "飲食花青素攝取與心肌梗塞關聯",
    "compound": "飲食 anthocyanins 類別估計；不是單一 cyanidin 苷元製劑",
    "exposure": "食物頻率問卷每 4 年更新，比較花青素攝取量最高與最低五分位；沒有指定介入劑量。",
    "systemOrPopulation": "Nurses' Health Study II：93,600 名女性，1989 年入組年齡 25–42 歲；追蹤 18 年。",
    "endpoint": "新發心肌梗塞（MI）",
    "result": "405 例 MI；多變項調整後最高對最低五分位 HR 0.68，95% CI 0.49–0.96，P = 0.03。",
    "limits": [
      "觀察性資料仍可能有殘餘混雜與飲食測量誤差，不能宣稱因果。",
      "研究暴露是飲食類別估計，不是 pure cyanidin 或本頁任一單一分子的功效。",
      "族群與終點有限，不能推為所有人、所有疾病或所有 flavonoids 的共同效應。",
      "本封包未取得可完整檢視的原表五分位攝取中位數；以最高／最低五分位呈現，不補造 mg/day 劑量。"
    ],
    "numericEvidence": {
      "n": 93600,
      "baselineYear": 1989,
      "ageMin": 25,
      "ageMax": 42,
      "followUpYears": 18,
      "events": 405,
      "hr": 0.68,
      "ci95": [
        0.49,
        0.96
      ],
      "p": 0.03,
      "doseMgPerDay": null,
      "doseReason": "observational exposure quintiles, not administered dose; exact quintile medians not verified in retained full table"
    },
    "sourceIds": [
      "health-cassidy2013"
    ],
    "locator": "Author abstract, Methods and results (PMID 23319811); do not relabel the reported P = 0.03 as P for trend.",
    "inferenceBoundary": "支持該族群的攝取關聯；不能改寫為花青素已被證實預防心肌梗塞。",
    "sourceClassIds": [
      "anthocyanidin"
    ],
    "evidenceRefs": [
      {
        "sourceId": "health-cassidy2013",
        "locator": "Author abstract, Methods and results (PMID 23319811); do not relabel the reported P = 0.03 as P for trend."
      }
    ],
    "testedSubstanceIsDisplayedRepresentative": false,
    "boundedSummary": "飲食 anthocyanins 類別估計；不是單一 cyanidin 苷元製劑；Nurses' Health Study II：93,600 名女性，1989 年入組年齡 25–42 歲；追蹤 18 年。 食物頻率問卷每 4 年更新，比較花青素攝取量最高與最低五分位；沒有指定介入劑量。 終點：新發心肌梗塞（MI）。405 例 MI；多變項調整後最高對最低五分位 HR 0.68，95% CI 0.49–0.96，P = 0.03。 支持該族群的攝取關聯；不能改寫為花青素已被證實預防心肌梗塞。",
    "sourceFamilies": [
      "anthocyanidins"
    ]
  },
  {
    "id": "health-cosmos-rct",
    "stage": "rct",
    "stageZh": "人體隨機試驗",
    "classIds": [
      "flavanol"
    ],
    "title": "可可抽出物試驗：先看主要終點",
    "compound": "可可抽出物；每日總 cocoa flavanols 500 mg，含 (-)-epicatechin 80 mg",
    "exposure": "每日 2 顆膠囊；隨機、雙盲、安慰劑對照、2×2 因子試驗；依原隨機組別分析。",
    "systemOrPopulation": "21,442 名美國成人：女性 12,666 名 ≥65 歲；男性 8,776 名 ≥60 歲。",
    "endpoint": "主要終點為總心血管事件複合終點：MI、stroke、coronary revascularization、CVD death、carotid artery surgery、peripheral artery surgery、需住院的 unstable angina。",
    "result": "追蹤中位數 3.6 年；可可組 410 例、安慰劑組 456 例；HR 0.90，95% CI 0.78–1.02，P = 0.11。主要終點未達統計顯著差異。",
    "limits": [
      "不能宣稱主要結果已證實降低心血管風險；不顯著也不能宣稱確定完全無作用。",
      "次要 CVD death 結果 HR 0.73（95% CI 0.54–0.98）需視為次要：多重比較未校正，不能取代主要終點。",
      "測試的是含其他成分的可可抽出物，不是單一 epicatechin、catechin，也不是巧克力的一般食用效果。",
      "結果限於此劑量、族群與期間；本課不能擴為所有 flavanols 的共同療效。",
      "主複合終點較原先四項擴增；原文明示因整體事件率較預期低而加入頸動脈／周邊動脈手術與不穩定心絞痛住院。"
    ],
    "numericEvidence": {
      "n": 21442,
      "womenN": 12666,
      "menN": 8776,
      "doseFlavanolsMgPerDay": 500,
      "includedEpicatechinMgPerDay": 80,
      "followUpMedianYears": 3.6,
      "eventsActive": 410,
      "eventsPlacebo": 456,
      "hr": 0.9,
      "ci95": [
        0.78,
        1.02
      ],
      "p": 0.11,
      "analysis": "intention-to-treat",
      "secondaryCvdDeathHr": 0.73,
      "secondaryCvdDeathCi95": [
        0.54,
        0.98
      ],
      "secondaryMultiplicityAdjusted": false
    },
    "sourceIds": [
      "health-cosmos2022"
    ],
    "locator": "Abstract; Methods: Primary and secondary trial outcomes / Statistical analyses; Results; Discussion limitations (PMCID PMC9170467).",
    "inferenceBoundary": "主要終點沒有足夠證據宣稱益處；此結論本身不能轉成八類全體無效。",
    "sourceClassIds": [
      "flavanol"
    ],
    "evidenceRefs": [
      {
        "sourceId": "health-cosmos2022",
        "locator": "Abstract; Methods: Primary and secondary trial outcomes / Statistical analyses; Results; Discussion limitations (PMCID PMC9170467)."
      }
    ],
    "testedSubstanceIsDisplayedRepresentative": false,
    "boundedSummary": "可可抽出物；每日總 cocoa flavanols 500 mg，含 (-)-epicatechin 80 mg；21,442 名美國成人：女性 12,666 名 ≥65 歲；男性 8,776 名 ≥60 歲。 每日 2 顆膠囊；隨機、雙盲、安慰劑對照、2×2 因子試驗；依原隨機組別分析。 終點：主要終點為總心血管事件複合終點：MI、stroke、coronary revascularization、CVD death、carotid artery surgery、peripheral artery surgery、需住院的 unstable angina。。追蹤中位數 3.6 年；可可組 410 例、安慰劑組 456 例；HR 0.90，95% CI 0.78–1.02，P = 0.11。主要終點未達統計顯著差異。 主要終點沒有足夠證據宣稱益處；此結論本身不能轉成八類全體無效。",
    "sourceFamilies": [
      "flavanols"
    ]
  }
];

export const FLAVONOID_CLAIMS = [
  {
    "id": "claim-structure-chalcones",
    "text": "開鏈 α,β-不飽和酮連接兩個苯環。",
    "type": "structure-classification",
    "classIds": [
      "chalcone"
    ],
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-naringenin-chalcone"
    ],
    "locator": "Flv-2.1.4；Flv-3.3",
    "boundary": "限定本課具名結構與母體判讀；不作任意分子的通用分類，也不推反應或健康效果。",
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.4；Flv-3.3"
      }
    ],
    "sourceFamilies": [
      "chalcones"
    ]
  },
  {
    "id": "claim-structure-flavones",
    "text": "B 環接 C2，C2=C3 且 C4=O。",
    "type": "structure-classification",
    "classIds": [
      "flavone"
    ],
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-apigenin"
    ],
    "locator": "Flv-2.1.1.2，母體 5",
    "boundary": "限定本課具名結構與母體判讀；不作任意分子的通用分類，也不推反應或健康效果。",
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.2，母體 5"
      }
    ],
    "sourceFamilies": [
      "flavones"
    ]
  },
  {
    "id": "claim-structure-flavanones",
    "text": "B 環接 C2，C2–C3 單鍵且 C4=O。",
    "type": "structure-classification",
    "classIds": [
      "flavanone"
    ],
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-s-naringenin"
    ],
    "locator": "Flv-2.1.1.1；Flv-3.1.1.3 Example 5",
    "boundary": "限定本課具名結構與母體判讀；不作任意分子的通用分類，也不推反應或健康效果。",
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.1；Flv-3.1.1.3 Example 5"
      }
    ],
    "sourceFamilies": [
      "flavanones"
    ]
  },
  {
    "id": "claim-structure-flavonols",
    "text": "flavone 母體在 C3 帶 OH；糖苷可由此氧連接糖。",
    "type": "structure-classification",
    "classIds": [
      "flavonol"
    ],
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-quercetin"
    ],
    "locator": "Flv-2.1.1.2，母體 6；Flv-3.2.1.4",
    "boundary": "限定本課具名結構與母體判讀；不作任意分子的通用分類，也不推反應或健康效果。",
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.2，母體 6；Flv-3.2.1.4"
      }
    ],
    "sourceFamilies": [
      "flavonols"
    ]
  },
  {
    "id": "claim-structure-flavanonols",
    "text": "C2–C3 單鍵，C4=O，C3 帶 OH。",
    "type": "structure-classification",
    "classIds": [
      "flavanonol"
    ],
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-taxifolin",
      "flav-source-chebi48039",
      "flav-source-chebi17948"
    ],
    "locator": "Flv-3.1.1.3 Example 7；ChEBI:48039 Definition",
    "boundary": "限定本課具名結構與母體判讀；不作任意分子的通用分類，也不推反應或健康效果。",
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-3.1.1.3 Example 7；ChEBI:48039 Definition"
      },
      {
        "sourceId": "flav-source-chebi48039",
        "locator": "Definition; taxifolin incoming relationship"
      }
    ],
    "sourceFamilies": [
      "flavanonols"
    ]
  },
  {
    "id": "claim-structure-isoflavones",
    "text": "B 環接 C3，母體有 C2=C3 與 C4=O。",
    "type": "structure-classification",
    "classIds": [
      "isoflavone"
    ],
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-genistein"
    ],
    "locator": "Flv-2.1.2.2，母體 9",
    "boundary": "限定本課具名結構與母體判讀；不作任意分子的通用分類，也不推反應或健康效果。",
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.2.2，母體 9"
      }
    ],
    "sourceFamilies": [
      "isoflavones"
    ]
  },
  {
    "id": "claim-structure-flavanols",
    "text": "C2–C3 單鍵，C3 帶 OH，沒有 C4 羰基。",
    "type": "structure-classification",
    "classIds": [
      "flavanol"
    ],
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-catechin"
    ],
    "locator": "Flv-2.1.1.1，母體 2",
    "boundary": "限定本課具名結構與母體判讀；不作任意分子的通用分類，也不推反應或健康效果。",
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.1，母體 2"
      }
    ],
    "sourceFamilies": [
      "flavanols"
    ]
  },
  {
    "id": "claim-structure-anthocyanidins",
    "text": "辨認共軛 flavylium 陽離子母體；本例淨形式電荷 +1。",
    "type": "structure-classification",
    "classIds": [
      "anthocyanidin"
    ],
    "sourceIds": [
      "flav-source-iupac2017",
      "flav-source-pubchem-cyanidin"
    ],
    "locator": "Flv-2.1.1.3；Flv-3.5.1 Example 40；3.5.2 Example 41",
    "boundary": "限定本課具名結構與母體判讀；不作任意分子的通用分類，也不推反應或健康效果。",
    "evidenceRefs": [
      {
        "sourceId": "flav-source-iupac2017",
        "locator": "Flv-2.1.1.3；Flv-3.5.1 Example 40；3.5.2 Example 41"
      }
    ],
    "sourceFamilies": [
      "anthocyanidins"
    ]
  },
  {
    "id": "claim-food-chalcone",
    "text": "原始番茄基因型比較研究在一般型果皮偵測 naringenin chalcone；無色果皮 y 變異的此色素缺失。",
    "type": "food-distribution",
    "sourceIds": [
      "food-adato2009"
    ],
    "locator": "Abstract p.1; metabolite-profiling results; Table 2 and Figure 5",
    "boundary": "品種與成熟度影響組成；本課只提供具名存在證據，不把文中引用的角質層乾重百分比當作整顆番茄食品濃度。",
    "evidenceRefs": [
      {
        "sourceId": "food-adato2009",
        "locator": "Abstract p.1; metabolite-profiling results; Table 2 and Figure 5"
      }
    ],
    "boundedText": "原始番茄基因型比較研究在一般型果皮偵測 naringenin chalcone；無色果皮 y 變異的此色素缺失。 品種與成熟度影響組成；本課只提供具名存在證據，不把文中引用的角質層乾重百分比當作整顆番茄食品濃度。"
  },
  {
    "id": "claim-food-flavone",
    "text": "新鮮巴西里可作為 apigenin 類 flavone 的食品例。",
    "type": "food-distribution",
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 11297; PDF p.86 / printed p.83; Apigenin row",
    "boundary": "USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 100 g 是報告基準，不是建議攝取量；不同來源變異很大。",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 11297; PDF p.86 / printed p.83; Apigenin row"
      }
    ],
    "boundedText": "新鮮巴西里可作為 apigenin 類 flavone 的食品例。 USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 100 g 是報告基準，不是建議攝取量；不同來源變異很大。"
  },
  {
    "id": "claim-food-flavanone",
    "text": "USDA 生甜橙資料列有 naringenin 類 flavanone。",
    "type": "food-distribution",
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 09200; PDF p.52 / printed p.49; Naringenin row",
    "boundary": "USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 不把食品分析名稱自動解讀為單一純 (2S)-naringenin 暴露。",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 09200; PDF p.52 / printed p.49; Naringenin row"
      }
    ],
    "boundedText": "USDA 生甜橙資料列有 naringenin 類 flavanone。 USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 不把食品分析名稱自動解讀為單一純 (2S)-naringenin 暴露。"
  },
  {
    "id": "claim-food-flavonol",
    "text": "生洋蔥資料含 quercetin 類 flavonol。",
    "type": "food-distribution",
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 11282; PDF p.84 / printed p.81; Quercetin row",
    "boundary": "USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 不以此庫不同批次的生／熟食品均值直接估算烹煮損失。",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 11282; PDF p.84 / printed p.81; Quercetin row"
      }
    ],
    "boundedText": "生洋蔥資料含 quercetin 類 flavonol。 USDA 以分子量比將已報糖苷換算為苷元，彙整為可食部鮮重基準；不是游離苷元的實際含量。 不以此庫不同批次的生／熟食品均值直接估算烹煮損失。"
  },
  {
    "id": "claim-food-flavanonol",
    "text": "UHPLC-MS/MS 以標準品確認 astilbin；成熟採樣點果皮乾重平均 754.2 mg/kg。",
    "type": "food-distribution",
    "sourceIds": [
      "food-serni2022"
    ],
    "locator": "Identity p.5; Table 2 p.6, Astilbin row, sampling 7 / DOY 246; unit definition p.4",
    "boundary": "單一義大利葡萄園、2018 年；36 組樣本跨 7 時點。數值是 astilbin 糖苷，不可直接貼到游離 taxifolin 或鮮果；Table 2 的 ± 定義未在表內明示，故不擅標 SD 或 SEM。",
    "evidenceRefs": [
      {
        "sourceId": "food-serni2022",
        "locator": "Identity p.5; Table 2 p.6, Astilbin row, sampling 7 / DOY 246; unit definition p.4"
      }
    ],
    "boundedText": "UHPLC-MS/MS 以標準品確認 astilbin；成熟採樣點果皮乾重平均 754.2 mg/kg。 單一義大利葡萄園、2018 年；36 組樣本跨 7 時點。數值是 astilbin 糖苷，不可直接貼到游離 taxifolin 或鮮果；Table 2 的 ± 定義未在表內明示，故不擅標 SD 或 SEM。"
  },
  {
    "id": "claim-food-isoflavone",
    "text": "豆腐可作為 genistein 類 isoflavone 的食品例。",
    "type": "food-distribution",
    "sourceIds": [
      "food-usda-isoflav2"
    ],
    "locator": "NDB 16427; PDF p.32 / printed p.30; Genistein row",
    "boundary": "USDA 異黃酮庫將 glucoside 換算為各自苷元後彙整；此表誤差欄是 SD，與 flavonoid 庫的 SEM 不同。不是所有豆腐製程共用一個固定含量。",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-isoflav2",
        "locator": "NDB 16427; PDF p.32 / printed p.30; Genistein row"
      }
    ],
    "boundedText": "豆腐可作為 genistein 類 isoflavone 的食品例。 USDA 異黃酮庫將 glucoside 換算為各自苷元後彙整；此表誤差欄是 SD，與 flavonoid 庫的 SEM 不同。不是所有豆腐製程共用一個固定含量。"
  },
  {
    "id": "claim-food-flavanol",
    "text": "USDA 沖泡紅茶資料含 (+)-catechin。",
    "type": "food-distribution",
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 14355, spans PDF pp.106-107 / printed pp.103-104; (+)-Catechin row on p.107; preparation normalization PDF p.6",
    "boundary": "不是乾茶葉每 100 g，也不是任意泡法的一杯茶。Catechin 單體不可和 proanthocyanidin 聚合物或可可抽出物總 flavanols 混用。",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 14355, spans PDF pp.106-107 / printed pp.103-104; (+)-Catechin row on p.107; preparation normalization PDF p.6"
      }
    ],
    "boundedText": "USDA 沖泡紅茶資料含 (+)-catechin。 不是乾茶葉每 100 g，也不是任意泡法的一杯茶。Catechin 單體不可和 proanthocyanidin 聚合物或可可抽出物總 flavanols 混用。"
  },
  {
    "id": "claim-food-anthocyanidin",
    "text": "高叢藍莓資料有 cyanidin 類色素的苷元換算量。",
    "type": "food-distribution",
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "NDB 09050; PDF p.30 / printed p.27; Cyanidin row",
    "boundary": "食品主要以 anthocyanin 糖苷等形式存在；此值不是游離 cyanidin、不是所有花青素總量，也不代表人體吸收量。",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "NDB 09050; PDF p.30 / printed p.27; Cyanidin row"
      }
    ],
    "boundedText": "高叢藍莓資料有 cyanidin 類色素的苷元換算量。 食品主要以 anthocyanin 糖苷等形式存在；此值不是游離 cyanidin、不是所有花青素總量，也不代表人體吸收量。"
  },
  {
    "id": "claim-health-medium-artifact",
    "text": "原文摘要報告：上述條件下 H₂O₂ 可達 >400 μM。",
    "type": "in-vitro",
    "sourceIds": [
      "health-long2000"
    ],
    "locator": "Author abstract; DMEM quantitative sentence (PMID 10873562).",
    "boundary": "同類分子與不同系統不能自動共用作用強度；此例不提供人體健康效益結論。",
    "evidenceRefs": [
      {
        "sourceId": "health-long2000",
        "locator": "Author abstract; DMEM quantitative sentence (PMID 10873562)."
      }
    ],
    "context": "(-)-epigallocatechin (EGC) 與 (-)-epigallocatechin gallate (EGCG)；Dulbecco's modified Eagle medium（DMEM）培養液；不是人體試驗。 分別加入 1 mM（1000 μM）；2 小時內觀察。 終點：培養液中 H₂O₂ 濃度",
    "boundedText": "(-)-epigallocatechin (EGC) 與 (-)-epigallocatechin gallate (EGCG)；Dulbecco's modified Eagle medium（DMEM）培養液；不是人體試驗。 分別加入 1 mM（1000 μM）；2 小時內觀察。 終點：培養液中 H₂O₂ 濃度。原文摘要報告：上述條件下 H₂O₂ 可達 >400 μM。 同類分子與不同系統不能自動共用作用強度；此例不提供人體健康效益結論。"
  },
  {
    "id": "claim-health-anthocyanin-cohort",
    "text": "405 例 MI；多變項調整後最高對最低五分位 HR 0.68，95% CI 0.49–0.96，P = 0.03。",
    "type": "observational",
    "sourceIds": [
      "health-cassidy2013"
    ],
    "locator": "Author abstract, Methods and results (PMID 23319811); do not relabel the reported P = 0.03 as P for trend.",
    "boundary": "支持該族群的攝取關聯；不能改寫為花青素已被證實預防心肌梗塞。",
    "evidenceRefs": [
      {
        "sourceId": "health-cassidy2013",
        "locator": "Author abstract, Methods and results (PMID 23319811); do not relabel the reported P = 0.03 as P for trend."
      }
    ],
    "context": "飲食 anthocyanins 類別估計；不是單一 cyanidin 苷元製劑；Nurses' Health Study II：93,600 名女性，1989 年入組年齡 25–42 歲；追蹤 18 年。 食物頻率問卷每 4 年更新，比較花青素攝取量最高與最低五分位；沒有指定介入劑量。 終點：新發心肌梗塞（MI）",
    "boundedText": "飲食 anthocyanins 類別估計；不是單一 cyanidin 苷元製劑；Nurses' Health Study II：93,600 名女性，1989 年入組年齡 25–42 歲；追蹤 18 年。 食物頻率問卷每 4 年更新，比較花青素攝取量最高與最低五分位；沒有指定介入劑量。 終點：新發心肌梗塞（MI）。405 例 MI；多變項調整後最高對最低五分位 HR 0.68，95% CI 0.49–0.96，P = 0.03。 支持該族群的攝取關聯；不能改寫為花青素已被證實預防心肌梗塞。"
  },
  {
    "id": "claim-health-cosmos-rct",
    "text": "追蹤中位數 3.6 年；可可組 410 例、安慰劑組 456 例；HR 0.90，95% CI 0.78–1.02，P = 0.11。主要終點未達統計顯著差異。",
    "type": "rct",
    "sourceIds": [
      "health-cosmos2022"
    ],
    "locator": "Abstract; Methods: Primary and secondary trial outcomes / Statistical analyses; Results; Discussion limitations (PMCID PMC9170467).",
    "boundary": "主要終點沒有足夠證據宣稱益處；此結論本身不能轉成八類全體無效。",
    "evidenceRefs": [
      {
        "sourceId": "health-cosmos2022",
        "locator": "Abstract; Methods: Primary and secondary trial outcomes / Statistical analyses; Results; Discussion limitations (PMCID PMC9170467)."
      }
    ],
    "context": "可可抽出物；每日總 cocoa flavanols 500 mg，含 (-)-epicatechin 80 mg；21,442 名美國成人：女性 12,666 名 ≥65 歲；男性 8,776 名 ≥60 歲。 每日 2 顆膠囊；隨機、雙盲、安慰劑對照、2×2 因子試驗；依原隨機組別分析。 終點：主要終點為總心血管事件複合終點：MI、stroke、coronary revascularization、CVD death、carotid artery surgery、peripheral artery surgery、需住院的 unstable angina。",
    "boundedText": "可可抽出物；每日總 cocoa flavanols 500 mg，含 (-)-epicatechin 80 mg；21,442 名美國成人：女性 12,666 名 ≥65 歲；男性 8,776 名 ≥60 歲。 每日 2 顆膠囊；隨機、雙盲、安慰劑對照、2×2 因子試驗；依原隨機組別分析。 終點：主要終點為總心血管事件複合終點：MI、stroke、coronary revascularization、CVD death、carotid artery surgery、peripheral artery surgery、需住院的 unstable angina。。追蹤中位數 3.6 年；可可組 410 例、安慰劑組 456 例；HR 0.90，95% CI 0.78–1.02，P = 0.11。主要終點未達統計顯著差異。 主要終點沒有足夠證據宣稱益處；此結論本身不能轉成八類全體無效。"
  },
  {
    "id": "claim-usda-reporting-form",
    "text": "USDA 主要將食品糖苷換算為苷元後彙整；catechin 與其 gallate ester 另按原形報告。",
    "type": "measurement-boundary",
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "PDF pp.5-6 / printed pp.2-3",
    "boundary": "不能把報告的苷元當量誤認食品全部由游離苷元構成。",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "PDF pp.5-6 / printed pp.2-3"
      }
    ],
    "boundedText": "USDA 主要將食品糖苷換算為苷元後彙整；catechin 與其 gallate ester 另按原形報告。 不能把報告的苷元當量誤認食品全部由游離苷元構成。"
  },
  {
    "id": "claim-usda-missing-not-zero",
    "text": "資料庫缺少某個食品／成分值代表資料不可得，不能當作零。",
    "type": "measurement-boundary",
    "sourceIds": [
      "food-usda-flav3-3"
    ],
    "locator": "PDF p.6 / printed p.3",
    "boundary": "本課未選某類的健康文獻也不等於該類已被證明無效。",
    "evidenceRefs": [
      {
        "sourceId": "food-usda-flav3-3",
        "locator": "PDF p.6 / printed p.3"
      }
    ],
    "boundedText": "資料庫缺少某個食品／成分值代表資料不可得，不能當作零。 本課未選某類的健康文獻也不等於該類已被證明無效。"
  }
];
