// 目前公開的版本。舊版本網址（書籤、歷史紀錄）會被換到這個版本的同一頁；由 publish/version_guard.py 產生。
(function(){
  var CURRENT="b13-20261111",PREVIEW=[],PAGES=["", "index.html", "start.html", "past-exams.html", "study-plan.html", "exam.html", "exam-map.html", "gap-lessons.html", "terms.html", "structures.html", "third-party-attributions.html", "lactase-continuous.html"];
  var m=location.pathname.match(/^(.*\/versions\/)([^\/]+)\/(.*)$/);
  if(!m||m[2]===CURRENT||PREVIEW.indexOf(m[2])>=0)return;
  var same=PAGES.indexOf(m[3])>=0;
  location.replace(m[1]+CURRENT+'/'+(same?m[3]+location.search+location.hash:'start.html'));
})();
