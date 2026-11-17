export const sources=[
 ['OpenStax：糖的環狀結構、α / β 異頭物','https://openstax.org/books/organic-chemistry/pages/25-5-cyclic-structures-of-monosaccharides-anomers'],
 ['OpenStax：醇對羰基的加成、半縮醛與縮醛','https://openstax.org/books/organic-chemistry/pages/19-10-nucleophilic-addition-of-alcohols-acetal-formation'],
 ['UCLA：Mutarotation（變旋）','https://www.chem.ucla.edu/~harding/IGOC/M/mutarotation.html'],
 ['OpenStax：烷類構象','https://openstax.org/books/organic-chemistry/pages/3-7-conformations-of-other-alkanes'],
 ['OpenStax：平衡、速率與能量','https://openstax.org/books/organic-chemistry/pages/6-7-describing-a-reaction-equilibria-rates-and-energy-changes'],
 ['OpenStax：單醣的反應','https://openstax.org/books/organic-chemistry/pages/25-6-reactions-of-monosaccharides'],
 ['OpenStax：雙醣、還原端與變旋','https://openstax.org/books/organic-chemistry/pages/25-8-disaccharides'],
 ['RCSB：α-D-glucopyranose / GLC','https://www.rcsb.org/ligand/GLC'],
 ['RCSB：β-D-glucopyranose / BGC','https://www.rcsb.org/ligand/BGC'],
 ['RCSB：開鏈 D-glucose / GLO','https://www.rcsb.org/ligand/GLO'],
 ['RDKit：分子力場計算文件','https://www.rdkit.org/docs/source/rdkit.Chem.rdForceFieldHelpers.html'],
 ['NCBI MeSH：Maillard reaction','https://www.ncbi.nlm.nih.gov/mesh/68015416'],
 ['LacZ 的 Glu537／Glu461 結構研究','https://pubmed.ncbi.nlm.nih.gov/11732897/'],
 ['Glucoamylase／麥芽糖的動力學研究','https://pubmed.ncbi.nlm.nih.gov/8952477/']
];
export const helpHTML=`<p>這裡是可以親手操作的糖類化學學習空間。先從乙烷、丁烷理解單鍵，再回到葡萄糖。</p><h3>01 · 構象與能量</h3><p>拖曳 3D 畫面只轉動視角。右側角度滑桿才會轉動指定單鍵；綠色是旋轉軸。也可以點曲線指定角度、找曲線最低點，或啟動熱擾動。Newman 投影沿同一條鍵看，與 3D 同步。</p><p>熱擾動用 Metropolis 取樣：低位能較常出現，高位能仍有機會。溫度控制取樣接受率；動畫不是分子動力學，不能用畫面秒數推算反應速率。</p><h3>02 · 糖類反應地圖</h3><p>從反應家族與代表路徑出發，用反應物、產物、官能基或條件搜尋。推進步驟時，旁邊同步顯示反應式與說明；可儲存所在步驟、做概念練習，或沿相關反應繼續探索。具機構的路徑可親手推進電子流，涵蓋環鏈平衡、糖苷與水解、異構化、氧化還原、羥基衍生化及梅納相關反應的所選教學分支；各入口會標示目前的實作範圍。雙醣機構會保留兩個糖產物，以 A/B 前綴追蹤橋氧及進攻水氧；乳糖另可選 LacZ 保留型局部酵素分支，麥芽糖另可選指定 glucoamylase 反轉型局部分支；兩者與酸水解是不同教學模型。同一反應若有多個分支，可在機構上方切換；保存筆記會保留所選分支。勾選「只看可推進電子流的機構」可快速找到入口。尚未建立的中間體會明確標示。</p><h3>03 · 葡萄糖變旋</h3><p>選電子來源與目的地，再按「推進這一步」。可直接點原子，也可用下拉選單。成套電子箭頭一起執行；選錯會解釋原因。成環前可選 α 或 β 路徑。示範播放、提示與逐步回看都可使用。</p><h3>04 · 結構比較</h3><p>並排轉動 α、開鏈與 β，觀察 C1、O1、O5 的關係。這裡另外說明溶液平衡得到的 ΔG°，與單鍵掃描 ΔE 的差別。</p><h3>05 · 實驗筆記</h3><p>按「留下觀察」保存目前分子、角度、反應階段及這次操作紀錄。可還原、回放、補寫，匯出 JSON 備份或 Markdown 筆記。資料存在此瀏覽器；清除網站資料會移除筆記，重要觀察請匯出。</p>`;
export function sourcesHTML(coverage){
 const c=coverage?.counts;
 const hasCounts=['paths','teachingStages','representativeMolecules','mappedRoutes','mappedBranches'].every(key=>Number.isInteger(c?.[key])&&c[key]>=0);
 const mappedSummary=hasCounts?`目前 ${c.mappedRoutes} 條代表路徑提供逐原子電子流操作，共 ${c.mappedBranches} 個流程分支。`:'覆蓋統計尚未載入；可操作的範圍請依反應地圖的機構標記確認。';
 const atlasSummary=hasCounts?`反應地圖有 ${c.paths} 條路徑、${c.teachingStages} 個概覽階段；全庫合計 ${c.representativeMolecules} 個代表分子。`:'目前無法讀取路徑、概覽階段及代表分子的覆蓋統計。';
 return `<h3>結構與位能怎麼來？</h3><p>葡萄糖的原子編號與立體化學參照 RCSB Chemical Component Dictionary。RDKit 2026.03.6 以 ETKDGv3 建立構象，再做 MMFF94 最佳化；扭轉曲線每 5° 計算一次。</p><p>曲線是<strong>孤立分子、固定其他幾何的 MMFF94 相對位能 ΔE</strong>，沒有溶劑、完整構象鬆弛或熵，不是 Gibbs 自由能、實驗能障或反應自由能。零點只在同一條曲線內有意義。切換旋轉軸會重設其他角度，保持畫面與預先計算資料一致。</p><p>部分固定幾何產生嚴重擁擠，能量很高。圖上超過 100 kJ/mol 會截頂，右側數字仍如實顯示。沒有掃描資料的羥基軸只顯示幾何，停用能量與熱取樣。</p><h3>反應模型的範圍</h3><p>${mappedSummary}機構涵蓋環鏈平衡、糖苷與水解、異構化、氧化還原、羥基衍生化及梅納相關反應的所選教學分支。各支路明示參與反應的試劑、質子載體與副產物；原子、價數及總電荷逐步檢查。中間狀態的質子位置、Lewis 結構與電子箭頭是教學記帳，不表示每態都是可分離中間體或溶液中的主要物種；構象與座標補間不是量子化學反應軌跡。模型未提供任意反應預測。</p><p>${atlasSummary}代表結構依 RCSB 糖骨架建立或以 PubChem 的立體 SMILES / InChI 核對，再產生 3D 構象。概覽階段提供反應式與代表結構，不能視為同數量的已計算反應中間體。梅納反應與焦糖化包含尚未展開的分支網路，不計算任意食材的褐變、產率或速率。每條路徑另列查證來源、代表分支及尚未建模的限制。</p><h3>學習設計</h3><p>結合可旋轉分子觀看、電子流操作、逐步反應與個人實驗紀錄。介面與教學整合為本專案實作；3D 顯示使用 Three.js（MIT），未嵌入其他付費產品。</p><h3>查證來源</h3><ul>${sources.map(([name,url])=>`<li><a href="${url}" target="_blank" rel="noopener noreferrer">${name} ↗</a></li>`).join('')}</ul>`;
}
export const foodCards=[
 {title:'還原糖',tag:'開鏈羰基',text:'環狀半縮醛可與開鏈形互換。即使開鏈比例很小，持續互換仍能讓醛基參與反應。',question:'為什麼多數時間成環，仍有還原性？',answer:'因為開鏈形被消耗時，平衡可持續補充它。比例小不等於完全不存在；不同糖的還原性也要看能否形成可反應的羰基。'},
 {title:'糖苷與糖苷鍵',tag:'半縮醛 → 縮醛',text:'異頭羥基變成糖苷的縮醛結構後，該異頭中心無法再用相同的半縮醛開環路徑變旋。',question:'每個雙醣都是非還原糖嗎？',answer:'不是。要看是否還有自由的異頭半縮醛端。纖維二糖的 β(1→4) 糖苷鍵固定，另一端仍可在 α、開鏈與 β 之間變旋；這個游離端可還原成纖維二糖醇，或經溴水氧化先成內酯再成酸。麥芽糖、乳糖與蔗糖另有各自所選的酸催化水解支路；乳糖與麥芽糖還有具名酵素分支。這些代表例子不等於所有酵素或產物比例。'},
 {title:'梅納反應',tag:'羰基 + 胺基',text:'還原糖的羰基與胺基反應，是褐變反應網路的起點之一。溫度、pH、水活性及反應物都會影響後續。',question:'這個 3D 模型能預測食物褐變嗎？',answer:'目前不能。你能操作葡萄糖與甘胺酸形成 Schiff 鹼，再到 Amadori 酮胺；食品褐變還涉及後續分支、條件與動力學。'}
];
