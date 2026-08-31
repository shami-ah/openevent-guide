var OpenEventGuide=(function(N){"use strict";const oe="oe-guide-overlay",j="oe-guide-subtitle",C="oe-guide-highlight",D="oe-guide-spotlight",B="oe-guide-step-badge";let $=null,h=null,m=null,b=null,S=null,z=null,M=null,L=null;const T=6;function Ee(){if(document.getElementById("oe-guide-overlay-styles"))return;const e=document.createElement("style");e.id="oe-guide-overlay-styles",e.textContent=`
    #${oe} {
      position: fixed; inset: 0; pointer-events: none; z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Raised to 96px so it clears the guide bubble and the call pill. */
    #${j} {
      position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%);
      max-width: min(600px, calc(100vw - 32px));
      padding: 12px 24px;
      background: rgba(0, 0, 0, 0.85); color: #fff;
      font-size: 16px; line-height: 1.5; border-radius: 12px; text-align: center;
      opacity: 0; transition: opacity 0.3s ease;
      z-index: 100001; pointer-events: none; backdrop-filter: blur(8px);
    }
    #${j}.visible { opacity: 1; }

    #${D} {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
      opacity: 0; transition: opacity 0.3s ease;
      z-index: 99998; pointer-events: none;
    }
    #${D}.visible { opacity: 1; }

    #${C} {
      position: fixed;
      border: 3px solid #6366f1; border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25), 0 0 20px rgba(99, 102, 241, 0.3);
      opacity: 0; z-index: 100000; pointer-events: none;
    }
    /* Only fade in. Animating position fights the tracking loop. */
    #${C}.visible { opacity: 1; transition: opacity 0.25s ease; }

    #${C}::after {
      content: ''; position: absolute; inset: -3px;
      border: 3px solid #6366f1; border-radius: 8px;
      animation: oe-guide-pulse 2s ease-in-out infinite;
    }
    @keyframes oe-guide-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.05); }
    }

    .oe-guide-click-ripple {
      position: fixed; width: 40px; height: 40px; border-radius: 50%;
      background: rgba(99, 102, 241, 0.4);
      transform: translate(-50%, -50%) scale(0);
      animation: oe-guide-ripple 0.6s ease-out forwards;
      z-index: 100002; pointer-events: none;
    }
    @keyframes oe-guide-ripple {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }

    .${B} {
      position: fixed; top: 16px; right: 16px;
      padding: 8px 16px; background: #6366f1; color: #fff;
      font-size: 13px; font-weight: 600; border-radius: 999px;
      z-index: 100002; pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(99, 102, 241, .35);
    }

    /*
     * Mobile: OpenEvent's primary navigation is a bottom-centre floating
     * button and most pages add a bottom-right FAB. Move the subtitle to the
     * top and drop the step badge so the guide never covers either.
     */
    @media (max-width: 768px) {
      #${j} {
        bottom: auto;
        top: calc(env(safe-area-inset-top, 0px) + 12px);
        font-size: 15px; padding: 10px 16px;
        max-width: calc(100vw - 24px);
      }
      .${B} { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      #${C}::after { animation: none; }
      .oe-guide-click-ripple { animation-duration: 0.01s; }
    }
  `,document.head.appendChild(e)}function $e(){$||(Ee(),$=document.createElement("div"),$.id=oe,document.body.appendChild($),b=document.createElement("div"),b.id=D,document.body.appendChild(b),h=document.createElement("div"),h.id=j,document.body.appendChild(h),m=document.createElement("div"),m.id=C,document.body.appendChild(m))}function ne(e,t=5e3){h&&(S&&clearTimeout(S),h.textContent=e,h.classList.add("visible"),t>0&&(S=setTimeout(()=>h==null?void 0:h.classList.remove("visible"),t)))}function R(){S&&clearTimeout(S),h==null||h.classList.remove("visible")}function ie(e){if(!m)return;const t=e.getBoundingClientRect();if(m.style.top=`${t.top-T}px`,m.style.left=`${t.left-T}px`,m.style.width=`${t.width+T*2}px`,m.style.height=`${t.height+T*2}px`,b){const o=t.left-T,i=t.top-T,a=t.right+T,r=t.bottom+T;b.style.clipPath=`polygon(0% 0%, 0% 100%, ${o}px 100%, ${o}px ${i}px, ${a}px ${i}px, ${a}px ${r}px, ${o}px ${r}px, ${o}px 100%, 100% 100%, 100% 0%)`}}function ae(){M!==null&&cancelAnimationFrame(M),M=null,z=null}function re(){if(z){if(!z.isConnected){w();return}ie(z),M=requestAnimationFrame(re)}}function G(e,t=0){let o=null;try{o=document.querySelector(e)}catch{console.warn(`[oe-guide] Invalid selector: ${e}`)}return!o||!m?()=>{}:(L&&clearTimeout(L),ae(),o.scrollIntoView({behavior:"smooth",block:"center"}),z=o,ie(o),m.classList.add("visible"),b==null||b.classList.add("visible"),M=requestAnimationFrame(re),t>0&&(L=setTimeout(w,t)),w)}function w(){L&&clearTimeout(L),L=null,ae(),m==null||m.classList.remove("visible"),b==null||b.classList.remove("visible")}function Te(e,t){const o=document.createElement("div");o.className="oe-guide-click-ripple",o.style.left=`${e}px`,o.style.top=`${t}px`,document.body.appendChild(o),setTimeout(()=>o.remove(),600)}function Se(e,t){let o=document.querySelector(`.${B}`);o||(o=document.createElement("div"),o.className=B,document.body.appendChild(o)),o.textContent=`Step ${e} of ${t}`}function J(){var e;(e=document.querySelector(`.${B}`))==null||e.remove()}function Ie(){var e;w(),S&&clearTimeout(S),$==null||$.remove(),h==null||h.remove(),m==null||m.remove(),b==null||b.remove(),J(),(e=document.getElementById("oe-guide-overlay-styles"))==null||e.remove(),$=null,h=null,m=null,b=null}function Le(e){return/^\/[A-Za-z0-9\-._~/]*$/.test(e)&&!e.startsWith("//")}function se(e,t){return e===t?!0:e.startsWith(t.endsWith("/")?t:t+"/")}const x={ok:!0};function E(e,t){return new Promise(o=>{if(t!=null&&t.aborted)return o();let i;const a=()=>{clearTimeout(i),o()};i=setTimeout(()=>{t==null||t.removeEventListener("abort",a),o()},e),t==null||t.addEventListener("abort",a,{once:!0})})}function ce(e){for(const t of e.split(",").map(o=>o.trim()).filter(Boolean))try{const o=document.querySelector(t);if(o)return{el:o,selector:t}}catch{console.warn(`[oe-guide] Invalid selector skipped: ${t}`)}return null}function F(e,t=8e3,o){return new Promise(i=>{const a=ce(e);if(a)return i(a);if(o!=null&&o.aborted)return i(null);let r=!1;const c=f=>{r||(r=!0,p.disconnect(),clearTimeout(d),o==null||o.removeEventListener("abort",g),i(f))},p=new MutationObserver(()=>{const f=ce(e);f&&c(f)});p.observe(document.body,{childList:!0,subtree:!0});const g=()=>c(null);o==null||o.addEventListener("abort",g,{once:!0});const d=setTimeout(()=>c(null),t)})}async function Oe(e,t){var a;if(!Le(e))return{ok:!1,reason:`"${e}" is not a valid page.`,fatal:!0};if(se(window.location.pathname,e))return x;const o=document.querySelector(`a[href="${e}"]`);if(o)o.click();else if(typeof((a=window.history)==null?void 0:a.pushState)=="function")window.history.pushState({},"",e),window.dispatchEvent(new PopStateEvent("popstate"));else return window.location.assign(e),x;const i=Date.now()+4e3;for(;Date.now()<i;){if(t!=null&&t.aborted)return x;if(se(window.location.pathname,e))return await E(600,t),x;await E(100,t)}return{ok:!1,reason:`I couldn't open ${e}. Your account may not have access to that section.`,fatal:!0}}async function Ce(e){const t=e.getBoundingClientRect(),o=t.left+t.width/2,i=t.top+t.height/2;Te(o,i);for(const a of["mousedown","mouseup","click"])e.dispatchEvent(new MouseEvent(a,{bubbles:!0,cancelable:!0,clientX:o,clientY:i,view:window}))}async function Be(e,t,o){e.focus(),e.value="",e.dispatchEvent(new Event("input",{bubbles:!0}));for(const i of t){if(o!=null&&o.aborted)break;e.value+=i,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keydown",{key:i,bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{key:i,bubbles:!0})),await E(40,o)}e.dispatchEvent(new Event("change",{bubbles:!0}))}function q(e){return{ok:!1,reason:`I couldn't find ${e??"that element"} on your screen. It may be hidden on this screen size, or your role may not have access to it.`}}async function le(e,t){if(t!=null&&t.aborted)return x;switch("subtitle"in e&&e.subtitle&&ne(e.subtitle,0),e.type){case"navigate":return Oe(e.path,t);case"highlight":{const o=await F(e.selector,3e3,t);return o?(G(o.selector,e.duration),x):q(e.label)}case"click":{w();const o=await F(e.selector,5e3,t);return o?(G(o.selector),await E(1e3,t),t!=null&&t.aborted||(await Ce(o.el),w(),await E(400,t)),x):q(e.label)}case"fill":{const o=await F(e.selector,5e3,t);return o?!(o.el instanceof HTMLInputElement)&&!(o.el instanceof HTMLTextAreaElement)?{ok:!1,reason:`${e.label??"That field"} isn't a text field I can type into.`}:(G(o.selector),await E(400,t),await Be(o.el,e.value,t),w(),x):q(e.label)}case"scroll":{const o=await F(e.selector,3e3,t);return o?(o.el.scrollIntoView({behavior:"smooth",block:"center"}),await E(500,t),x):q(e.label)}case"subtitle":return ne(e.text,e.duration??5e3),x;case"wait":return await E(e.ms,t),x;case"clear":return w(),R(),x}}const ze={"/settings/payments":{message:"Need help connecting Stripe? I can walk you through it.",delay:15e3},"/settings/business":{message:"Setting up your business profile? I can guide you through each field.",delay:2e4},"/settings/rooms":{message:"Want help creating a room or a floor plan? Just ask.",delay:15e3},"/settings/staff":{message:"Need to invite team members? I can show you how.",delay:15e3},"/settings/ticketing":{message:"Setting up ticketing defaults? I can explain what each option does.",delay:2e4},"/settings/quick-setup":{message:"The Quick Setup gets you going fast. Need help with any step?",delay:1e4},"/ticketing":{message:"Want to create your first ticket link? I can walk you through it.",delay:2e4},"/membership":{message:"Ready to set up memberships? I can guide you through your first plan.",delay:2e4},"/pos":{message:"Setting up Point of Sale? I can help you create your first outlet.",delay:2e4},"/audience":{message:"Want to create a campaign or set up automations? Ask me.",delay:25e3},"/reports":{message:"Need help reading your reports? I can explain what each metric means.",delay:2e4},"/calendar":{message:"Want to create your first event? I can show you in 30 seconds.",delay:25e3},"/staff":{message:"Planning shifts? I can show you how to assign your team.",delay:25e3},"/website":{message:"Building your site? I can show you how sections fit together.",delay:25e3},"/welcome":{message:"Welcome to OpenEvent. Want a quick tour of the platform?",delay:5e3}};function Me(e){let t=null,o=-1;for(const[i,a]of Object.entries(ze))e.startsWith(i)&&i.length>o&&(t=a,o=i.length);return t}const s={active:!1,idleTimer:null,pollTimer:null,lastActivityAt:Date.now(),clickTimes:[],currentPath:"",offered:new Set,dismissedUntil:0,onTrigger:null,isBusy:null},Ae=500;function I(){const e=Date.now();e-s.lastActivityAt<Ae||(s.lastActivityAt=e,W())}function de(){const e=Date.now();s.clickTimes=s.clickTimes.filter(t=>e-t<2e3),s.clickTimes.push(e),s.clickTimes.length>=4&&(s.clickTimes=[],Y("It looks like something isn't working as expected. Can I help?")),s.lastActivityAt=0,I()}function W(){s.idleTimer&&clearTimeout(s.idleTimer),s.idleTimer=null;const e=window.location.pathname,t=Me(e);!t||s.offered.has(e)||(s.idleTimer=setTimeout(()=>{window.location.pathname===e&&(s.offered.add(e),Y(t.message))},t.delay))}function _e(){const e=window.location.pathname;e!==s.currentPath&&(s.currentPath=e,W())}function Ue(){var t;const e=["[data-sonner-toast][data-type='error']",".Toastify__toast--error",".toast-error","[role='alert']"];for(const o of e){const i=document.querySelector(o),a=(t=i==null?void 0:i.textContent)==null?void 0:t.trim();if(!a)continue;const r="error-"+a.slice(0,40);if(!s.offered.has(r)){s.offered.add(r),Y("I noticed an error on this page. Want me to help sort it out?");return}}}function Y(e){var t;!s.active||!s.onTrigger||Date.now()<s.dismissedUntil||(t=s.isBusy)!=null&&t.call(s)||s.onTrigger(e)}function Pe(){s.dismissedUntil=Date.now()+3e5}function Ne(e){s.active||(s.active=!0,s.onTrigger=e.onTrigger,s.isBusy=e.isBusy,s.currentPath=window.location.pathname,document.addEventListener("mousemove",I,{passive:!0}),document.addEventListener("keydown",I,{passive:!0}),document.addEventListener("scroll",I,{passive:!0}),document.addEventListener("click",de,{passive:!0}),s.pollTimer=setInterval(()=>{_e(),Ue()},2e3),W())}function je(){s.active=!1,s.onTrigger=null,s.isBusy=null,s.idleTimer&&clearTimeout(s.idleTimer),s.pollTimer&&clearInterval(s.pollTimer),s.idleTimer=null,s.pollTimer=null,s.offered.clear(),document.removeEventListener("mousemove",I),document.removeEventListener("keydown",I),document.removeEventListener("scroll",I),document.removeEventListener("click",de)}const l={active:!1,pc:null,dc:null,stream:null,audioEl:null,micEnabled:!0,callbacks:null};function K(){var t;if(typeof window>"u")return{available:!1,reason:"no-api"};if(!window.isSecureContext)return{available:!1,reason:"insecure-context",detail:"The page is not served over HTTPS."};if(!((t=navigator.mediaDevices)!=null&&t.getUserMedia))return{available:!1,reason:"no-api",detail:"This browser has no getUserMedia."};const e=document.featurePolicy??document.permissionsPolicy;return e&&typeof e.allowsFeature=="function"&&!e.allowsFeature("microphone")?{available:!1,reason:"blocked-by-permissions-policy",detail:"This page sends Permissions-Policy: microphone=(), which disables the microphone for the whole document. It has to be changed on the server. See docs/voice-call-fix.md in openevent-guide."}:{available:!0}}function Fe(e){return[{type:"function",name:"guide_flow",description:"Run a predefined guided walkthrough in the user's browser. Use this whenever they ask how to do something.",parameters:{type:"object",properties:{flow_id:{type:"string",enum:e,description:"Which walkthrough to run."}},required:["flow_id"]}},{type:"function",name:"navigate",description:"Take the user directly to a page in OpenEvent, without a full walkthrough.",parameters:{type:"object",properties:{path:{type:"string",description:'An OpenEvent path such as "/ticketing" or "/settings/payments".'},subtitle:{type:"string",description:"One short line to show on screen while navigating."}},required:["path"]}}]}async function qe(e){if(l.active)return;const t=K();if(!t.available)throw new Error(t.detail??"Microphone is not available on this page.");l.callbacks=e.callbacks,e.callbacks.onStatus("connecting");try{const o=await e.apiFetch(`${e.serverUrl}/api/voice-session`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:e.sessionId,lang:e.lang})});if(!o.clientSecret)throw new Error("The server did not return a voice token.");const i=new RTCPeerConnection;l.pc=i;const a=document.createElement("audio");a.autoplay=!0,l.audioEl=a,i.ontrack=d=>{a.srcObject=d.streams[0]},i.onconnectionstatechange=()=>{(i.connectionState==="failed"||i.connectionState==="disconnected")&&(e.callbacks.onError("The call dropped."),Q())};const r=await navigator.mediaDevices.getUserMedia({audio:!0});l.stream=r,l.micEnabled=!0,r.getTracks().forEach(d=>i.addTrack(d,r));const c=i.createDataChannel("oai-events");l.dc=c,c.onopen=()=>{c.send(JSON.stringify({type:"session.update",session:{instructions:o.instructions??"You are the OpenEvent Guide.",tools:Fe(e.flowIds),tool_choice:"auto",input_audio_transcription:{model:"whisper-1"}}}))},c.onmessage=d=>{try{He(JSON.parse(d.data))}catch{}};const p=await i.createOffer();await i.setLocalDescription(p);const g=await e.apiFetch(`${e.serverUrl}/api/voice-sdp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:e.sessionId,sdp:p.sdp,clientSecret:o.clientSecret,model:o.model})});if(!g.answer)throw new Error("The voice handshake did not return an answer.");await i.setRemoteDescription({type:"answer",sdp:g.answer}),l.active=!0,e.callbacks.onStatus("live")}catch(o){throw console.error("[oe-guide] Voice start failed:",o),ue(),o}}function X(e,t){var o,i;e&&((o=l.dc)==null||o.send(JSON.stringify({type:"conversation.item.create",item:{type:"function_call_output",call_id:e,output:t}})),(i=l.dc)==null||i.send(JSON.stringify({type:"response.create"})))}function He(e){var o,i,a,r;const t=e.type;if(t==="conversation.item.input_audio_transcription.completed"){const c=e.transcript;c&&((o=l.callbacks)==null||o.onTranscript(c,"user"));return}if(t==="response.audio_transcript.done"){const c=e.transcript;c&&((i=l.callbacks)==null||i.onTranscript(c,"assistant"));return}if(t==="error"){const c=(a=e.error)==null?void 0:a.message;console.error("[oe-guide] Realtime error:",c??e),c&&((r=l.callbacks)==null||r.onError(c));return}if(t==="response.function_call_arguments.done"){const c=e.name,p=e.arguments,g=e.call_id;if(!c||!l.callbacks)return;let d={};if(p)try{d=JSON.parse(p)}catch{X(g,JSON.stringify({ok:!1,error:"arguments were not valid JSON"}));return}l.callbacks.onToolCall(c,d).then(f=>X(g,f)).catch(f=>X(g,JSON.stringify({ok:!1,error:String((f==null?void 0:f.message)??f)})))}}function Ve(e){var t;l.micEnabled=e,(t=l.stream)==null||t.getAudioTracks().forEach(o=>{o.enabled=e})}function De(){return l.micEnabled}function ue(){var e,t,o,i;(e=l.stream)==null||e.getTracks().forEach(a=>a.stop()),(t=l.dc)==null||t.close(),(o=l.pc)==null||o.close(),l.audioEl&&(l.audioEl.srcObject=null,l.audioEl.remove()),l.stream=null,l.pc=null,l.dc=null,l.audioEl=null,l.active=!1,l.micEnabled=!0,(i=l.callbacks)==null||i.onStatus("ended"),l.callbacks=null}function Q(){!l.pc&&!l.stream&&!l.active||ue()}function Re(){return l.active}const A="oe-guide-widget",pe="oe-guide-session",H="oe-guide-seen";function Ge(){try{const e=sessionStorage.getItem(pe);if(e)return e;const t=crypto.randomUUID();return sessionStorage.setItem(pe,t),t}catch{return crypto.randomUUID()}}function Je(e){try{return localStorage.getItem(e)==="1"}catch{return!1}}function Z(e){try{localStorage.setItem(e,"1")}catch{}}const n={booted:!1,mode:"hidden",messages:[],typing:!1,running:!1,abort:null,callStatus:"idle",micOn:!0,voiceEnabled:!0,voiceBlocked:null,sessionId:"",serverUrl:"",token:"",user:null,flowIds:[],proactiveMsg:null};function We(){for(const e of document.querySelectorAll("script[src]")){const t=e.src;if(t.includes("/sdk.js")||t.includes("/sdk.iife.js")){const o=new URL(t),i=o.pathname.replace(/\/sdk(\.iife)?\.js$/,"");return o.origin+(i==="/"?"":i)}}return window.location.origin}function Ye(){try{return document.documentElement.classList.contains("dark")||localStorage.getItem("theme")==="dark"}catch{return document.documentElement.classList.contains("dark")}}function O(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Ke(){return n.running||n.mode!=="hidden"}function Xe(){if(document.getElementById("oe-guide-sdk-styles"))return;const e=Ye(),t=e?"#1e293b":"#fff",o=e?"#334155":"#f3f4f6",i=e?"#f1f5f9":"#1f2937",a=e?"#94a3b8":"#6b7280",r=e?"#475569":"#e5e7eb",c=e?"#334155":"#fff",p=e?"#475569":"#eef2ff",g=e?"#1e293b":"#fff",d=document.createElement("style");d.id="oe-guide-sdk-styles",d.textContent=`
    #${A}{position:fixed;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    #${A} *{box-sizing:border-box}

    .oeg-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(99,102,241,.4);transition:transform .2s,box-shadow .2s;z-index:99991}
    .oeg-bubble:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(99,102,241,.5)}
    .oeg-bubble svg{width:24px;height:24px;fill:#fff}
    .oeg-bubble.pulse{animation:oeg-pulse 2s ease-in-out infinite}
    @keyframes oeg-pulse{0%,100%{box-shadow:0 4px 20px rgba(99,102,241,.4)}50%{box-shadow:0 4px 30px rgba(99,102,241,.7)}}

    .oeg-hint{position:fixed;bottom:92px;right:24px;background:${g};color:${i};padding:12px 16px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.15);font-size:14px;line-height:1.5;max-width:280px;animation:oeg-fadein .3s ease;cursor:pointer;border:1px solid ${r};z-index:99991}
    .oeg-hint::after{content:'';position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:${g};border-right:1px solid ${r};border-bottom:1px solid ${r};transform:rotate(45deg)}
    .oeg-hint-x{position:absolute;top:6px;right:10px;cursor:pointer;color:${a};font-size:18px;line-height:1}
    @keyframes oeg-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

    .oeg-welcome-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99995;animation:oeg-fadein .3s ease;backdrop-filter:blur(4px)}
    .oeg-welcome{background:${g};border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-width:480px;width:90%;overflow:hidden;animation:oeg-scalein .35s ease}
    @keyframes oeg-scalein{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
    .oeg-welcome-img{width:100%;height:160px;display:block;background:linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 50%,#a5b4fc 100%)}
    .oeg-welcome-body{padding:24px 28px}
    .oeg-welcome-body h2{margin:0 0 8px;font-size:22px;font-weight:700;color:${i}}
    .oeg-welcome-body p{margin:0 0 20px;font-size:15px;color:${a};line-height:1.6}
    .oeg-welcome-agent{display:flex;align-items:center;gap:10px;margin-bottom:20px}
    .oeg-welcome-avatar{width:36px;height:36px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;flex-shrink:0}
    .oeg-welcome-name{font-size:14px;font-weight:600;color:${i}}
    .oeg-welcome-role{font-size:12px;color:${a}}
    .oeg-welcome-actions{display:flex;gap:10px}
    .oeg-welcome-btn{flex:1;padding:12px;border-radius:12px;border:none;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s}
    .oeg-welcome-btn.primary{background:#6366f1;color:#fff}
    .oeg-welcome-btn.primary:hover{background:#4f46e5}
    .oeg-welcome-btn.secondary{background:${o};color:${i};border:1px solid ${r}}
    .oeg-welcome-btn.secondary:hover{background:${p}}
    .oeg-welcome-btn svg{width:18px;height:18px;fill:currentColor}
    .oeg-welcome-skip{display:block;margin:16px auto 0;background:none;border:none;color:${a};font-size:13px;cursor:pointer;padding:4px 8px}

    .oeg-picker{position:fixed;bottom:92px;right:24px;background:${g};border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:8px;display:flex;flex-direction:column;gap:4px;min-width:200px;animation:oeg-fadein .2s ease;z-index:99992;border:1px solid ${r}}
    .oeg-picker-btn{display:flex;align-items:center;gap:12px;padding:12px 16px;border:none;background:none;cursor:pointer;border-radius:12px;font-size:14px;color:${i};transition:background .15s;width:100%;text-align:left}
    .oeg-picker-btn:hover{background:${o}}
    .oeg-picker-btn svg{width:20px;height:20px;fill:#6366f1;flex-shrink:0}
    .oeg-picker-label{font-weight:500}
    .oeg-picker-desc{font-size:12px;color:${a}}

    .oeg-call-pill{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;padding:8px;background:${e?"#0f172a":"#1e293b"};border-radius:28px;box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:99993;animation:oeg-fadein .2s ease}
    .oeg-call-btn{width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .oeg-call-btn svg{width:20px;height:20px;fill:currentColor}
    .oeg-call-btn.mic{background:${e?"#334155":"#374151"};color:#fff}
    .oeg-call-btn.mic:hover{background:#6366f1}
    .oeg-call-btn.mic.muted{background:#ef4444;color:#fff}
    .oeg-call-btn.chat{background:${e?"#334155":"#374151"};color:#fff}
    .oeg-call-btn.chat:hover{background:#6366f1}
    .oeg-call-btn.end{background:#ef4444;color:#fff}
    .oeg-call-btn.end:hover{background:#dc2626}
    .oeg-call-status{color:#fff;font-size:13px;padding:0 12px;min-width:100px;text-align:center}
    .oeg-call-wave{display:flex;gap:2px;align-items:center;justify-content:center;height:20px}
    .oeg-call-wave span{width:3px;background:#6366f1;border-radius:2px;animation:oeg-wave 1s ease-in-out infinite}
    .oeg-call-wave span:nth-child(1){height:8px;animation-delay:0s}
    .oeg-call-wave span:nth-child(2){height:14px;animation-delay:.15s}
    .oeg-call-wave span:nth-child(3){height:20px;animation-delay:.3s}
    .oeg-call-wave span:nth-child(4){height:14px;animation-delay:.45s}
    .oeg-call-wave span:nth-child(5){height:8px;animation-delay:.6s}
    @keyframes oeg-wave{0%,100%{height:8px}50%{height:20px}}

    .oeg-chat{position:fixed;bottom:92px;right:24px;width:380px;max-height:520px;background:${t};border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden;animation:oeg-fadein .25s ease;z-index:99992;border:1px solid ${r}}
    .oeg-chat-hd{padding:14px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;gap:10px}
    .oeg-chat-hd svg{width:20px;height:20px;fill:#fff;opacity:.8}
    .oeg-chat-hd h3{margin:0;font-size:15px;font-weight:600;flex:1}
    .oeg-chat-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.7);padding:4px}
    .oeg-chat-close svg{width:18px;height:18px;fill:currentColor}
    .oeg-ms{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:180px;max-height:360px}
    .oeg-m{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word;animation:oeg-fadein .2s ease}
    .oeg-m.user{align-self:flex-end;background:#6366f1;color:#fff;border-bottom-right-radius:4px}
    .oeg-m.assistant{align-self:flex-start;background:${o};color:${i};border-bottom-left-radius:4px}
    .oeg-m.status{align-self:center;background:transparent;color:#6366f1;font-size:12px;font-weight:500;padding:2px 0;text-align:center;max-width:95%}
    .oeg-tp{align-self:flex-start;padding:10px 14px;background:${o};border-radius:12px;display:flex;gap:4px}
    .oeg-tp span{width:5px;height:5px;background:#9ca3af;border-radius:50%;animation:oeg-bo 1.4s ease-in-out infinite}
    .oeg-tp span:nth-child(2){animation-delay:.2s}.oeg-tp span:nth-child(3){animation-delay:.4s}
    @keyframes oeg-bo{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    .oeg-sg{padding:6px 14px 2px;display:flex;flex-wrap:wrap;gap:5px}
    .oeg-ch{padding:5px 10px;border:1px solid ${r};border-radius:14px;background:${e?"#334155":"#fff"};font-size:12px;color:#6366f1;cursor:pointer;transition:all .15s}
    .oeg-ch:hover{background:${p};border-color:#6366f1}
    .oeg-ir{padding:10px 14px;border-top:1px solid ${r};display:flex;gap:6px}
    .oeg-in{flex:1;border:1px solid ${r};border-radius:10px;padding:9px 12px;font-size:16px;outline:none;background:${c};color:${i}}
    .oeg-in:focus{border-color:#6366f1}
    .oeg-sb{width:38px;height:38px;border:none;background:#6366f1;color:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .oeg-sb:disabled{opacity:.5;cursor:default}
    .oeg-sb svg{width:16px;height:16px;fill:currentColor}
    .oeg-cancel{display:flex;justify-content:center;padding:0 14px 6px}
    .oeg-cancel button{padding:5px 14px;border:1px solid #ef4444;border-radius:8px;background:transparent;color:#ef4444;font-size:12px;cursor:pointer}
    .oeg-cancel button:hover{background:#ef4444;color:#fff}

    /*
     * Mobile: OpenEvent puts its primary navigation bottom-centre and a FAB
     * bottom-right on most pages. Sitting at bottom:24px meant the guide
     * covered the app's own Create button and its nav. Lift everything clear.
     */
    @media(max-width:768px){
      .oeg-bubble{bottom:96px;right:16px;width:48px;height:48px}
      .oeg-hint{bottom:152px;right:16px;max-width:calc(100vw - 32px)}
      .oeg-picker{bottom:152px;right:16px}
      .oeg-chat{width:calc(100vw - 16px);right:8px;bottom:152px;max-height:60vh}
      .oeg-call-pill{bottom:96px}
    }
  `,document.head.appendChild(d)}const v={guide:'<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>',send:'<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',close:'<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',mic:'<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm6-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',micOff:'<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>',phone:'<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',phoneEnd:'<svg viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',chat:'<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>'};function u(){var r,c;let e=document.getElementById(A);e||(e=document.createElement("div"),e.id=A,document.body.appendChild(e));const t=((r=n.user)==null?void 0:r.agentName)??"Guide",o=(c=n.user)!=null&&c.name?O(n.user.name):"";let i="";if(n.mode==="welcome"){const p=n.voiceEnabled?`<button class="oeg-welcome-btn primary" id="oeg-start-call">${v.phone} Start call</button>
         <button class="oeg-welcome-btn secondary" id="oeg-start-chat">${v.chat} Chat instead</button>`:`<button class="oeg-welcome-btn primary" id="oeg-start-chat">${v.chat} Start chatting</button>`;i=`
      <div class="oeg-welcome-overlay" id="oeg-welcome-overlay">
        <div class="oeg-welcome">
          <div class="oeg-welcome-img"></div>
          <div class="oeg-welcome-body">
            <h2>Ready for a quick walkthrough?</h2>
            <p>I'll guide you through the platform step by step, and answer anything you want to ask along the way.</p>
            <div class="oeg-welcome-agent">
              <div class="oeg-welcome-avatar">${O(t[0]??"G")}</div>
              <div>
                <div class="oeg-welcome-name">${O(t)}</div>
                <div class="oeg-welcome-role">Your OpenEvent assistant</div>
              </div>
            </div>
            <div class="oeg-welcome-actions">${p}</div>
            <button class="oeg-welcome-skip" id="oeg-skip">Skip for now</button>
          </div>
        </div>
      </div>`}if(n.mode==="picker"&&(i+=`
      <div class="oeg-picker" id="oeg-picker">
        <button class="oeg-picker-btn" id="oeg-pick-call">
          ${v.phone}
          <div><div class="oeg-picker-label">Start a call</div>
          <div class="oeg-picker-desc">Voice walkthrough with your guide</div></div>
        </button>
        <button class="oeg-picker-btn" id="oeg-pick-chat">
          ${v.chat}
          <div><div class="oeg-picker-label">Chat</div>
          <div class="oeg-picker-desc">Type your questions</div></div>
        </button>
      </div>`),n.mode==="call"){const p=n.callStatus==="connecting"?'<span style="color:#9ca3af">Connecting...</span>':n.micOn?'<div class="oeg-call-wave"><span></span><span></span><span></span><span></span><span></span></div>':'<span style="color:#9ca3af">Muted</span>';i+=`
      <div class="oeg-call-pill">
        <button class="oeg-call-btn mic ${n.micOn?"":"muted"}" id="oeg-call-mic" title="${n.micOn?"Mute":"Unmute"}">
          ${n.micOn?v.mic:v.micOff}
        </button>
        <div class="oeg-call-status">${p}</div>
        <button class="oeg-call-btn chat" id="oeg-call-chat" title="Open chat">${v.chat}</button>
        <button class="oeg-call-btn end" id="oeg-call-end" title="End call">${v.phoneEnd}</button>
      </div>`}if(n.mode==="chat"){const p=o?`Hi ${o}, I'm your OpenEvent Guide. How can I help?`:`Hi, I'm your OpenEvent Guide. Ask anything, or say "show me".`,g=["Show me around","Create an event","Set up ticketing","Connect Stripe"],d=n.typing||n.running;i+=`
      <div class="oeg-chat">
        <div class="oeg-chat-hd">
          ${v.guide}
          <h3>OpenEvent Guide</h3>
          <button class="oeg-chat-close" id="oeg-chat-close">${v.close}</button>
        </div>
        <div class="oeg-ms" id="oeg-ms">
          ${n.messages.length===0?`<div class="oeg-m assistant">${O(p)}</div>`:""}
          ${n.messages.map(f=>`<div class="oeg-m ${f.role}">${O(f.content)}</div>`).join("")}
          ${n.typing?'<div class="oeg-tp"><span></span><span></span><span></span></div>':""}
        </div>
        ${n.messages.length===0?`<div class="oeg-sg">${g.map(f=>`<button class="oeg-ch">${f}</button>`).join("")}</div>`:""}
        ${n.running?'<div class="oeg-cancel"><button id="oeg-cancel">Stop guide</button></div>':""}
        <div class="oeg-ir">
          <input class="oeg-in" type="text" placeholder="Ask anything..." id="oeg-in" ${d?"disabled":""} />
          <button class="oeg-sb" id="oeg-sd" ${d?"disabled":""}>${v.send}</button>
        </div>
      </div>`}n.proactiveMsg&&n.mode==="hidden"&&(i+=`<div class="oeg-hint" id="oeg-hint"><span class="oeg-hint-x" id="oeg-hint-x">&times;</span>${O(n.proactiveMsg)}</div>`),n.mode!=="welcome"&&n.mode!=="call"&&(i+=`<button class="oeg-bubble ${n.proactiveMsg&&n.mode==="hidden"?"pulse":""}" id="oeg-tg" aria-label="OpenEvent Guide">
      ${n.mode==="chat"||n.mode==="picker"?v.close:v.guide}
    </button>`),e.innerHTML=i;const a=document.getElementById("oeg-ms");a&&(a.scrollTop=a.scrollHeight),Qe(e)}function ge(){n.mode="hidden",Z(H),u()}function Qe(e){var t,o,i,a,r,c,p,g,d,f,_,U,P,ye,we,ke;(t=document.getElementById("oeg-start-call"))==null||t.addEventListener("click",()=>te()),(o=document.getElementById("oeg-start-chat"))==null||o.addEventListener("click",()=>{Z(H),n.mode="chat",u()}),(i=document.getElementById("oeg-skip"))==null||i.addEventListener("click",ge),(a=document.getElementById("oeg-welcome-overlay"))==null||a.addEventListener("click",y=>{y.target.classList.contains("oeg-welcome-overlay")&&ge()}),(r=document.getElementById("oeg-tg"))==null||r.addEventListener("click",()=>{n.mode==="chat"||n.mode==="picker"?n.mode="hidden":(n.mode=n.voiceEnabled?"picker":"chat",n.proactiveMsg=null),u()}),(c=document.getElementById("oeg-pick-call"))==null||c.addEventListener("click",()=>te()),(p=document.getElementById("oeg-pick-chat"))==null||p.addEventListener("click",()=>{n.mode="chat",u()}),(g=document.getElementById("oeg-call-mic"))==null||g.addEventListener("click",tt),(d=document.getElementById("oeg-call-chat"))==null||d.addEventListener("click",()=>{n.mode="chat",u()}),(f=document.getElementById("oeg-call-end"))==null||f.addEventListener("click",be),(_=document.getElementById("oeg-chat-close"))==null||_.addEventListener("click",()=>{n.mode="hidden",u()}),(U=document.getElementById("oeg-sd"))==null||U.addEventListener("click",()=>ee()),(P=document.getElementById("oeg-in"))==null||P.addEventListener("keydown",y=>{y.key==="Enter"&&!n.typing&&!n.running&&ee()}),(ye=document.getElementById("oeg-cancel"))==null||ye.addEventListener("click",he),e.querySelectorAll(".oeg-ch").forEach(y=>{y.addEventListener("click",()=>ee(y.textContent??""))}),(we=document.getElementById("oeg-hint"))==null||we.addEventListener("click",()=>{n.mode="chat",n.proactiveMsg=null,u()}),(ke=document.getElementById("oeg-hint-x"))==null||ke.addEventListener("click",y=>{y.stopPropagation(),n.proactiveMsg=null,Pe(),u()}),n.mode==="chat"&&!n.typing&&!n.running&&setTimeout(()=>{var y;return(y=document.getElementById("oeg-in"))==null?void 0:y.focus()},150)}let Ze=0;function V(e,t){const o={...t.headers};return n.token&&(o.Authorization=`Bearer ${n.token}`),window.__oeGuideExtProxy?new Promise((a,r)=>{const c="oeg-"+ ++Ze;let p;const g=d=>{var f,_,U,P;d.source===window&&(((f=d.data)==null?void 0:f.source)!=="oeg-ext"||((_=d.data)==null?void 0:_.reqId)!==c||(window.removeEventListener("message",g),clearTimeout(p),(U=d.data.response)!=null&&U.ok?a(d.data.response.data):r(new Error(((P=d.data.response)==null?void 0:P.error)??"Extension proxy failed"))))};window.addEventListener("message",g),window.postMessage({source:"oeg-sdk",type:"api-request",reqId:c,url:e,options:{method:t.method,headers:o,body:t.body}},window.location.origin),p=setTimeout(()=>{window.removeEventListener("message",g),r(new Error("Request timed out"))},3e4)}):fetch(e,{...t,headers:o}).then(async a=>{if(!a.ok)throw new Error(`Request failed (${a.status})`);return a.json()})}async function fe(){try{const e=await V(`${n.serverUrl}/api/flows`,{method:"GET"});n.flowIds=(e.flows??[]).map(t=>t.id)}catch(e){console.warn("[oe-guide] Could not load flow list:",e)}}function k(e){n.messages.push({role:"status",content:e}),u()}async function me(e){n.running=!0,n.abort=new AbortController;const t=n.abort.signal;u();let o=0,i=!0;try{for(let a=0;a<e.length;a++){if(t.aborted){i=!1;break}const r=e[a];e.length>2&&Se(a+1,e.length),r.type==="subtitle"?k(r.text):"subtitle"in r&&r.subtitle?k(r.subtitle):r.type==="navigate"&&k(`Opening ${r.path}...`);const c=await le(r,t);if(!c.ok&&c.reason&&(o++,k(c.reason),c.fatal)){i=!1;break}if(t.aborted){i=!1;break}const p=r.type==="navigate"?1800:r.type==="subtitle"?r.duration??4e3:r.type==="highlight"?r.duration??3e3:1500;await E(p,t)}}finally{J(),w(),R(),n.running=!1,n.abort=null,u()}return t.aborted?k("Guide stopped."):i&&o===0?k("Done. Ask me anything else."):i&&k("That's as far as I can take you on this screen."),u(),{completed:i,failures:o}}function he(){var e;(e=n.abort)==null||e.abort(),n.running=!1,w(),R(),J(),u()}async function ee(e){var i;const t=document.getElementById("oeg-in"),o=(e??(t==null?void 0:t.value)??"").trim();if(!(!o||n.typing||n.running)){t&&(t.value=""),n.messages.push({role:"user",content:o}),n.typing=!0,u();try{const a=await V(`${n.serverUrl}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:n.sessionId,message:o,user:n.user,path:window.location.pathname})});n.typing=!1,n.messages.push({role:"assistant",content:a.reply??""}),u(),(i=a.commands)!=null&&i.length&&await me(a.commands)}catch(a){n.typing=!1,console.error("[oe-guide] Chat failed:",a),n.messages.push({role:"assistant",content:"I couldn't reach the guide service. Please try again."}),u()}}}async function et(e,t){var o;if(e==="guide_flow"){const i=String(t.flow_id??"");try{const a=await V(`${n.serverUrl}/api/flow/${encodeURIComponent(i)}?lang=${encodeURIComponent(((o=n.user)==null?void 0:o.language)??"en")}`,{method:"GET"});if(!a.flow)return JSON.stringify({ok:!1,error:`No flow called ${i}`});const r=await me(a.flow.steps.map(c=>c.command));return JSON.stringify({ok:!0,flow:i,completed:r.completed,steps_that_failed:r.failures})}catch(a){return JSON.stringify({ok:!1,error:String((a==null?void 0:a.message)??a)})}}if(e==="navigate"){const i=await le({type:"navigate",path:String(t.path??""),subtitle:typeof t.subtitle=="string"?t.subtitle:void 0});return JSON.stringify(i)}return JSON.stringify({ok:!1,error:`Unknown tool ${e}`})}async function te(){var e,t;if(!n.voiceEnabled){n.mode="chat",k(((e=n.voiceBlocked)==null?void 0:e.detail)??"Voice isn't available on this page. We can chat instead.");return}n.mode="call",n.callStatus="connecting",u(),n.flowIds.length===0&&await fe();try{await qe({serverUrl:n.serverUrl,sessionId:n.sessionId,lang:(t=n.user)==null?void 0:t.language,flowIds:n.flowIds,apiFetch:V,callbacks:{onToolCall:et,onTranscript:(o,i)=>{n.messages.push({role:i,content:o}),u()},onStatus:o=>{n.callStatus=o==="live"?"live":o==="connecting"?"connecting":"idle",o==="ended"&&n.mode==="call"&&(n.mode="hidden"),n.micOn=De(),u()},onError:o=>k(o)}}),Z(H),n.micOn=!0,u()}catch(o){console.error("[oe-guide] Call failed:",o),n.callStatus="idle",n.mode="chat",k((o==null?void 0:o.message)??"I couldn't start the call. Let's chat instead.")}}function tt(){const e=!n.micOn;Ve(e),n.micOn=e,u()}function be(){Q(),n.callStatus="idle",n.mode="hidden",u()}function ot(e){n.mode==="hidden"&&(n.proactiveMsg=e,u())}function ve(e){if(n.booted)return;n.booted=!0,n.user=e,n.serverUrl=(e.server??We()).replace(/\/$/,""),n.token=e.token??"",n.sessionId=Ge();const t=K();n.voiceBlocked=t.available?null:t,n.voiceEnabled=!e.disableVoice&&t.available,!t.available&&!e.disableVoice&&console.warn(`[OpenEvent Guide] Voice is unavailable (${t.reason}). ${t.detail??""}`.trim()),$e(),Xe(),n.mode=Je(H)?"hidden":"welcome",u(),fe(),e.disableTriggers||Ne({onTrigger:ot,isBusy:Ke}),console.log("[OpenEvent Guide] Ready",n.serverUrl,n.voiceEnabled?"(voice on)":"(chat only)")}function xe(){var e,t;he(),je(),Re()&&Q(),Ie(),(e=document.getElementById(A))==null||e.remove(),(t=document.getElementById("oe-guide-sdk-styles"))==null||t.remove(),n.booted=!1,n.mode="hidden",n.messages=[]}const nt={boot:ve,shutdown:xe,open:()=>{n.mode=n.voiceEnabled?"picker":"chat",u()},close:()=>{n.mode="hidden",u()},startCall:te,endCall:be,diagnostics:()=>({...K(),server:n.serverUrl,flows:n.flowIds.length})};return window.OpenEventGuide=nt,N.boot=ve,N.shutdown=xe,Object.defineProperty(N,Symbol.toStringTag,{value:"Module"}),N})({});
