(function(){
  "use strict";
  // ====== 設定（実運用時に編集） ======
  var HS_CONFIG = {
    // LINE公式アカウントのURL。設定すると予約ボタン/モーダル内ボタンがここに飛びます。
    // 空のままならデモのモーダルフォームが開きます。
    lineUrl: "",
    // WordPress(Contact Form 7)の送信先。フォームID 38 の REST フィードバックURL。
    reservationEndpoint: "https://wordpress.unwired.jp/wp-json/contact-form-7/v1/contact-forms/38/feedback",
    cf7FormId: "38"
  };

  var root = document.getElementById("hidamari-salon");
  if(!root) return;

  // ====== Data ======
  var MENU = {
    cut:{ label:"カット", items:[
      {name:"じっくりカウンセリングカット",price:"¥6,600",time:"90分",note:"シャンプー・ブロー込み"},
      {name:"前髪のお直し",price:"¥1,100",time:"20分",note:"1ヶ月以内・無料"},
      {name:"メンズカット",price:"¥5,500",time:"60分",note:""}
    ]},
    color:{ label:"カラー", items:[
      {name:"似合わせ艶カラー",price:"¥8,800〜",time:"150分",note:"髪と頭皮にやさしい処方",recommend:true},
      {name:"白髪となじむデザインカラー",price:"¥11,000〜",time:"180分",note:"白髪をぼかしてハイライト"},
      {name:"リタッチカラー",price:"¥6,600",time:"120分",note:"根元のみ"}
    ]},
    perm:{ label:"パーマ", items:[
      {name:"ふんわり大人パーマ",price:"¥11,000〜",time:"180分",note:"カット込み"},
      {name:"縮毛矯正",price:"¥18,700〜",time:"240分",note:"髪を傷めにくい薬剤を使用"}
    ]},
    spa:{ label:"スパ・ケア", items:[
      {name:"お疲れ癒しヘッドスパ",price:"¥4,400",time:"40分",note:"オーガニックオイル使用",recommend:true},
      {name:"髪質改善トリートメント",price:"¥6,600",time:"60分",note:"3回コースがおすすめ"},
      {name:"炭酸スパシャンプー",price:"¥1,650",time:"15分",note:"メニュープラスで"}
    ]}
  };
  var STYLISTS = [
    {name:"Aoi Mizuhara",nameJp:"水原 葵",role:"オーナー / スタイリスト",years:"美容師歴 14年",tags:["大人カラー","似合わせカット","白髪ぼかし"],msg:"「いつもより、ちょっと素敵な自分」が、毎日を軽くしてくれると思っています。気軽な雑談から、はじめさせてください。",photo:"images/stylist-aoi.jpg"},
    {name:"Mio Sato",nameJp:"佐藤 美桜",role:"スタイリスト",years:"美容師歴 8年",tags:["ヘッドスパ","髪質改善","ショート"],msg:"髪も頭皮も、ご機嫌に。植物の力を借りたケアが得意です。",photo:"images/stylist-mio.jpg"}
  ];
  var RESERVE_MENUS = ["じっくりカウンセリングカット","似合わせ艶カラー","白髪となじむデザインカラー","ふんわり大人パーマ","お疲れ癒しヘッドスパ","髪質改善トリートメント","はじめての方セット"];
  var RESERVE_STYLISTS = ["指名なし（おまかせ）","水原 葵","佐藤 美桜"];
  var TIMES = ["10:00","11:00","13:00","14:30","16:00","17:30"];
  var STEP_LABELS = ["メニュー","担当者","日時","ご連絡先","確認"];

  function el(html){ var d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstChild; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  // ====== Header scroll ======
  var header = document.getElementById("hs-header");
  function onScroll(){ if(window.scrollY>40) header.classList.add("scrolled"); else header.classList.remove("scrolled"); }
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();

  // ====== Mobile burger ======
  document.getElementById("hs-burger").addEventListener("click", function(){ header.classList.toggle("menu-open"); });

  // ====== Smooth nav ======
  root.querySelectorAll("[data-nav]").forEach(function(a){
    a.addEventListener("click", function(e){
      e.preventDefault();
      header.classList.remove("menu-open");
      var id=a.getAttribute("data-nav");
      if(id==="hs-top"){ window.scrollTo({top:0,behavior:"smooth"}); return; }
      var t=document.getElementById(id);
      if(t){ var y=t.getBoundingClientRect().top+window.scrollY-80; window.scrollTo({top:y,behavior:"smooth"}); }
    });
  });

  // ====== Render menu ======
  var tabsEl=document.getElementById("hs-menu-tabs");
  var listEl=document.getElementById("hs-menu-list");
  var tabKeys=Object.keys(MENU);
  var curTab="cut";
  tabKeys.forEach(function(k){
    var b=el('<button class="hs-menu-tab">'+esc(MENU[k].label)+'</button>');
    b.addEventListener("click", function(){ curTab=k; renderTabs(); renderMenu(); });
    b.dataset.k=k; tabsEl.appendChild(b);
  });
  function renderTabs(){ tabsEl.querySelectorAll(".hs-menu-tab").forEach(function(b){ b.classList.toggle("active", b.dataset.k===curTab); }); }
  function renderMenu(){
    listEl.innerHTML="";
    MENU[curTab].items.forEach(function(it){
      var card=el(
        '<article class="hs-menu-card'+(it.recommend?' recommend':'')+'">'+
          (it.recommend?'<div class="hs-menu-badge">人気</div>':'')+
          '<div class="hs-menu-card-top"><h3>'+esc(it.name)+'</h3><div class="hs-menu-time">⏱ '+esc(it.time)+'</div></div>'+
          (it.note?'<p class="hs-menu-note">'+esc(it.note)+'</p>':'')+
          '<div class="hs-menu-price-row"><div class="hs-menu-price">'+esc(it.price)+'</div>'+
          '<button class="hs-menu-book">予約する →</button></div>'+
        '</article>'
      );
      card.querySelector(".hs-menu-book").addEventListener("click", function(){ openReserve(it.name, null); });
      listEl.appendChild(card);
    });
  }
  renderTabs(); renderMenu();

  // ====== Render stylists ======
  var sg=document.getElementById("hs-stylist-grid");
  STYLISTS.forEach(function(s){
    var firstName=s.nameJp.split(" ")[0];
    var card=el(
      '<article class="hs-stylist-card">'+
        '<div class="hs-stylist-photo"><div class="hs-stylist-frame"></div>'+
          '<img class="hs-img" src="'+esc(s.photo)+'" alt="スタイリスト '+esc(s.nameJp)+'" style="aspect-ratio:4/5;border-radius:2rem;" /></div>'+
        '<div class="hs-stylist-body">'+
          '<div class="hs-stylist-role">'+esc(s.role)+'</div>'+
          '<h3 class="hs-stylist-name">'+esc(s.nameJp)+'<span class="hs-stylist-name-en">'+esc(s.name)+'</span></h3>'+
          '<div class="hs-stylist-years">'+esc(s.years)+'</div>'+
          '<div class="hs-stylist-tags">'+s.tags.map(function(t){return '<span>#'+esc(t)+'</span>';}).join("")+'</div>'+
          '<blockquote class="hs-stylist-msg"><span class="hs-qmark">“</span>'+esc(s.msg)+'</blockquote>'+
          '<button class="hs-btn-outline">'+esc(firstName)+'さんを指名して予約</button>'+
        '</div>'+
      '</article>'
    );
    card.querySelector(".hs-btn-outline").addEventListener("click", function(){ openReserve(null, s.nameJp); });
    sg.appendChild(card);
  });

  // ====== Reserve modal ======
  var modal=document.getElementById("hs-modal");
  var modalBody=document.getElementById("hs-modal-body");
  document.getElementById("hs-modal-close").addEventListener("click", closeReserve);
  modal.addEventListener("click", function(e){ if(e.target===modal) closeReserve(); });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape" && !modal.hidden) closeReserve(); });

  var state={step:0,menu:"",stylist:"指名なし（おまかせ）",date:"",time:"",name:"",phone:"",note:"",submitted:false,submitting:false,submitError:false};

  function openReserve(menu, stylist){
    // LINE URLが設定されていれば外部へ
    if(HS_CONFIG.lineUrl){ window.open(HS_CONFIG.lineUrl,"_blank","noopener"); return; }
    state={step:0,menu:menu||"",stylist:stylist||"指名なし（おまかせ）",date:"",time:"",name:"",phone:"",note:"",submitted:false,submitting:false,submitError:false};
    modal.hidden=false; document.body.style.overflow="hidden"; renderModal();
  }
  function closeReserve(){ modal.hidden=true; document.body.style.overflow=""; }

  function submitReservation(){
    state.submitting=true; state.submitError=false; renderModal();
    var fd=new FormData();
    fd.append("_wpcf7", HS_CONFIG.cf7FormId);
    fd.append("reservation-name", state.name);
    fd.append("reservation-phone", state.phone);
    fd.append("reservation-menu", state.menu);
    fd.append("reservation-stylist", state.stylist);
    fd.append("reservation-date", state.date+" "+state.time);
    fd.append("reservation-time", state.time);
    fd.append("reservation-note", state.note);

    fetch(HS_CONFIG.reservationEndpoint, { method:"POST", body:fd })
      .then(function(res){ return res.json(); })
      .then(function(data){
        state.submitting=false;
        if(data && data.status==="mail_sent"){ state.submitted=true; } else { state.submitError=true; }
        renderModal();
      })
      .catch(function(){ state.submitting=false; state.submitError=true; renderModal(); });
  }

  // 予約トリガ（ヘッダー/ヒーロー/フローティング/バナー）
  root.querySelectorAll("[data-reserve]").forEach(function(b){
    b.addEventListener("click", function(){ openReserve(b.getAttribute("data-menu")||null, null); });
  });

  function genDates(){
    var days=["日","月","火","水","木","金","土"], out=[], now=new Date(); now.setHours(0,0,0,0);
    for(var i=0;i<14;i++){ var d=new Date(now); d.setDate(now.getDate()+i+1); var dow=d.getDay();
      out.push({dateStr:(d.getMonth()+1)+"/"+d.getDate(),day:days[dow],dow:dow,closed:dow===2}); }
    return out;
  }
  var DATES=genDates();

  function renderModal(){
    if(state.submitted){ renderDone(); return; }
    if(state.submitError){ renderError(); return; }
    var canNext=[state.menu, true, (state.date&&state.time), (state.name&&state.phone), true][state.step];
    var html='';
    html+='<div class="hs-modal-head"><div class="hs-modal-eyebrow"><span style="font-family:inherit">✎</span><span>reservation</span></div><h3>ご予約フォーム</h3></div>';
    html+='<div class="hs-steps">';
    STEP_LABELS.forEach(function(l,i){
      var cls=i===state.step?'active':(i<state.step?'done':'');
      html+='<div class="hs-step-pill '+cls+'"><span class="hs-step-num">'+(i+1)+'</span><span>'+esc(l)+'</span></div>';
    });
    html+='</div><div class="hs-step-body">';

    if(state.step===0){
      html+='<div class="hs-opt-grid">';
      RESERVE_MENUS.forEach(function(m){ html+='<button class="hs-opt'+(state.menu===m?' selected':'')+'" data-m="'+esc(m)+'">'+esc(m)+'</button>'; });
      html+='</div>';
    } else if(state.step===1){
      html+='<div class="hs-opt-grid wide">';
      RESERVE_STYLISTS.forEach(function(s){ html+='<button class="hs-opt'+(state.stylist===s?' selected':'')+'" data-s="'+esc(s)+'">'+esc(s)+'</button>'; });
      html+='<p class="hs-opt-note">指名料はいただいておりません。</p></div>';
    } else if(state.step===2){
      html+='<div class="hs-dt-label">日にち</div><div class="hs-dt-dates">';
      DATES.forEach(function(d){ var val=d.dateStr+"("+d.day+")";
        html+='<button class="hs-dt-date'+(state.date===val?' selected':'')+'" data-date="'+esc(val)+'"'+(d.closed?' disabled':'')+'>'+
          '<span class="hs-dt-dow hs-dow-'+d.dow+'">'+d.day+'</span><span class="hs-dt-num">'+d.dateStr+'</span>'+(d.closed?'<span class="hs-dt-closed">休</span>':'')+'</button>';
      });
      html+='</div><div class="hs-dt-label">ご希望の時間</div><div class="hs-dt-times">';
      TIMES.forEach(function(t){ html+='<button class="hs-dt-time'+(state.time===t?' selected':'')+'" data-time="'+esc(t)+'"'+(state.date?'':' disabled')+'>'+t+'</button>'; });
      html+='</div>'+(state.date?'':'<p class="hs-opt-note">先に日にちを選択してください。</p>');
    } else if(state.step===3){
      html+='<div class="hs-fields">'+
        '<label><span>お名前</span><input type="text" id="hs-f-name" value="'+esc(state.name)+'" placeholder="山田 花子"></label>'+
        '<label><span>お電話番号</span><input type="tel" id="hs-f-phone" value="'+esc(state.phone)+'" placeholder="090-0000-0000"></label>'+
        '<label><span>ご希望・ご相談（任意）</span><textarea id="hs-f-note" rows="3" placeholder="髪のお悩みや、なりたい雰囲気など、お気軽にどうぞ。">'+esc(state.note)+'</textarea></label>'+
      '</div>';
    } else if(state.step===4){
      html+='<div class="hs-confirm">'+
        '<div class="hs-confirm-row"><span>メニュー</span><b>'+esc(state.menu)+'</b></div>'+
        '<div class="hs-confirm-row"><span>担当者</span><b>'+esc(state.stylist)+'</b></div>'+
        '<div class="hs-confirm-row"><span>日時</span><b>'+esc(state.date)+' '+esc(state.time)+'</b></div>'+
        '<div class="hs-confirm-row"><span>お名前</span><b>'+esc(state.name)+' 様</b></div>'+
        '<div class="hs-confirm-row"><span>お電話番号</span><b>'+esc(state.phone)+'</b></div>'+
        (state.note?'<div class="hs-confirm-row"><span>ご希望</span><b>'+esc(state.note)+'</b></div>':'')+
        '<p class="hs-confirm-note">内容を確認のうえ、「予約を確定する」を押してください。</p></div>';
    }
    html+='</div>';
    html+='<div class="hs-modal-foot"><button class="hs-btn-back"'+(state.step===0?' disabled':'')+'>← 戻る</button>';
    if(state.step<4){ html+='<button class="hs-btn-primary"'+(canNext?'':' disabled')+'>次へ <span class="hs-arrow">→</span></button>'; }
    else{ html+='<button class="hs-btn-primary"'+(state.submitting?' disabled':'')+'>'+(state.submitting?'送信中…':'予約を確定する <span class="hs-arrow">→</span>')+'</button>'; }
    html+='</div>';

    modalBody.innerHTML=html;
    bindModal();
  }

  function bindModal(){
    modalBody.querySelectorAll("[data-m]").forEach(function(b){ b.addEventListener("click", function(){ state.menu=b.getAttribute("data-m"); renderModal(); }); });
    modalBody.querySelectorAll("[data-s]").forEach(function(b){ b.addEventListener("click", function(){ state.stylist=b.getAttribute("data-s"); renderModal(); }); });
    modalBody.querySelectorAll("[data-date]").forEach(function(b){ if(b.disabled) return; b.addEventListener("click", function(){ state.date=b.getAttribute("data-date"); renderModal(); }); });
    modalBody.querySelectorAll("[data-time]").forEach(function(b){ if(b.disabled) return; b.addEventListener("click", function(){ state.time=b.getAttribute("data-time"); renderModal(); }); });
    var nameI=modalBody.querySelector("#hs-f-name"), phoneI=modalBody.querySelector("#hs-f-phone"), noteI=modalBody.querySelector("#hs-f-note");
    if(nameI) nameI.addEventListener("input", function(){ state.name=nameI.value; var n=modalBody.querySelector(".hs-modal-foot .hs-btn-primary"); if(n) n.disabled=!(state.name&&state.phone); });
    if(phoneI) phoneI.addEventListener("input", function(){ state.phone=phoneI.value; var n=modalBody.querySelector(".hs-modal-foot .hs-btn-primary"); if(n) n.disabled=!(state.name&&state.phone); });
    if(noteI) noteI.addEventListener("input", function(){ state.note=noteI.value; });
    var back=modalBody.querySelector(".hs-btn-back"); if(back) back.addEventListener("click", function(){ if(state.step>0){ state.step--; renderModal(); } });
    var next=modalBody.querySelector(".hs-modal-foot .hs-btn-primary");
    if(next) next.addEventListener("click", function(){ if(next.disabled) return; if(state.step<4){ state.step++; renderModal(); } else { submitReservation(); } });
  }

  function renderError(){
    modalBody.innerHTML=
      '<div class="hs-done">'+
        '<h3>送信に失敗しました。</h3>'+
        '<p>恐れ入りますが、しばらくしてから再度お試しいただくか、<br>LINEまたはお電話にてご連絡ください。</p>'+
        '<button class="hs-btn-primary" id="hs-err-retry">もう一度送信する</button>'+
        '<div><a class="hs-line-quick" id="hs-err-close">閉じる</a></div>'+
      '</div>';
    modalBody.querySelector("#hs-err-retry").addEventListener("click", function(){ submitReservation(); });
    modalBody.querySelector("#hs-err-close").addEventListener("click", closeReserve);
  }

  function renderDone(){
    modalBody.innerHTML=
      '<div class="hs-done">'+
        '<div class="hs-done-mark"><svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 2C12 8 14 10 22 12C14 14 12 16 12 22C12 16 10 14 2 12C10 10 12 8 12 2Z" fill="var(--hs-terra)"/></svg></div>'+
        '<h3>ご予約ありがとうございます。</h3>'+
        '<p>ご入力いただいた電話番号宛に、<br>担当より仮予約のご連絡を差し上げます。<br>（通常24時間以内）</p>'+
        '<div class="hs-done-summary">'+
          '<div><span>メニュー</span><b>'+esc(state.menu)+'</b></div>'+
          '<div><span>担当者</span><b>'+esc(state.stylist)+'</b></div>'+
          '<div><span>日時</span><b>'+esc(state.date)+' '+esc(state.time)+'</b></div>'+
          '<div><span>お名前</span><b>'+esc(state.name)+' 様</b></div>'+
        '</div>'+
        '<button class="hs-btn-primary" id="hs-done-close">閉じる</button>'+
        '<div><a class="hs-line-quick" id="hs-done-line"><span class="hs-line-dot"></span>LINEで担当に直接相談する</a></div>'+
      '</div>';
    modalBody.querySelector("#hs-done-close").addEventListener("click", closeReserve);
    modalBody.querySelector("#hs-done-line").addEventListener("click", function(){ if(HS_CONFIG.lineUrl) window.open(HS_CONFIG.lineUrl,"_blank","noopener"); else closeReserve(); });
  }
})();
