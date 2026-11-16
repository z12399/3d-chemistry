import {sugarState} from './sugar-chair-model.js';
import {renderFischer,renderHaworth,renderChair} from './sugar-chair-diagrams.js';
import {SugarChairSpatialViewer} from './sugar-chair-spatial-viewer.js';
import {sugarChairMolecule} from './sugar-chair-spatial-model.js';
import {sugarOpenChainMolecule,sugarOpenChainFischerView} from './sugar-open-chain-spatial-model.js';
import {escapeHTML as esc} from './storage.js';

export const SUGAR_CHAIR_LAB_ID='sugar-chair-foundations';
const memory=new WeakMap();
const STEPS=[['D／L','只看定義碳'],['成環','追蹤同一個碳'],['α／β','比對兩個面'],['椅式','先上下，再 a／e'],['換視角','分子一起轉'],['翻椅','上下留著，a／e 交換']];
const faceWord=value=>value==='up'?'上':'下';
const posWord=value=>value==='axial'?'軸向 a':'赤道向 e';
const chairWord=value=>value==='4C1'?'⁴C₁':'¹C₄';
const fresh=()=>({sugar:'glucose',series:'D',anomer:'beta',chair:'4C1',selected:5,step:0,yaw:0,pitch:25,showHydrogens:false,reason:'',quiz:0,answers:{},results:{},revealed:{},quizArchive:{},presentation:'spatial',paperReference:'chair',spatialView:null,spatialPreset:'standard',chainView:null,chainPreset:'overview',chainReference:'fischer',closureStage:'open',saved:null});

function localFischer(state){
  const carbon=state.selected===1?5:state.selected,row=state.rows[carbon-1],left=row.fischer==='left'?'OH':'H',right=row.fischer==='right'?'OH':'H';
  return `<svg class="sc-local-fischer" viewBox="0 0 380 300" role="img" aria-label="C${carbon} 的局部 Fischer 立體約定：左 ${left}、右 ${right} 的鍵朝你，上下碳鏈的鍵背你"><text x="190" y="31" text-anchor="middle" class="sc-guide-label">背你 · 碳鏈</text><line x1="190" y1="66" x2="190" y2="130" class="sc-local-away"/><line x1="190" y1="170" x2="190" y2="232" class="sc-local-away"/><polygon points="184,150 115,138 115,162" class="sc-local-toward"/><polygon points="196,150 265,138 265,162" class="sc-local-toward"/><circle cx="190" cy="150" r="20" class="sc-carbon-node"/><text x="190" y="150" class="sc-label" dominant-baseline="central" text-anchor="middle">C${carbon}</text><text x="190" y="55" class="sc-label" text-anchor="middle">C${carbon-1}</text><text x="190" y="254" class="sc-label" text-anchor="middle">C${carbon+1}</text><text x="85" y="150" class="sc-label" dominant-baseline="central" text-anchor="middle">${left}</text><text x="295" y="150" class="sc-label" dominant-baseline="central" text-anchor="middle">${right}</text><text x="95" y="189" class="sc-guide-label" text-anchor="middle">朝你</text><text x="285" y="189" class="sc-guide-label" text-anchor="middle">朝你</text></svg>`;
}

const NOTES=[
  `<p>先把開鏈 Fischer 擺正：羰基端在上、碳鏈垂直。橫線朝向你；直線朝紙面後方。Fischer 是立體投影，不能當作平面的十字架。旁邊的小圖把選定碳的橫鍵畫成朝向你的楔形、縱鍵畫成背向你的虛線。</p><p>D／L 源自與 D／L-甘油醛的相對配置比較。這裡三種醛己糖的定義碳都是 C5，亦即離羰基最遠的手性碳。標準 Fischer 的 C5–OH 在右，與 D-甘油醛同系列；在左則與 L-甘油醛同系列。其他 OH 要逐一讀，D 不會告訴你 C2、C3、C4 的方向。</p><p>同名糖的 D→L 是全分子鏡像：C2、C3、C4、C5 的既有手性中心全部反轉，不能只把 C5 的 OH 換邊。本頁切換 D／L 時會把這四個中心一起反轉。</p><p>D／L 不表示旋光的正負，也不等於每一個中心都是 R／S。相同 D 系列的葡萄糖、甘露糖、半乳糖仍有不同的 OH 配置。</p><p>Fischer 在紙面轉 180° 仍是同一構型，但若要判 D／L，須先恢復羰基在上的標準擺法。轉 90° 後仍當 Fischer 解讀會改變配置；只交換一對基團也會反轉那個中心。</p>`,
  `<p>本頁固定用醛己糖的六員吡喃環：C5–OH 的氧攻擊 C1 羰基碳，環內依序是 O5–C1–C2–C3–C4–C5。C6 留在環外，成為 C5 上的 CH₂OH。</p><p>標準 Haworth 擺法是環氧在右上、C1 在最右，前方環鍵加粗。在這個擺法，Fischer 的 C2–C4：右邊 OH → 環下；左邊 OH → 環上。這個左右規則對 D、L 都適用。</p><p>C5 不能照搬成另一個 OH：O5 已經成為環氧。在此標準 Haworth，C5 的 CH₂OH：D 向上、L 向下。C1 的原羰基氧變為異頭 OH，而 C1 由平面羰基產生新的手性中心。</p><p>Haworth 是方便辨識兩面的示意，不代表六員糖環真正平坦。圖中的上／下指環的兩個面，和紙張左右、看起來高低是不同概念。</p>`,
  `<p>D／L 由原有的定義碳決定；α／β 描述新異頭中心的相對配置。它們是兩個獨立的判斷。</p><p>在本頁的醛己吡喃糖，拿 C1 的 OH 和 C5 的 CH₂OH 比：α 在相反面，β 在同一面。故 D 的 α 向下、β 向上；L 的 α 向上、β 向下。不要把「α＝下」當成通則。</p><p>α 不是軸向的別名，β 也不是赤道向的別名。換到另一把椅子，異頭 OH 的 a／e 會交換，α／β 名稱仍保留。</p><p>嚴格的 α／β 定義需比較異頭中心和異頭參考原子。此處同面／反面捷徑限定為這三種醛己吡喃糖，不能直接套所有酮糖、五員環或特殊命名情況。</p>`,
  `<p>先把 Haworth 的每個基團記成「上」或「下」，再決定它在這把椅子屬於軸向還是赤道向。不要從紙上的斜線角度反推上下。</p><p>軸向 a 近似平行於環的共同軸，沿環交替向上、向下。赤道向 e 向環外伸展；同一個碳的 a 和 e 分別位在相反面。H 與 OH／CH₂OH 佔據互補位置。CH₂OH 的 a／e 指 C5–C6 鍵，不是 C6 的 O–H 鍵。</p><p>⁴C₁ 的軸向方向：C1↓、C2↑、C3↓、C4↑、C5↓。若基團的上／下和該碳的軸向一致，它就是 a；不一致就是 e。¹C₄ 全部軸向方向反過來。</p><p>⁴C₁ 的命名是以 C4 在 C2、C3、C5、O5 的參考平面之上、C1 在其下為依據，不是指紙面左右。不要只靠椅子輪廓辨認；先找到環氧、C1、C4 與編號。</p><p>β-D-葡萄吡喃糖在 ⁴C₁ 的五個非氫環外基團皆為 e；α-D 的 C1–OH 是 a。在同一把 ⁴C₁，D-甘露糖的 C2、D-半乳糖的 C4 因配置不同而有軸向 OH。這是理解構型的對照，不是普遍的穩定性公式。</p>`,
  `<p>整個分子繞空間軸一起旋轉時，所有原子和基團都一起動。圖上 C1 可以移到左邊，環氧也會換位置；D／L、α／β、每個基團的上／下和 a／e 都保持。</p><p>本頁「另一側」把模型繞垂直軸轉 180°；前後遠近也一起交換。「下面看」改變觀看高度。用編號追蹤同一個碳，再看圖旁的分子上面指示。</p><p>只把圖水平反射不能直接當作空間旋轉。真正的鏡像要處理所有手性中心，D↔L，但相對的 α／β 保留；對應的椅式參考命名也要重新判定。</p><p>如果課本的椅子朝向不同，先對上 O、C1、C2…，再核對基團的相對兩面。紙上左右不同本身不足以說它是另一種糖。</p>`,
  `<p>椅式翻轉是環的構象改變：⁴C₁ ↔ ¹C₄。每個基團的上／下保留，而 a↔e。上軸向變上赤道向；下赤道向變下軸向。OH 和 H 要一起遵守這個規則。</p><p>翻椅不改任何手性中心的構型，所以 D／L、α／β、順式／反式都保持。它和整個分子旋轉、鏡像、異頭化是四件不同的事。</p><p>例如 β-D-葡萄吡喃糖：⁴C₁ 五個環外非氫基團皆 e；翻成 ¹C₄ 後皆 a，C1 的 OH 仍向上、仍是 β。兩把椅子不是等比例存在。</p><p>畫另一把椅子：保留 O 與碳號 → 在新椅子標出交替的軸向 ↑↓ → 把舊圖每個基團的上／下帶過去 → 配到新 a／e → 最後檢查 C1 與 C5 的相對面。</p><p>這裡顯示理想椅式的兩個端點；不以直線變形動畫假裝真實的翻椅路徑，也不計算能量、速率或溶液族群。</p>`
];

function questions(state){
  const row=state.rows.find(r=>r.carbon===2),c1=state.rows[0],flipped=sugarState({...state,chair:state.chair==='4C1'?'1C4':'4C1'}).rows.find(r=>r.carbon===3);
  return [
    {prompt:`${state.series}-${state.name}：Fischer C2 的 OH 在${row.fischer==='right'?'右':'左'}，標準 Haworth 應放哪一面？`,options:[['up','上'],['down','下']],correct:row.face,reason:'在本頁標準 Haworth，Fischer 右→下、左→上；D／L 不會改掉這個逐碳規則。'},
    {prompt:`${state.anomer==='alpha'?'α':'β'}-${state.series}-${state.name}的 C1–OH 應在哪一面？`,options:[['up','上'],['down','下']],correct:c1.face,reason:`C5–CH₂OH 向${faceWord(state.referenceFace)}；${state.anomer==='alpha'?'α 要和它反面':'β 要和它同面'}。`},
    {prompt:`C3–OH 翻成 ${chairWord(state.chair==='4C1'?'1C4':'4C1')} 後，應怎麼放？`,options:[['up/axial','上 · a'],['down/axial','下 · a'],['up/equatorial','上 · e'],['down/equatorial','下 · e']],correct:flipped.face+'/'+flipped.position,reason:'翻椅保留上／下，只交換 a／e。'},
    {prompt:'只把整個分子轉到另一側觀看，會改變什麼？',options:[['view','紙上的左右與前後'],['anomer','α／β'],['series','D／L'],['chair','⁴C₁／¹C₄']],correct:'view',reason:'剛體旋轉改觀看方向，不改構型或椅式構象。'}
  ];
}

export function mountSugarChairLab(host,{draftOwner,onSaveSummary}={}){
  if(!host)throw new TypeError('Missing sugar chair host');
  let state=draftOwner&&memory.get(draftOwner);
  if(!state){state=fresh();if(draftOwner&&typeof draftOwner==='object')memory.set(draftOwner,state);}
  let alive=true,spatial=null,settingPreset=false,spatialFailure=false,spatialForm=null;
  state.presentation??='spatial';state.paperReference??='chair';state.spatialPreset??='standard';
  state.chainPreset??='overview';state.chainReference??='fischer';state.closureStage??='open';
  host.innerHTML=`<section class="sugar-chair-lab" aria-labelledby="sc-title">
    <header class="sc-header"><div class="sc-heading"><p class="sc-kicker">構型 → 表示法 → 構象</p><h2 id="sc-title">OH 該放在哪裡？</h2></div><div class="sc-molecule-controls"><label>糖<select id="sc-sugar"><option value="glucose">葡萄糖</option><option value="mannose">甘露糖 · 比 C2</option><option value="galactose">半乳糖 · 比 C4</option></select></label><label>系列<select id="sc-series"><option>D</option><option>L</option></select></label></div><div class="sc-header-context"><span class="sc-model-identity">理想化教學構象</span><button id="sc-open-space" type="button" class="sc-space-shortcut">直接拖曳看椅式 ↗</button></div></header>
    <nav class="sc-steps" aria-label="逐步理解糖的畫法">${STEPS.map(([title],i)=>`<button type="button" data-sc-step="${i}" aria-pressed="false"><span>${i+1}</span>${title}</button>`).join('')}</nav>
    <div class="sc-current"><div class="sc-current-copy"><h3 id="sc-step-title"></h3><span id="sc-identity"></span></div><div id="sc-presentation-tools" class="sc-presentation-tools" hidden><button type="button" data-sc-presentation="spatial">空間模型 · 可拖曳</button><button type="button" data-sc-presentation="paper">畫法對照</button></div></div>
    <div class="sc-local-controls"><div id="sc-closure-tools" class="sc-closure-tools" hidden><button type="button" data-sc-closure="open">開鏈</button><span aria-hidden="true">⇄</span><button type="button" data-sc-closure="ring">成環後</button><span class="sc-closure-caption">追蹤 C1 · O1 · O5</span></div><fieldset id="sc-anomer-tools"><legend>異頭形式</legend><button type="button" data-sc-anomer="alpha">α</button><button type="button" data-sc-anomer="beta">β</button></fieldset><fieldset id="sc-chair-tools"><legend>椅式</legend><button type="button" data-sc-chair="4C1">⁴C₁</button><button type="button" data-sc-chair="1C4">¹C₄</button></fieldset><label id="sc-hydrogens-label"><input id="sc-hydrogens" type="checkbox"> 顯示 H</label></div>
    <div id="sc-spatial-workspace" class="sc-spatial-workspace" hidden>
      <figure class="sc-space-paper"><div class="sc-paper-header"><figcaption id="sc-paper-caption">紙上的畫法</figcaption><label class="sr-only" for="sc-paper-reference">對照畫法</label><select id="sc-paper-reference"><option value="chair">標準椅式</option><option value="haworth">Haworth</option></select></div><div id="sc-space-reference"></div><p id="sc-paper-hint" class="sc-space-hint" hidden></p></figure>
      <section class="sc-space-model" aria-labelledby="sc-space-title"><div class="sc-space-title-row"><h4 id="sc-space-title">同一把椅子，從空間中看</h4><span id="sc-space-view-label">標準視角</span></div><div id="sc-space-canvas" class="sc-space-canvas"></div><p class="sc-space-hint">拖曳旋轉 · 滾輪／雙指縮放 · 點碳位追蹤</p><div class="sc-space-controls"><button type="button" data-sc-rotate="left" aria-label="模型向左旋轉">←</button><button type="button" data-sc-rotate="right" aria-label="模型向右旋轉">→</button><button type="button" data-sc-rotate="up" aria-label="模型向上旋轉">↑</button><button type="button" data-sc-rotate="down" aria-label="模型向下旋轉">↓</button><button type="button" data-sc-zoom="in" aria-label="放大模型">＋</button><button type="button" data-sc-zoom="out" aria-label="縮小模型">−</button></div><p id="sc-space-status" class="sc-space-status" role="status"></p></section>
    </div>
    <div id="sc-diagrams" class="sc-diagrams"></div>
    <div id="sc-view-tools" class="sc-view-tools" hidden><button type="button" data-sc-view="standard">標準視角</button><button type="button" data-sc-view="other">另一側 · 180°</button><button type="button" data-sc-view="under">下面看</button></div>
    <div id="sc-chain-tools" class="sc-view-tools" hidden><button type="button" data-sc-chain-view="overview">開鏈全景</button><button type="button" data-sc-chain-view="fischer" id="sc-align-fischer">對準 C5 · Fischer</button></div>
    <div class="sc-tracker"><div class="sc-carbon-controls" aria-label="追蹤碳位">${[1,2,3,4,5].map(c=>`<button type="button" data-sc-carbon="${c}">C${c}</button>`).join('')}</div><p id="sc-selected" role="status"></p></div>
    <p id="sc-rule" class="sc-rule"></p>
    <div class="sc-forward"><button id="sc-prev" type="button">← 上一步</button><button id="sc-next" class="button-primary" type="button">下一步 →</button></div>
    <details class="sc-detail" id="sc-step-detail"><summary>把這一步想透</summary><div id="sc-step-note"></div></details>
    <details class="sc-detail"><summary>所有碳位，一次核對</summary><div class="sc-table-wrap"><table><thead id="sc-table-head"></thead><tbody id="sc-table"></tbody></table></div></details>
    <details class="sc-detail" id="sc-quiz-detail"><summary>自己推一次</summary><div class="sc-quiz-controls">${['左右→上下','α／β','翻椅','換視角'].map((label,i)=>`<button type="button" data-sc-quiz="${i}">${label}</button>`).join('')}</div><p id="sc-quiz-prompt"></p><fieldset id="sc-quiz-options"><legend class="sr-only">自己的答案</legend><div id="sc-quiz-choices"></div></fieldset><div class="sc-quiz-actions"><button id="sc-quiz-check" type="button" class="button-primary">核對自己的答案</button><button id="sc-quiz-reveal" type="button">看推導</button></div><p id="sc-quiz-feedback" role="status"></p></details>
    <details class="sc-detail"><summary>兩個糖接起來，怎麼保留方向？</summary><p>先判定提供糖苷鍵的異頭碳，再寫 α／β 和連接碳號。α-D-Glcp-(1→4)-D-Glcp 表示第一個葡萄糖的 C1 以 α 構型，透過 O 接到第二個糖的 C4；β(1→4) 則指定第一個糖的 C1 為 β。比較供體的 C1–O 與 C5–CH₂OH 兩面，不能靠整條 O 橋在紙上的斜向判 α／β。</p><p>連接圖中，供體 C1 上畫的是 O–受體，不能再多畫一個游離 OH；受體 C4 原來的 OH 變成橋接 O，也不另留 OH。連接位置不同，例如 1→6，應先確認受體編號。Glcp 表示葡萄吡喃糖單元。</p><p>若受體的異頭 OH 游離，其 α／β 可經開環再閉環改變，供體的既有 α／β 糖苷鍵仍保留。麥芽糖、纖維二糖是這種例子。蔗糖則連接兩個異頭中心，需要分別判定。</p><p>每個糖環先獨立判 D／L、α／β 與椅式，再用 O 橋接起來；繞 C–O 單鍵轉動可改兩環相對取向，屬於另一種構象變化，沒有反轉異頭構型。實際合成糖苷鍵可依反應機制保留或反轉供體原有異頭配置，連接名稱指定的是產物。本頁的三種單糖示意不模擬雙糖的三維扭轉或合成反應。</p></details>
    <details class="sc-detail"><summary>常見混淆與適用範圍</summary><dl class="sc-mistakes"><dt>「D 的 OH 都在右」</dt><dd>D 只決定定義碳。葡萄糖 C3 的 OH 在左。</dd><dt>「α 一定向下／一定是 a」</dt><dd>先看 D／L，再看與參考基團的相對面；a／e 另外由椅式決定。</dd><dt>「翻椅要把所有上變下」</dt><dd>上／下保持；換的是 a／e。</dd><dt>「椅子朝左就是 L」</dt><dd>先追蹤碳號與手性配置。紙上的朝向不能定 D／L。</dd><dt>「所有糖都能畫椅式」</dt><dd>此頁限葡萄糖、甘露糖、半乳糖的六員吡喃環。呋喃糖是五員環，常用 envelope／twist；果糖的異頭碳是 C2，不能套本頁 C1 成環流程。</dd><dt>「圖形＝實測構象／平衡」</dt><dd>這是保留配置的理想幾何示意，沒有溶液構象族群、翻椅路徑或能量計算。穩定性還受位阻、異頭效應和溶劑等影響。</dd><dt>「3D 的末端方向只有這一種」</dt><dd>OH 氫與 CH₂OH 末端採一個固定示意構象；單鍵還可轉動。拖曳只換觀看方向，不重算這些位置。環上面箭頭表示本模型平均環面方向，不是把糖環視為平面，也不是椅式命名參考平面的精確法向量。</dd></dl></details>
    <details class="sc-detail"><summary>留下自己的理解</summary><label for="sc-reason">現在能怎樣判 OH？還卡在哪個碳？</label><textarea id="sc-reason" rows="3" maxlength="2000"></textarea><label for="sc-summary">目前操作與推導紀錄</label><textarea id="sc-summary" rows="6" readonly></textarea><button id="sc-save" type="button">附加到本課筆記</button><span id="sc-save-status" role="status"></span><p class="sc-small">操作與未存文字只在本次頁面暫留；附加成功後，才能隨本課筆記保存與匯出。</p></details>
    <details class="sc-detail"><summary>定義與來源</summary><ul><li><a href="https://iupac.qmul.ac.uk/2carb/03n04.html" target="_blank" rel="noopener noreferrer">IUPAC 2-Carb-3–4：Fischer 與 D／L</a></li><li><a href="https://iupac.qmul.ac.uk/2carb/06n07.html" target="_blank" rel="noopener noreferrer">IUPAC 2-Carb-6–7：環、異頭中心與 α／β</a></li><li><a href="https://iupac.qmul.ac.uk/2carb/05.html" target="_blank" rel="noopener noreferrer">IUPAC 2-Carb-5：Haworth 與構象表示</a></li><li><a href="https://openstax.org/books/organic-chemistry/pages/25-5-cyclic-structures-of-monosaccharides-anomers" target="_blank" rel="noopener noreferrer">OpenStax：成環、Haworth 與葡萄糖椅式</a></li><li><a href="https://openstax.org/books/organic-chemistry/pages/4-6-axial-and-equatorial-bonds-in-cyclohexane" target="_blank" rel="noopener noreferrer">OpenStax：axial、equatorial 與 ring flip</a></li></ul></details>
  </section>`;
  const $=selector=>host.querySelector(selector);
  $('#sc-sugar').value=state.sugar;$('#sc-series').value=state.series;$('#sc-reason').value=state.reason;
  function model(){return sugarState(state);}
  const openForm=()=>state.step===0||(state.step===1&&state.closureStage==='open');
  const spatialStep=()=>state.step!==2;
  function viewName(){const preset=openForm()?state.chainPreset:state.spatialPreset;return {standard:'標準視角',other:'另一側',under:'下面看',free:'自由視角',overview:'開鏈全景',fischer:'C'+state.selected+' · 局部 Fischer'}[preset]||'自由視角';}
  function rememberView(view,form=spatialForm){if(form==='open-chain')state.chainView=view;else state.spatialView=view;}
  function summary(){
    const m=model(),open=openForm(),v=open?state.chainView:state.spatialView;
    const view=v?'空間模型：'+viewName()+'；水平 '+v.yaw.toFixed(1)+'°／仰角 '+v.pitch.toFixed(1)+'°／滾轉 '+(v.roll||0).toFixed(1)+'°／縮放 '+v.zoom.toFixed(2):'空間模型：尚未操作';
    const identity=open?state.series+'-'+m.name+'，開鏈（沒有 α／β）':(state.anomer==='alpha'?'α':'β')+'-'+state.series+'-'+m.name+'，'+chairWord(state.chair);
    const rows=open?m.rows.slice(1).map(r=>'C'+r.carbon+' OH：Fischer '+(r.fischer==='right'?'右':'左')):m.rows.map(r=>'C'+r.carbon+' '+r.group+'：'+faceWord(r.face)+'／'+posWord(r.position));
    return ['糖立體推導：'+identity,'觀察：'+STEPS[state.step][0]+'；畫法視角 yaw='+state.yaw+'° / pitch='+state.pitch+'°',view,...(state.step===1?['成環端點：'+(open?'開鏈':'成環後')+'；O5–C1 新增、C1=O1 → C1–O1；C/O 身分保留，未模擬反應路徑。']:[]),...rows,...questions(m).map((q,i)=>'推導 '+(i+1)+'：'+(state.answers[i]?q.options.find(o=>o[0]===state.answers[i])?.[1]||state.answers[i]:'尚未回答')+'；'+(state.results[i]?'核對'+(state.results[i].correct?'相符':'待修正'):'尚未核對')+(state.revealed[i]?'；已看推導':'')),state.reason?'自己的理解：'+state.reason:'自己的理解：尚未填寫'].join('\n');
  }
  function updateSpatialView(){
    if(!alive)return;$('#sc-space-view-label').textContent=viewName();
    host.querySelectorAll('[data-sc-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scView===state.spatialPreset)));
    host.querySelectorAll('[data-sc-chain-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scChainView===state.chainPreset)));
    refreshSummary();
  }
  function ensureSpatial(m){
    const visible=spatialStep()&&state.presentation==='spatial';
    $('#sc-spatial-workspace').hidden=!visible;
    if(!visible)return;
    const open=openForm(),form=open?'open-chain':'ring',molecule=open?sugarOpenChainMolecule(m):sugarChairMolecule(m);
    $('#sc-spatial-workspace').dataset.molecularForm=form;
    const cached=open?state.chainView:state.spatialView,defaultView=open?(molecule.metadata.defaultView||{yaw:0,pitch:0}):{yaw:state.yaw,pitch:state.pitch};
    if(!spatial&&!spatialFailure){try{
      spatial=new SugarChairSpatialViewer($('#sc-space-canvas'),{view:cached||defaultView,onSelect:value=>{const carbon=typeof value==='number'?value:value?.carbon;if(Number.isInteger(carbon)&&carbon>=1&&carbon<=5)selectCarbon(carbon);},onViewChange:view=>{if(!alive)return;rememberView(view);if(!settingPreset){if(spatialForm==='open-chain')state.chainPreset='free';else state.spatialPreset='free';}updateSpatialView();}});
    }catch{spatialFailure=true;$('#sc-space-canvas').innerHTML='<p class="sc-space-fallback">3D 顯示暫時不可用，仍可切換到畫法對照。</p>';}}
    if(spatial){
      const switched=spatialForm&&spatialForm!==form;if(switched)rememberView(spatial.getView());
      spatialForm=form;
      spatial.setMolecule(molecule,{showHydrogens:state.showHydrogens,selected:state.selected,focusAtoms:state.step===1?['C1','O1','O5']:[]});
      if(switched){spatial.setView(cached||defaultView,{notify:false});if(!cached)spatial.fit({notify:false});}
      rememberView(spatial.getView());
      $('#sc-space-status').textContent=state.step===1?(open?'開鏈：C1=O1；O5 是 C5–OH 的氧':'成環後：新增 O5–C1；O1 成為異頭 OH'):open?(state.chainPreset==='fischer'?'此碳：橫鍵朝你，縱鍵背你':'固定開鏈構象 · 可自由轉動'):chairWord(state.chair)+' · 拖曳只換視角';
    }else $('#sc-space-status').textContent='請切換到畫法對照，結構與自己的作答仍保留。';
    $('#sc-space-title').textContent=open?'開鏈糖，從空間中看':state.step===1?'成環後，同一組碳與氧':'同一把椅子，從空間中看';
    const paper=$('#sc-paper-reference');paper.hidden=state.step===1;
    paper.innerHTML=state.step===0?'<option value="fischer">完整 Fischer</option><option value="local">這個碳的立體約定</option>':'<option value="chair">標準椅式</option><option value="haworth">Haworth</option>';
    paper.value=state.step===0?state.chainReference:state.paperReference;
    $('#sc-paper-caption').textContent=state.step===1?(open?'開鏈 Fischer':'成環 Haworth'):'紙上的畫法';
    $('#sc-space-reference').innerHTML=state.step===0?(state.chainReference==='local'?localFischer(m):renderFischer(m)):state.step===1?(open?renderFischer(m):renderHaworth(m)):state.paperReference==='haworth'?renderHaworth(m):renderChair(m,{highlight:state.selected,showHydrogens:state.showHydrogens});
    $('#sc-paper-hint').hidden=state.step!==0;
    $('#sc-paper-hint').textContent=state.chainReference==='local'?'局部約定；可對準 C2–C5 逐一看。':'Fischer 逐碳表示配置；整條鏈不必長成平面的十字。';
    updateSpatialView();
  }
  function presetView(name){state.yaw=name==='other'?180:0;state.pitch=name==='under'?-45:25;state.spatialPreset=name;state.spatialView=null;render();if(spatial&&spatialForm==='ring'){spatial.setView({yaw:state.yaw,pitch:state.pitch,target:[0,0,0]},{notify:false});state.spatialView=spatial.getView();updateSpatialView();}}
  function alignFischer(){
    if(!openForm()||!spatial||state.selected===1)return;
    const view=sugarOpenChainFischerView(spatial.molecule,state.selected),canvas=$('#sc-space-canvas');
    const aspect=(canvas.clientWidth||1)/(canvas.clientHeight||1),frustumHeight=Math.max(view.frustumHeight,3.6/aspect);
    settingPreset=true;try{spatial.setView({...view,frustumHeight,zoom:1},{notify:false});state.chainView=spatial.getView();}finally{settingPreset=false;}
    updateSpatialView();
  }
  function chainView(name){
    if(name==='fischer'&&state.selected===1)state.selected=5;
    state.chainPreset=name;state.chainReference=name==='fischer'?'local':'fischer';if(name==='fischer')state.showHydrogens=true;
    render();if(name==='fischer')alignFischer();else if(spatial&&openForm()){spatial.setView(spatial.molecule.metadata.defaultView||{yaw:0,pitch:0,target:[0,0,0]},{notify:false});spatial.fit({notify:false});state.chainView=spatial.getView();updateSpatialView();}
  }
  function refreshSummary(){const text=summary();$('#sc-summary').value=text;$('#sc-save-status').textContent=state.saved?(state.saved.text===text?state.saved.message:state.saved.success?'目前操作已改變，尚未附加。':'目前內容尚未保存，請複製或重試。'):'';}
  function renderQuiz(){const q=questions(model())[state.quiz];$('#sc-quiz-prompt').textContent=q.prompt;$('#sc-quiz-choices').innerHTML=q.options.map(([value,label])=>`<label><input type="radio" name="sc-own-answer" value="${esc(value)}" ${state.answers[state.quiz]===value?'checked':''}> ${esc(label)}</label>`).join('');host.querySelectorAll('[data-sc-quiz]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.scQuiz===state.quiz)));const result=state.results[state.quiz];$('#sc-quiz-feedback').textContent=result?result.message+(state.revealed[state.quiz]&&!result.message.includes('已看推導')?'（已看推導）':''):state.revealed[state.quiz]?'推導：'+q.reason:'先選自己的答案；看推導會保留提示紀錄。';}
  function render(){
    if(!alive)return;
    const m=model(),step=state.step,row=m.rows.find(r=>r.carbon===state.selected),otherChair=state.chair==='4C1'?'1C4':'4C1',flipped=sugarState({...state,chair:otherChair});
    host.querySelectorAll('[data-sc-step]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.scStep===step)));
    host.querySelectorAll('[data-sc-anomer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scAnomer===state.anomer)));
    host.querySelectorAll('[data-sc-chair]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scChair===state.chair)));
    host.querySelectorAll('[data-sc-carbon]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.scCarbon===state.selected)));
    $('#sc-step-title').textContent=STEPS[step][1];$('#sc-identity').textContent=openForm()?state.series+'-'+m.name+' · 開鏈':(state.anomer==='alpha'?'α':'β')+'-'+state.series+'-'+m.name+' · 吡喃環';
    $('#sc-anomer-tools').hidden=step<2&&!(step===1&&state.closureStage==='ring');$('#sc-chair-tools').hidden=step<3||(step===5&&state.presentation==='paper');$('#sc-hydrogens-label').hidden=step===2;$('#sc-hydrogens').checked=state.showHydrogens;$('#sc-view-tools').hidden=step<3;
    $('#sc-chain-tools').hidden=!openForm()||state.presentation!=='spatial';$('#sc-align-fischer').textContent='對準 C'+(state.selected===1?5:state.selected)+' · Fischer';
    $('#sc-closure-tools').hidden=step!==1;host.querySelectorAll('[data-sc-closure]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scClosure===state.closureStage)));
    $('#sc-presentation-tools').hidden=!spatialStep();host.querySelectorAll('[data-sc-presentation]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scPresentation===state.presentation)));
    const figure=(label,svg)=>`<figure><figcaption>${esc(label)}</figcaption>${svg}</figure>`;
    const options={highlight:state.selected,showHydrogens:state.showHydrogens};
    const f=()=>renderFischer(m),h=()=>renderHaworth(m),c=(s=m,o={})=>renderChair(s,{...options,...o});
    let diagrams;
    if(step===0)diagrams=figure('開鏈 Fischer · 羰基在上',f())+figure('C'+(state.selected===1?5:state.selected)+' · 這個十字的立體含意',localFischer(m));
    if(step===1)diagrams=figure('開鏈 · 先讀 C2–C5',f())+figure('標準 Haworth · O 在右上',h());
    if(step===2)diagrams=figure('C1–OH 與 C5–CH₂OH 的相對面',h());
    if(step===3)diagrams=figure('Haworth · 先固定上／下',h())+figure(chairWord(state.chair)+' · 再決定 a／e',c());
    if(step===4)diagrams=figure('標準視角 · '+chairWord(state.chair),c())+figure((state.pitch<0?'由下面看':state.yaw===180?'從另一側看':'同一視角')+' · 同一個分子',c(m,{yaw:state.yaw,pitch:state.pitch}));
    if(step===5)diagrams=figure(chairWord(state.chair)+' · 翻轉前',c())+figure(chairWord(otherChair)+' · 翻轉後',c(flipped));
    $('#sc-diagrams').innerHTML=diagrams;$('#sc-diagrams').classList.toggle('sc-single',step===2);$('#sc-diagrams').hidden=spatialStep()&&state.presentation==='spatial';ensureSpatial(m);
    const fischer=row.fischer?(row.fischer==='right'?'右':'左'):state.selected===5?'O5 成環':'新異頭中心';
    $('#sc-selected').textContent=step===0?'C'+row.carbon+'：'+(row.fischer?'OH 在'+fischer:'開鏈 C1 是羰基，沒有 α／β'):step===1?'C'+row.carbon+'：'+(state.selected===5?'原 OH 的 O → 環氧；CH₂OH 向'+faceWord(row.face):state.selected===1?'羰基 → 新異頭 OH':fischer+' → '+faceWord(row.face)):step===2?'C1–OH '+faceWord(m.anomerFace)+' ／ C5–CH₂OH '+faceWord(m.referenceFace)+' → '+(state.anomer==='alpha'?'反面 α':'同面 β'):step===5?'C'+row.carbon+' '+row.group+'：'+faceWord(row.face)+' · '+posWord(row.position)+' → '+faceWord(row.face)+' · '+posWord(flipped.rows.find(r=>r.carbon===row.carbon).position):'C'+row.carbon+' '+row.group+'：'+faceWord(row.face)+' · '+posWord(row.position)+(step===4?'（視角改了，配置保持）':'');
    if(step===1&&state.presentation==='spatial'&&openForm())$('#sc-selected').textContent=state.selected===1?'C1=O1：平面羰基，尚無 α／β':state.selected===5?'C5–OH：O5 尚在環外；成環後它成為環氧':'C'+row.carbon+'–OH：Fischer 在'+fischer+'；成環前配置保留。';
    $('#sc-rule').textContent=[`只讀 C5：OH 在${state.series==='D'?'右 → D':'左 → L'}。其他碳位逐一判。`,'本頁標準擺法：右 → 下，左 → 上；C5 的 OH 氧成為環氧。',`α＝反面；β＝同面。${state.series} 系列的 CH₂OH 向${faceWord(m.referenceFace)}。`,'先固定上／下；對上此碳的軸向就是 a，另一個位置是 e。','追蹤 O 與碳號；紙面左右改變，D／L、α／β、a／e 保持。','翻椅：上／下保持，a ↔ e；D／L 和 α／β 保持。'][step];
    if(step===1&&state.presentation==='spatial')$('#sc-rule').textContent='O5 成為環氧；O1 成為異頭 OH。C2–C5 的配置保留，C1 才新增 α／β。';
    $('#sc-step-note').innerHTML=NOTES[step]+(step===0?'<p>3D 開鏈採固定的鋸齒示意構象。Fischer 是逐一考慮每個手性碳的投影，不是要求一條實體鏈同時把所有橫鍵朝前、縱鍵朝後。按「對準此碳」後，相機會轉到所選 C2–C5 的局部 Fischer 視角；選中的 OH／H 朝向你，兩側碳鏈背向你。切 D／L 改的是所有既有中心的鏡像配置；轉動相機不改 D／L。</p>':step===1?'<p>「開鏈／成環後」顯示兩個構造端點，以相同碳號和氧號追蹤：C5–O5 保留，新增 O5–C1，C1=O1 變成 C1–O1，O5 由羥基氧變成環氧，O1 則成為異頭 OH。開鏈 C1 是平面羰基；成環 C1 變成四面體，產生 α／β 兩種可能。半縮醛成環沒有淨失水。</p><p>本頁未模擬反應過渡路徑、電子移動、質子轉移或溶劑交換。氫只表示各端點的完整組成，不宣稱 O5 上那顆氫必定原封不動到 O1；兩個端點間的碳與氧才有對應身分。成環後的 3D 採椅式，Haworth 仍是方便看上下兩面的示意。</p>':'');
    if(openForm()){
      $('#sc-table-head').innerHTML='<tr><th>碳位</th><th>開鏈基團</th><th>標準 Fischer</th><th>手性中心</th></tr>';
      $('#sc-table').innerHTML=m.rows.map(r=>`<tr ${r.carbon===state.selected?'class="sc-row-selected"':''}><th>C${r.carbon}</th><td>${r.carbon===1?'CHO':`OH · O${r.carbon}`}</td><td>${r.carbon===1?'醛基在上':r.fischer==='right'?'右 OH':'左 OH'}</td><td>${r.carbon===1?'否 · 平面羰基':r.carbon===5?'是 · D／L 定義碳':'是'}</td></tr>`).join('')+'<tr><th>C6</th><td>CH₂OH</td><td>碳鏈下端</td><td>否</td></tr>';
    }else{
      $('#sc-table-head').innerHTML='<tr><th>碳位</th><th>環外基團</th><th>Fischer</th><th>環面</th><th>本椅式</th><th>翻椅後</th></tr>';
      $('#sc-table').innerHTML=m.rows.map(r=>`<tr ${r.carbon===state.selected?'class="sc-row-selected"':''}><th>C${r.carbon}</th><td>${esc(r.group)}</td><td>${r.fischer?(r.fischer==='right'?'右 OH':'左 OH'):r.carbon===5?'OH 氧成環':'羰基 → OH'}</td><td>${faceWord(r.face)}</td><td>${posWord(r.position)}</td><td>${posWord(flipped.rows.find(x=>x.carbon===r.carbon).position)}</td></tr>`).join('');
    }
    $('#sc-prev').disabled=step===0;$('#sc-next').disabled=step===5;
    renderQuiz();refreshSummary();
  }
  const quizKey=()=>[state.sugar,state.series,state.anomer,state.chair].join('/');
  let previousQuizKey=quizKey();
  function changeStructure(){state.quizArchive??={};state.quizArchive[previousQuizKey]={answers:state.answers,results:state.results,revealed:state.revealed};previousQuizKey=quizKey();const prior=state.quizArchive[previousQuizKey];state.answers=prior?.answers||{};state.results=prior?.results||{};state.revealed=prior?.revealed||{};render();if(openForm()&&state.chainPreset==='fischer')alignFischer();}
  function changeStep(step){state.step=step;if(step===0)state.selected=5;if(step===2)state.selected=1;render();if(openForm()&&state.chainPreset==='fischer')alignFischer();}
  function selectCarbon(carbon){
    const focus=host.ownerDocument.activeElement,svg=focus?.closest?.('svg'),holder=svg?.closest?.('#sc-diagrams, #sc-space-reference');
    const svgIndex=holder?[...holder.querySelectorAll('svg')].indexOf(svg):-1;
    state.selected=carbon;if(openForm()&&carbon===1&&state.chainPreset==='fischer'){state.chainPreset='free';state.chainReference='fischer';}render();if(openForm()&&state.chainPreset==='fischer')alignFischer();
    if(holder&&svgIndex>=0)holder.querySelectorAll('svg')[svgIndex]?.querySelector(`[data-chair-carbon="${carbon}"]`)?.focus();
  }
  const onClick=e=>{const button=e.target.closest('button');if(button&&host.contains(button)){
    if(button.dataset.scStep!==undefined)changeStep(+button.dataset.scStep);
    if(button.dataset.scCarbon!==undefined)selectCarbon(+button.dataset.scCarbon);
    if(button.dataset.scAnomer){state.anomer=button.dataset.scAnomer;changeStructure();}
    if(button.dataset.scChair){state.chair=button.dataset.scChair;changeStructure();}
    if(button.dataset.scView)presetView(button.dataset.scView);
    if(button.dataset.scChainView)chainView(button.dataset.scChainView);
    if(button.dataset.scClosure){state.closureStage=button.dataset.scClosure;render();if(openForm()&&state.chainPreset==='fischer')alignFischer();}
    if(button.dataset.scPresentation){state.presentation=button.dataset.scPresentation;render();}
    if(button.dataset.scRotate)spatial?.rotate(button.dataset.scRotate);
    if(button.dataset.scZoom)spatial?.zoomBy(button.dataset.scZoom==='in'?1.2:1/1.2);
    if(button.dataset.scQuiz!==undefined){state.quiz=+button.dataset.scQuiz;renderQuiz();}
  }const atom=e.target.closest('[data-chair-carbon]');if(atom&&host.contains(atom))selectCarbon(+atom.dataset.chairCarbon);};
  const onKey=e=>{const atom=e.target.closest('[data-chair-carbon]');if(atom&&['Enter',' '].includes(e.key)){e.preventDefault();selectCarbon(+atom.dataset.chairCarbon);}};
  const onChange=e=>{if(e.target.name==='sc-own-answer'){state.answers[state.quiz]=e.target.value;delete state.results[state.quiz];renderQuiz();refreshSummary();}};
  host.addEventListener('click',onClick);host.addEventListener('keydown',onKey);host.addEventListener('change',onChange);
  $('#sc-sugar').onchange=e=>{state.sugar=e.target.value;changeStructure();};
  $('#sc-series').onchange=e=>{state.series=e.target.value;state.chair=state.series==='D'?'4C1':'1C4';changeStructure();};
  $('#sc-hydrogens').onchange=e=>{state.showHydrogens=e.target.checked;render();};
  $('#sc-paper-reference').onchange=e=>{if(state.step===0){state.chainReference=e.target.value;if(state.chainReference==='local')chainView('fischer');else render();}else{state.paperReference=e.target.value;render();}};
  $('#sc-open-space').onclick=()=>{state.presentation='spatial';changeStep(3);$('#sc-spatial-workspace').scrollIntoView({block:'center',behavior:'instant'});};
  $('#sc-prev').onclick=()=>changeStep(Math.max(0,state.step-1));$('#sc-next').onclick=()=>changeStep(Math.min(5,state.step+1));
  $('#sc-quiz-check').onclick=()=>{const q=questions(model())[state.quiz],answer=state.answers[state.quiz];if(!answer){$('#sc-quiz-feedback').textContent='先選自己的答案；空白不算答錯或答對。';return;}const correct=answer===q.correct;state.results[state.quiz]={correct,message:(correct?'核對相符。':'還要修正。')+' '+q.reason+(state.revealed[state.quiz]?'（已看推導）':'')};renderQuiz();refreshSummary();};
  $('#sc-quiz-reveal').onclick=()=>{state.revealed[state.quiz]=true;const q=questions(model())[state.quiz];$('#sc-quiz-feedback').textContent='推導：'+q.reason+' 原答案保留，沒有代選。';refreshSummary();};
  $('#sc-reason').oninput=e=>{state.reason=e.target.value;refreshSummary();};
  $('#sc-save').onclick=async()=>{const text=summary();let success=false;try{success=Boolean(await onSaveSummary?.(text));}catch{}if(!alive)return;state.saved={text,success,message:success?'已附加到本課筆記。':'尚未保存；文字保留，可複製或重試。'};refreshSummary();};
  render();
  return ()=>{alive=false;spatial?.dispose();spatial=null;host.removeEventListener('click',onClick);host.removeEventListener('keydown',onKey);host.removeEventListener('change',onChange);host.replaceChildren();};
}
