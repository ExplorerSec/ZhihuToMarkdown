// ==UserScript==
// @name        Zhihu To Markdown
// @namespace   Violentmonkey Scripts
// @match       https://www.zhihu.com/question/**/answer/**
// @match       https://zhuanlan.zhihu.com/p/**
// @grant       none
// @version     1.2
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

let title = getTitle();

let str = getContent();
str += "来自：" + getAuthor() + "    " + getTail();

console.log(title + "\n\n" + str);
