function ver(){ return "<p class='sub' style='text-align:center;margin-top:18px'>YUDOBA V64</p>"; }
(function(){
  var s=document.createElement("style");
  s.textContent=
    "body.home-fit #app{display:flex;flex-direction:column;min-height:100dvh;padding-bottom:12px;box-sizing:border-box}" +
    ".yd-hero{margin:4px 0 8px}" +
    ".yd-hero img{width:min(196px,46vw);height:min(196px,46vw);border-radius:36px}" +
    ".yd-sqgrid{gap:8px;flex:1;align-content:stretch}" +
    ".yd-sq.ic svg{width:52px;height:52px}" +
    ".yd-sq.ic span{font-size:1.02rem}" +
    "body.home-fit .btn-main{margin-bottom:8px}" +
    "@media (max-height:700px){.yd-hero img{width:min(168px,40vw);height:min(168px,40vw)}.yd-sq.ic svg{width:46px;height:46px}}" +
    "@media (max-height:620px){.yd-hero img{width:min(140px,36vw);height:min(140px,36vw)}.yd-sq.ic{gap:4px}.yd-sq.ic svg{width:40px;height:40px}.yd-sq.ic span{font-size:.92rem}}";
  document.head.appendChild(s);
})();
var _r64 = render;
render = function () {
  document.body.classList.toggle("home-fit", screen === "home" || !screen);
  _r64();
};
