// ==UserScript==
// @name        Zhihu To Markdown
// @namespace   Violentmonkey Scripts
// @match       https://www.zhihu.com/
// @match       https://www.zhihu.com/question/**/answer/**
// @match       https://zhuanlan.zhihu.com/p/**
// @grant       GM_getClipboard
// @grant       GM_setClipboard
// @version     1.3
// @author      ExpZero
// @description 2025/5/10 11:02:01
// ==/UserScript==

'use strict';

function handleElement(e) {
    // 普通的 <p>
    function handleTag_p(e) {
        // 更多改进：需要支持内嵌的<code>
        return e.outerText;
    }

    // 带文字图片
    function handleTag_figure(e) {
        var text = e.outerText;
        if (!text || text == '') {
            var text = "img";
        }
        var imgHtml = e.querySelector("img");
        var imgUrl = imgHtml.getAttribute("data-original");
        if (!imgUrl || imgUrl == '') {
            var imgUrl = imgHtml.getAttribute("src");
        }
        imgUrl = imgUrl.split('?')[0];
        return "![" + text + "](" + imgUrl + ")";
    }

    // 跳转链接 class == "RichText-LinkCardContainer"
    function handleTag_class_urlLink(e) {
        let url = e.firstChild.href;
        return decodeURIComponent(url.substring(31));
    }

    // 未实现
    // 代码高亮 class == highlight，
    function handleTag_class_highlight(e) {
        // 未实现
        // 例如 https://zhuanlan.zhihu.com/p/634796906
    }
    // 未实现
    // 表格
    function handleTag_table(e){
      // 例如 https://zhuanlan.zhihu.com/p/634796906
    }

    // 处理 <h2>
    function handleTag_h2(e) {
        return "### " + e.outerText
    }
    // 处理 <h3>
    function handleTag_h3(e) {
        return "#### " + e.outerText
    }
    // 处理 blockquote 块引用
    function handleTag_blockquote(e){
        return "> " + e.outerText
    }

    // 处理 <ul>
    function handleTag_ul(e){
        let str = "" ;
        for(let li of e.children) {
            str += "- " + li.outerText + "\n\n";
        }
        return str;
    }

    // 处理 <hr>
    function handleTag_hr(e) {
        return "------";
    }

    var tagName = e.tagName.toLowerCase();
    // 判断节点类型
    if (tagName === 'p') {
        return handleTag_p(e);
    } else if (tagName === 'h2') {
        return handleTag_h2(e);
    }else if (tagName === 'h3') {
        return handleTag_h3(e);
    }else if (tagName === 'figure') {
        return handleTag_figure(e);
    }else if (tagName === 'ul'){
      return handleTag_ul(e);
    }else if (tagName === 'blockquote'){
      return handleTag_blockquote(e);
    }else if (tagName === 'div') {
        if (e.className === "RichText-LinkCardContainer") {
            return handleTag_class_urlLink(e);
        } else {
            return "[Error] Unknown Element! ---> " + e.innerHTML;
        }
    } else if (tagName === 'hr') {
        return handleTag_hr(e);
    } else {
        return "[Error] Unknown Element! ---> " + e.innerHTML;
    }
}

function getTitle(){
  const host =window.location.host;
  if(host === 'zhuanlan.zhihu.com'){
    return "# " + document.querySelector(".Post-Title").outerText;
  }else{
    return "# " + document.querySelector(".QuestionHeader-title").outerText;
  }
}

function getAuthor(){
  let authorinfo = document.querySelector('span[class="UserLink AuthorInfo-name"]').querySelector("a");
  let href = authorinfo.href;
  let user = authorinfo.outerText;
  return "[" + user + "](" + href + ")";
}

function getContent() {
    var content = document.querySelector(".RichContent-inner"); // 问答
    if(!content){
      var content = document.querySelector(".Post-RichTextContainer"); // 专栏

    }
    var nodes = content.querySelector("[options='[object Object]']").children;
    var rebuild_content = "";
    for (let node of nodes) {
        rebuild_content += handleElement(node);
        rebuild_content += "\n\n"
    }
    return rebuild_content;
}

function getTail() {
    var content_time = document.querySelector(".ContentItem-time");
    //var content_firstpost = content_time.firstChild.getAttribute("data-tooltip");
    var content_tail = content_time.outerText;
    /*
    if (!content_tail.includes(content_firstpost)) {
        content_tail = content_firstpost + "  " + content_tail;
    }*/
    var href = content_time.href;
    if(!href){
      href = window.location.href;
    }

    return "[" + content_tail + "](" + href + ")";
}

function getCards(){
  return document.querySelector('div[class="ListShortcut"]').querySelector('div[role="list"]');
}

function getCardContent(e) {
    var content = e.querySelector(".RichContent-inner"); // 问答
    if(!content){
      var content = e.querySelector(".Post-RichTextContainer"); // 专栏

    }
    var nodes = content.querySelector("[options='[object Object]']").children;
    var rebuild_content = "";
    for (let node of nodes) {
        rebuild_content += handleElement(node);
        rebuild_content += "\n\n"
    }
    return rebuild_content;
}

function rmCardSelf(card) {
    card.parentNode.removeChild(card);
}

// 去除广告卡，输入是原始网页的卡列表
function rmAdCards(cards_raw){
    let ad_list = cards_raw.querySelectorAll('div[class="Card TopstoryItem TopstoryItem--advertCard TopstoryItem-isRecommend"]');
    Array.from(ad_list).forEach((card)=>{rmCardSelf(card)});
}

function getNormalCardsArray(cards_raw){
    return cards_raw.querySelectorAll('div[class="Card TopstoryItem TopstoryItem-isRecommend"]');
}

function genMdButton(fn){
    let btn = document.createElement('div');
    //btn.innerHTML = '<button type="button" class="Button Menu-item ShareMenu-button Button--plain"><svg width="17" height="17" viewBox="0 0 24 24" color="#9FADC7" fill="currentColor"><path fill-rule="evenodd" d="M5.327 18.883a3.005 3.005 0 0 1 0-4.25l2.608-2.607a.75.75 0 1 0-1.06-1.06l-2.608 2.607a4.505 4.505 0 0 0 6.37 6.37l2.608-2.607a.75.75 0 0 0-1.06-1.06l-2.608 2.607a3.005 3.005 0 0 1-4.25 0Zm5.428-11.799a.75.75 0 0 0 1.06 1.06L14.48 5.48a3.005 3.005 0 0 1 4.25 4.25l-2.665 2.665a.75.75 0 0 0 1.061 1.06l2.665-2.664a4.505 4.505 0 0 0-6.371-6.372l-2.665 2.665Zm5.323 2.117a.75.75 0 1 0-1.06-1.06l-7.072 7.07a.75.75 0 0 0 1.061 1.06l7.071-7.07Z" clip-rule="evenodd"></path></svg>Md</button>';
    btn.innerHTML = '<button class="Button Menu-item ShareMenu-button Button--plain"><svg width="17" height="17" viewBox="0 0 24 24" color="#9FADC7" fill="currentColor"><path fill-rule="evenodd" d="M5.327 18.883a3.005 3.005 0 0 1 0-4.25l2.608-2.607a.75.75 0 1 0-1.06-1.06l-2.608 2.607a4.505 4.505 0 0 0 6.37 6.37l2.608-2.607a.75.75 0 0 0-1.06-1.06l-2.608 2.607a3.005 3.005 0 0 1-4.25 0Zm5.428-11.799a.75.75 0 0 0 1.06 1.06L14.48 5.48a3.005 3.005 0 0 1 4.25 4.25l-2.665 2.665a.75.75 0 0 0 1.061 1.06l2.665-2.664a4.505 4.505 0 0 0-6.371-6.372l-2.665 2.665Zm5.323 2.117a.75.75 0 1 0-1.06-1.06l-7.072 7.07a.75.75 0 0 0 1.061 1.06l7.071-7.07Z" clip-rule="evenodd"></path></svg>Md</button>';
    btn.addEventListener('click',fn);
    return btn;
}

function addBtnToCard(card,btn){
    var bottom_bar = card.querySelector('div[class="ContentItem-actions"]');
    if(bottom_bar==null){bottom_bar=card.querySelector('div[class="ContentItem-actions Sticky RichContent-actions is-bottom"]');};
    if(bottom_bar==null){bottom_bar=card.querySelector('div[class="ContentItem-actions Sticky RichContent-actions is-fixed is-bottom"]');};
    if(bottom_bar){
      const bottom_bar_more = bottom_bar.querySelector('div[class="Popover ContentItem-action"]');
      // const bottom_bar_share = bottom_bar.querySelector('div[class="Popover ShareMenu ContentItem-action"]');
      if(bottom_bar_more){
        bottom_bar.insertBefore(btn,bottom_bar_more);
      }
    }else{
      // console.log('----> Fail to locate bottom_bar: ');
    }
}


function pcssCard(){
    let cards_raw = getCards();
    // 去除广告卡
    rmAdCards(cards_raw);
    // 增加转Markdown按钮
    let cards = getNormalCardsArray(cards_raw);
    cards.forEach(
      (card)=>{
        if(card.querySelector('div[id="md-btn"]')==null){
            let btn = genMdButton(function(){
                let node = this.parentNode.parentNode.parentNode.parentNode;
                let content = getCardContent(node);
                GM_setClipboard(content.toString(),"text");
            });
            btn['id'] = "md-btn";
            addBtnToCard(card,btn);
        }
      });
}



if (window.location.pathname === '/'){
  setInterval(pcssCard,1000);
}else{
  let title = getTitle();
  let str = getContent();
  str += "来自：" + getAuthor() + "    " + getTail();
  console.log(title + "\n\n" + str);
}

