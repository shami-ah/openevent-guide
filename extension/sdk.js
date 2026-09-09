var OpenEventGuide=(function(V){"use strict";const ie="oe-guide-overlay",F="oe-guide-subtitle",B="oe-guide-highlight",D="oe-guide-spotlight",z="oe-guide-step-badge";let E=null,h=null,m=null,b=null,S=null,M=null,A=null,C=null;const $=6;function Te(){if(document.getElementById("oe-guide-overlay-styles"))return;const e=document.createElement("style");e.id="oe-guide-overlay-styles",e.textContent=`
    #${ie} {
      position: fixed; inset: 0; pointer-events: none; z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Raised to 96px so it clears the guide bubble and the call pill. */
    #${F} {
      position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%);
      max-width: min(600px, calc(100vw - 32px));
      padding: 12px 24px;
      background: rgba(0, 0, 0, 0.85); color: #fff;
      font-size: 16px; line-height: 1.5; border-radius: 12px; text-align: center;
      opacity: 0; transition: opacity 0.3s ease;
      z-index: 100001; pointer-events: none; backdrop-filter: blur(8px);
    }
    #${F}.visible { opacity: 1; }

    #${D} {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
      opacity: 0; transition: opacity 0.3s ease;
      z-index: 99998; pointer-events: none;
    }
    #${D}.visible { opacity: 1; }

    #${B} {
      position: fixed;
      border: 3px solid #6366f1; border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25), 0 0 20px rgba(99, 102, 241, 0.3);
      opacity: 0; z-index: 100000; pointer-events: none;
    }
    /* Only fade in. Animating position fights the tracking loop. */
    #${B}.visible { opacity: 1; transition: opacity 0.25s ease; }

    #${B}::after {
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

    .${z} {
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
      #${F} {
        bottom: auto;
        top: calc(env(safe-area-inset-top, 0px) + 12px);
        font-size: 15px; padding: 10px 16px;
        max-width: calc(100vw - 24px);
      }
      .${z} { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      #${B}::after { animation: none; }
      .oe-guide-click-ripple { animation-duration: 0.01s; }
    }
  `,document.head.appendChild(e)}function Ie(){E||(Te(),E=document.createElement("div"),E.id=ie,document.body.appendChild(E),b=document.createElement("div"),b.id=D,document.body.appendChild(b),h=document.createElement("div"),h.id=F,document.body.appendChild(h),m=document.createElement("div"),m.id=B,document.body.appendChild(m))}function ae(e,t=5e3){h&&(S&&clearTimeout(S),h.textContent=e,h.classList.add("visible"),t>0&&(S=setTimeout(()=>h==null?void 0:h.classList.remove("visible"),t)))}function G(){S&&clearTimeout(S),h==null||h.classList.remove("visible")}function re(e){if(!m)return;const t=e.getBoundingClientRect();if(m.style.top=`${t.top-$}px`,m.style.left=`${t.left-$}px`,m.style.width=`${t.width+$*2}px`,m.style.height=`${t.height+$*2}px`,b){const o=t.left-$,i=t.top-$,a=t.right+$,r=t.bottom+$;b.style.clipPath=`polygon(0% 0%, 0% 100%, ${o}px 100%, ${o}px ${i}px, ${a}px ${i}px, ${a}px ${r}px, ${o}px ${r}px, ${o}px 100%, 100% 100%, 100% 0%)`}}function se(){A!==null&&cancelAnimationFrame(A),A=null,M=null}function ce(){if(M){if(!M.isConnected){w();return}re(M),A=requestAnimationFrame(ce)}}function J(e,t=0){let o=null;try{o=document.querySelector(e)}catch{console.warn(`[oe-guide] Invalid selector: ${e}`)}return!o||!m?()=>{}:(C&&clearTimeout(C),se(),o.scrollIntoView({behavior:"smooth",block:"center"}),M=o,re(o),m.classList.add("visible"),b==null||b.classList.add("visible"),A=requestAnimationFrame(ce),t>0&&(C=setTimeout(w,t)),w)}function w(){C&&clearTimeout(C),C=null,se(),m==null||m.classList.remove("visible"),b==null||b.classList.remove("visible")}function Se(e,t){const o=document.createElement("div");o.className="oe-guide-click-ripple",o.style.left=`${e}px`,o.style.top=`${t}px`,document.body.appendChild(o),setTimeout(()=>o.remove(),600)}function Le(e,t){let o=document.querySelector(`.${z}`);o||(o=document.createElement("div"),o.className=z,document.body.appendChild(o)),o.textContent=`Step ${e} of ${t}`}function W(){var e;(e=document.querySelector(`.${z}`))==null||e.remove()}function Ce(){var e;w(),S&&clearTimeout(S),E==null||E.remove(),h==null||h.remove(),m==null||m.remove(),b==null||b.remove(),W(),(e=document.getElementById("oe-guide-overlay-styles"))==null||e.remove(),E=null,h=null,m=null,b=null}function Oe(e){return/^\/[A-Za-z0-9\-._~/]*$/.test(e)&&!e.startsWith("//")}function le(e,t){return e===t?!0:e.startsWith(t.endsWith("/")?t:t+"/")}const y={ok:!0};function T(e,t){return new Promise(o=>{if(t!=null&&t.aborted)return o();let i;const a=()=>{clearTimeout(i),o()};i=setTimeout(()=>{t==null||t.removeEventListener("abort",a),o()},e),t==null||t.addEventListener("abort",a,{once:!0})})}function de(e){for(const t of e.split(",").map(o=>o.trim()).filter(Boolean))try{const o=document.querySelector(t);if(o)return{el:o,selector:t}}catch{console.warn(`[oe-guide] Invalid selector skipped: ${t}`)}return null}function q(e,t=8e3,o){return new Promise(i=>{const a=de(e);if(a)return i(a);if(o!=null&&o.aborted)return i(null);let r=!1;const s=f=>{r||(r=!0,p.disconnect(),clearTimeout(d),o==null||o.removeEventListener("abort",u),i(f))},p=new MutationObserver(()=>{const f=de(e);f&&s(f)});p.observe(document.body,{childList:!0,subtree:!0});const u=()=>s(null);o==null||o.addEventListener("abort",u,{once:!0});const d=setTimeout(()=>s(null),t)})}function Be(e=3e3,t){return new Promise(o=>{if(t!=null&&t.aborted)return o();let i=!1;const a=()=>{i||(i=!0,s.disconnect(),clearTimeout(d),t==null||t.removeEventListener("abort",u),requestAnimationFrame(()=>o()))};let r=0;const s=new MutationObserver(f=>{for(const I of f)I.addedNodes.length>0&&(r+=I.addedNodes.length);r>=3&&a()}),p=document.querySelector("main, [role='main']")??document.body;s.observe(p,{childList:!0,subtree:!0});const u=()=>a();t==null||t.addEventListener("abort",u,{once:!0});const d=setTimeout(a,e)})}async function ze(e,t){var a;if(!Oe(e))return{ok:!1,reason:`"${e}" is not a valid page.`,fatal:!0};if(le(window.location.pathname,e))return y;const o=document.querySelector(`a[href="${e}"]`);if(o)o.click();else if(typeof((a=window.history)==null?void 0:a.pushState)=="function")window.history.pushState({},"",e),window.dispatchEvent(new PopStateEvent("popstate"));else return window.location.assign(e),y;const i=Date.now()+5e3;for(;Date.now()<i;){if(t!=null&&t.aborted)return y;if(le(window.location.pathname,e))return await Be(2e3,t),y;await T(100,t)}return{ok:!1,reason:`I couldn't open ${e}. Your account may not have access to that section.`,fatal:!0}}async function Me(e){const t=e.getBoundingClientRect(),o=t.left+t.width/2,i=t.top+t.height/2;Se(o,i);for(const a of["mousedown","mouseup","click"])e.dispatchEvent(new MouseEvent(a,{bubbles:!0,cancelable:!0,clientX:o,clientY:i,view:window}))}async function Ae(e,t,o){e.focus(),e.value="",e.dispatchEvent(new Event("input",{bubbles:!0}));for(const i of t){if(o!=null&&o.aborted)break;e.value+=i,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keydown",{key:i,bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{key:i,bubbles:!0})),await T(40,o)}e.dispatchEvent(new Event("change",{bubbles:!0}))}function R(e){return{ok:!1,reason:`I couldn't find ${e??"that element"} on your screen. It may be hidden on this screen size, or your role may not have access to it.`}}function P(e){"subtitle"in e&&e.subtitle&&ae(e.subtitle,0)}async function ue(e,t){if(t!=null&&t.aborted)return y;switch(e.type!=="clear"&&w(),e.type){case"navigate":{const o=await ze(e.path,t);return o.ok&&P(e),o}case"highlight":{const o=await q(e.selector,3e3,t);return o?(P(e),J(o.selector,e.duration),y):R(e.label)}case"click":{const o=await q(e.selector,5e3,t);return o?(P(e),J(o.selector),await T(1e3,t),t!=null&&t.aborted||(await Me(o.el),w(),await T(400,t)),y):R(e.label)}case"fill":{const o=await q(e.selector,5e3,t);return o?!(o.el instanceof HTMLInputElement)&&!(o.el instanceof HTMLTextAreaElement)?{ok:!1,reason:`${e.label??"That field"} isn't a text field I can type into.`}:(P(e),J(o.selector),await T(400,t),await Ae(o.el,e.value,t),w(),y):R(e.label)}case"scroll":{const o=await q(e.selector,3e3,t);return o?(P(e),o.el.scrollIntoView({behavior:"smooth",block:"center"}),await T(500,t),y):R(e.label)}case"subtitle":return ae(e.text,e.duration??5e3),y;case"wait":return await T(e.ms,t),y;case"clear":return w(),G(),y}}const Pe={"/settings/payments":{message:"Need help connecting Stripe? I can walk you through it.",delay:15e3},"/settings/business":{message:"Setting up your business profile? I can guide you through each field.",delay:2e4},"/settings/rooms":{message:"Want help creating a room or a floor plan? Just ask.",delay:15e3},"/settings/staff":{message:"Need to invite team members? I can show you how.",delay:15e3},"/settings/ticketing":{message:"Setting up ticketing defaults? I can explain what each option does.",delay:2e4},"/settings/quick-setup":{message:"The Quick Setup gets you going fast. Need help with any step?",delay:1e4},"/ticketing":{message:"Want to create your first ticket link? I can walk you through it.",delay:2e4},"/membership":{message:"Ready to set up memberships? I can guide you through your first plan.",delay:2e4},"/pos":{message:"Setting up Point of Sale? I can help you create your first outlet.",delay:2e4},"/audience":{message:"Want to create a campaign or set up automations? Ask me.",delay:25e3},"/reports":{message:"Need help reading your reports? I can explain what each metric means.",delay:2e4},"/calendar":{message:"Want to create your first event? I can show you in 30 seconds.",delay:25e3},"/staff":{message:"Planning shifts? I can show you how to assign your team.",delay:25e3},"/website":{message:"Building your site? I can show you how sections fit together.",delay:25e3},"/welcome":{message:"Welcome to OpenEvent. Want a quick tour of the platform?",delay:5e3}};function _e(e){let t=null,o=-1;for(const[i,a]of Object.entries(Pe))e.startsWith(i)&&i.length>o&&(t=a,o=i.length);return t}const c={active:!1,idleTimer:null,pollTimer:null,lastActivityAt:Date.now(),clickTimes:[],currentPath:"",offered:new Set,dismissedUntil:0,onTrigger:null,isBusy:null},Ue=500;function L(){const e=Date.now();e-c.lastActivityAt<Ue||(c.lastActivityAt=e,Y())}function pe(){const e=Date.now();c.clickTimes=c.clickTimes.filter(t=>e-t<2e3),c.clickTimes.push(e),c.clickTimes.length>=4&&(c.clickTimes=[],K("It looks like something isn't working as expected. Can I help?")),c.lastActivityAt=0,L()}function Y(){c.idleTimer&&clearTimeout(c.idleTimer),c.idleTimer=null;const e=window.location.pathname,t=_e(e);!t||c.offered.has(e)||(c.idleTimer=setTimeout(()=>{window.location.pathname===e&&(c.offered.add(e),K(t.message))},t.delay))}function Ne(){const e=window.location.pathname;e!==c.currentPath&&(c.currentPath=e,Y())}function Ve(){var t;const e=["[data-sonner-toast][data-type='error']",".Toastify__toast--error",".toast-error","[role='alert']"];for(const o of e){const i=document.querySelector(o),a=(t=i==null?void 0:i.textContent)==null?void 0:t.trim();if(!a)continue;const r="error-"+a.slice(0,40);if(!c.offered.has(r)){c.offered.add(r),K("I noticed an error on this page. Want me to help sort it out?");return}}}function K(e){var t;!c.active||!c.onTrigger||Date.now()<c.dismissedUntil||(t=c.isBusy)!=null&&t.call(c)||c.onTrigger(e)}function Fe(){c.dismissedUntil=Date.now()+3e5}function qe(e){c.active||(c.active=!0,c.onTrigger=e.onTrigger,c.isBusy=e.isBusy,c.currentPath=window.location.pathname,document.addEventListener("mousemove",L,{passive:!0}),document.addEventListener("keydown",L,{passive:!0}),document.addEventListener("scroll",L,{passive:!0}),document.addEventListener("click",pe,{passive:!0}),c.pollTimer=setInterval(()=>{Ne(),Ve()},2e3),Y())}function Re(){c.active=!1,c.onTrigger=null,c.isBusy=null,c.idleTimer&&clearTimeout(c.idleTimer),c.pollTimer&&clearInterval(c.pollTimer),c.idleTimer=null,c.pollTimer=null,c.offered.clear(),document.removeEventListener("mousemove",L),document.removeEventListener("keydown",L),document.removeEventListener("scroll",L),document.removeEventListener("click",pe)}const l={active:!1,pc:null,dc:null,stream:null,audioEl:null,micEnabled:!0,callbacks:null};function X(){var t;if(typeof window>"u")return{available:!1,reason:"no-api"};if(!window.isSecureContext)return{available:!1,reason:"insecure-context",detail:"The page is not served over HTTPS."};if(!((t=navigator.mediaDevices)!=null&&t.getUserMedia))return{available:!1,reason:"no-api",detail:"This browser has no getUserMedia."};const e=document.featurePolicy??document.permissionsPolicy;return e&&typeof e.allowsFeature=="function"&&!e.allowsFeature("microphone")?{available:!1,reason:"blocked-by-permissions-policy",detail:"This page sends Permissions-Policy: microphone=(), which disables the microphone for the whole document. It has to be changed on the server. See docs/voice-call-fix.md in openevent-guide."}:{available:!0}}function je(e){return[{type:"function",name:"guide_flow",description:"Run a predefined guided walkthrough in the user's browser. Use this whenever they ask how to do something.",parameters:{type:"object",properties:{flow_id:{type:"string",enum:e,description:"Which walkthrough to run."}},required:["flow_id"]}},{type:"function",name:"navigate",description:"Take the user directly to a page in OpenEvent, without a full walkthrough.",parameters:{type:"object",properties:{path:{type:"string",description:'An OpenEvent path such as "/ticketing" or "/settings/payments".'},subtitle:{type:"string",description:"One short line to show on screen while navigating."}},required:["path"]}}]}function Q(e,t,o){return new Promise((i,a)=>{const r=setTimeout(()=>a(new Error(`${o} timed out after ${Math.round(t/1e3)}s.`)),t);e.then(s=>{clearTimeout(r),i(s)},s=>{clearTimeout(r),a(s)})})}async function He(e){if(l.active)return;const t=X();if(!t.available){const o=t.reason==="blocked-by-permissions-policy"?"Voice is blocked by this site's security policy. The site admin needs to allow the microphone in their server configuration (Permissions-Policy header). Let's chat instead.":t.detail??"Microphone is not available on this page.";throw new Error(o)}l.callbacks=e.callbacks,e.callbacks.onStatus("connecting");try{const o=await Q(e.apiFetch(`${e.serverUrl}/api/voice-session`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:e.sessionId,lang:e.lang})}),1e4,"Voice session setup");if(!o.clientSecret){const d=o.detail??o.error??"";throw new Error(d?`Could not start voice: ${d}`:"The server did not return a voice token. The OpenAI Realtime API may be unavailable.")}const i=new RTCPeerConnection;l.pc=i;const a=document.createElement("audio");a.autoplay=!0,l.audioEl=a,i.ontrack=d=>{a.srcObject=d.streams[0]},i.onconnectionstatechange=()=>{(i.connectionState==="failed"||i.connectionState==="disconnected")&&(e.callbacks.onError("The call dropped. Try again or switch to chat."),ee())};const r=await Q(navigator.mediaDevices.getUserMedia({audio:!0}),8e3,"Microphone access");l.stream=r,l.micEnabled=!0,r.getTracks().forEach(d=>i.addTrack(d,r));const s=i.createDataChannel("oai-events");l.dc=s,s.onopen=()=>{s.send(JSON.stringify({type:"session.update",session:{instructions:o.instructions??"You are the OpenEvent Guide.",tools:je(e.flowIds),tool_choice:"auto",input_audio_transcription:{model:"whisper-1"}}}))},s.onmessage=d=>{try{De(JSON.parse(d.data))}catch{}};const p=await i.createOffer();await i.setLocalDescription(p);const u=await Q(e.apiFetch(`${e.serverUrl}/api/voice-sdp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:e.sessionId,sdp:p.sdp,clientSecret:o.clientSecret,model:o.model})}),15e3,"Voice handshake");if(!u.answer){const d=u.detail??u.error??"";throw new Error(d?`Voice handshake failed: ${d}`:"The voice handshake did not return an answer. The Realtime API endpoint may have changed.")}await i.setRemoteDescription({type:"answer",sdp:u.answer}),l.active=!0,e.callbacks.onStatus("live")}catch(o){throw console.error("[oe-guide] Voice start failed:",o),ge(),o}}function Z(e,t){var o,i;e&&((o=l.dc)==null||o.send(JSON.stringify({type:"conversation.item.create",item:{type:"function_call_output",call_id:e,output:t}})),(i=l.dc)==null||i.send(JSON.stringify({type:"response.create"})))}function De(e){var o,i,a,r;const t=e.type;if(t==="conversation.item.input_audio_transcription.completed"){const s=e.transcript;s&&((o=l.callbacks)==null||o.onTranscript(s,"user"));return}if(t==="response.audio_transcript.done"){const s=e.transcript;s&&((i=l.callbacks)==null||i.onTranscript(s,"assistant"));return}if(t==="error"){const s=(a=e.error)==null?void 0:a.message;console.error("[oe-guide] Realtime error:",s??e),s&&((r=l.callbacks)==null||r.onError(s));return}if(t==="response.function_call_arguments.done"){const s=e.name,p=e.arguments,u=e.call_id;if(!s||!l.callbacks)return;let d={};if(p)try{d=JSON.parse(p)}catch{Z(u,JSON.stringify({ok:!1,error:"arguments were not valid JSON"}));return}l.callbacks.onToolCall(s,d).then(f=>Z(u,f)).catch(f=>Z(u,JSON.stringify({ok:!1,error:String((f==null?void 0:f.message)??f)})))}}function Ge(e){var t;l.micEnabled=e,(t=l.stream)==null||t.getAudioTracks().forEach(o=>{o.enabled=e})}function Je(){return l.micEnabled}function ge(){var e,t,o,i;(e=l.stream)==null||e.getTracks().forEach(a=>a.stop()),(t=l.dc)==null||t.close(),(o=l.pc)==null||o.close(),l.audioEl&&(l.audioEl.srcObject=null,l.audioEl.remove()),l.stream=null,l.pc=null,l.dc=null,l.audioEl=null,l.active=!1,l.micEnabled=!0,(i=l.callbacks)==null||i.onStatus("ended"),l.callbacks=null}function ee(){!l.pc&&!l.stream&&!l.active||ge()}function We(){return l.active}const _="oe-guide-widget",fe="oe-guide-session",j="oe-guide-seen";function Ye(){try{const e=sessionStorage.getItem(fe);if(e)return e;const t=crypto.randomUUID();return sessionStorage.setItem(fe,t),t}catch{return crypto.randomUUID()}}function Ke(e){try{return localStorage.getItem(e)==="1"}catch{return!1}}function te(e){try{localStorage.setItem(e,"1")}catch{}}const n={booted:!1,mode:"hidden",messages:[],typing:!1,running:!1,abort:null,callStatus:"idle",micOn:!0,voiceEnabled:!0,voiceBlocked:null,sessionId:"",serverUrl:"",token:"",user:null,flowIds:[],proactiveMsg:null};function Xe(){for(const e of document.querySelectorAll("script[src]")){const t=e.src;if(t.includes("/sdk.js")||t.includes("/sdk.iife.js")){const o=new URL(t),i=o.pathname.replace(/\/sdk(\.iife)?\.js$/,"");return o.origin+(i==="/"?"":i)}}return window.location.origin}function Qe(){try{return document.documentElement.classList.contains("dark")||localStorage.getItem("theme")==="dark"}catch{return document.documentElement.classList.contains("dark")}}function O(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Ze(){return n.running||n.mode!=="hidden"}function et(){if(document.getElementById("oe-guide-sdk-styles"))return;const e=Qe(),t=e?"#1e293b":"#fff",o=e?"#334155":"#f3f4f6",i=e?"#f1f5f9":"#1f2937",a=e?"#94a3b8":"#6b7280",r=e?"#475569":"#e5e7eb",s=e?"#334155":"#fff",p=e?"#475569":"#eef2ff",u=e?"#1e293b":"#fff",d=document.createElement("style");d.id="oe-guide-sdk-styles",d.textContent=`
    #${_}{position:fixed;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    #${_} *{box-sizing:border-box}

    .oeg-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(99,102,241,.4);transition:transform .2s,box-shadow .2s;z-index:99991}
    .oeg-bubble:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(99,102,241,.5)}
    .oeg-bubble svg{width:24px;height:24px;fill:#fff}
    .oeg-bubble.pulse{animation:oeg-pulse 2s ease-in-out infinite}
    @keyframes oeg-pulse{0%,100%{box-shadow:0 4px 20px rgba(99,102,241,.4)}50%{box-shadow:0 4px 30px rgba(99,102,241,.7)}}

    .oeg-hint{position:fixed;bottom:92px;right:24px;background:${u};color:${i};padding:12px 16px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.15);font-size:14px;line-height:1.5;max-width:280px;animation:oeg-fadein .3s ease;cursor:pointer;border:1px solid ${r};z-index:99991}
    .oeg-hint::after{content:'';position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:${u};border-right:1px solid ${r};border-bottom:1px solid ${r};transform:rotate(45deg)}
    .oeg-hint-x{position:absolute;top:6px;right:10px;cursor:pointer;color:${a};font-size:18px;line-height:1}
    @keyframes oeg-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

    .oeg-welcome-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99995;animation:oeg-fadein .3s ease;backdrop-filter:blur(4px)}
    .oeg-welcome{background:${u};border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-width:480px;width:90%;overflow:hidden;animation:oeg-scalein .35s ease}
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

    .oeg-picker{position:fixed;bottom:92px;right:24px;background:${u};border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:8px;display:flex;flex-direction:column;gap:4px;min-width:200px;animation:oeg-fadein .2s ease;z-index:99992;border:1px solid ${r}}
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
    .oeg-in{flex:1;border:1px solid ${r};border-radius:10px;padding:9px 12px;font-size:16px;outline:none;background:${s};color:${i}}
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
  `,document.head.appendChild(d)}const v={guide:'<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>',send:'<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',close:'<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',mic:'<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm6-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',micOff:'<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>',phone:'<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',phoneEnd:'<svg viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',chat:'<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>'};function g(){var r,s;let e=document.getElementById(_);e||(e=document.createElement("div"),e.id=_,document.body.appendChild(e));const t=((r=n.user)==null?void 0:r.agentName)??"Guide",o=(s=n.user)!=null&&s.name?O(n.user.name):"";let i="";if(n.mode==="welcome"){const p=n.voiceEnabled?`<button class="oeg-welcome-btn primary" id="oeg-start-call">${v.phone} Start call</button>
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
      </div>`}if(n.mode==="chat"){const p=o?`Hi ${o}, I'm your OpenEvent Guide. How can I help?`:`Hi, I'm your OpenEvent Guide. Ask anything, or say "show me".`,u=["Show me around","Create an event","Set up ticketing","Connect Stripe"],d=n.typing||n.running;i+=`
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
        ${n.messages.length===0?`<div class="oeg-sg">${u.map(f=>`<button class="oeg-ch">${f}</button>`).join("")}</div>`:""}
        ${n.running?'<div class="oeg-cancel"><button id="oeg-cancel">Stop guide</button></div>':""}
        <div class="oeg-ir">
          <input class="oeg-in" type="text" placeholder="Ask anything..." id="oeg-in" ${d?"disabled":""} />
          <button class="oeg-sb" id="oeg-sd" ${d?"disabled":""}>${v.send}</button>
        </div>
      </div>`}n.proactiveMsg&&n.mode==="hidden"&&(i+=`<div class="oeg-hint" id="oeg-hint"><span class="oeg-hint-x" id="oeg-hint-x">&times;</span>${O(n.proactiveMsg)}</div>`),n.mode!=="welcome"&&n.mode!=="call"&&(i+=`<button class="oeg-bubble ${n.proactiveMsg&&n.mode==="hidden"?"pulse":""}" id="oeg-tg" aria-label="OpenEvent Guide">
      ${n.mode==="chat"||n.mode==="picker"?v.close:v.guide}
    </button>`),e.innerHTML=i;const a=document.getElementById("oeg-ms");a&&(a.scrollTop=a.scrollHeight),tt(e)}function me(){n.mode="hidden",te(j),g()}function tt(e){var t,o,i,a,r,s,p,u,d,f,I,U,N,ke,Ee,$e;(t=document.getElementById("oeg-start-call"))==null||t.addEventListener("click",()=>ne()),(o=document.getElementById("oeg-start-chat"))==null||o.addEventListener("click",()=>{te(j),n.mode="chat",g()}),(i=document.getElementById("oeg-skip"))==null||i.addEventListener("click",me),(a=document.getElementById("oeg-welcome-overlay"))==null||a.addEventListener("click",x=>{x.target.classList.contains("oeg-welcome-overlay")&&me()}),(r=document.getElementById("oeg-tg"))==null||r.addEventListener("click",()=>{n.mode==="chat"||n.mode==="picker"?n.mode="hidden":(n.mode=n.voiceEnabled?"picker":"chat",n.proactiveMsg=null),g()}),(s=document.getElementById("oeg-pick-call"))==null||s.addEventListener("click",()=>ne()),(p=document.getElementById("oeg-pick-chat"))==null||p.addEventListener("click",()=>{n.mode="chat",g()}),(u=document.getElementById("oeg-call-mic"))==null||u.addEventListener("click",it),(d=document.getElementById("oeg-call-chat"))==null||d.addEventListener("click",()=>{n.mode="chat",g()}),(f=document.getElementById("oeg-call-end"))==null||f.addEventListener("click",ye),(I=document.getElementById("oeg-chat-close"))==null||I.addEventListener("click",()=>{n.mode="hidden",g()}),(U=document.getElementById("oeg-sd"))==null||U.addEventListener("click",()=>oe()),(N=document.getElementById("oeg-in"))==null||N.addEventListener("keydown",x=>{x.key==="Enter"&&!n.typing&&!n.running&&oe()}),(ke=document.getElementById("oeg-cancel"))==null||ke.addEventListener("click",ve),e.querySelectorAll(".oeg-ch").forEach(x=>{x.addEventListener("click",()=>oe(x.textContent??""))}),(Ee=document.getElementById("oeg-hint"))==null||Ee.addEventListener("click",()=>{n.mode="chat",n.proactiveMsg=null,g()}),($e=document.getElementById("oeg-hint-x"))==null||$e.addEventListener("click",x=>{x.stopPropagation(),n.proactiveMsg=null,Fe(),g()}),n.mode==="chat"&&!n.typing&&!n.running&&setTimeout(()=>{var x;return(x=document.getElementById("oeg-in"))==null?void 0:x.focus()},150)}let ot=0;function H(e,t){const o={...t.headers};return n.token&&(o.Authorization=`Bearer ${n.token}`),window.__oeGuideExtProxy?new Promise((a,r)=>{const s="oeg-"+ ++ot;let p;const u=d=>{var f,I,U,N;d.source===window&&(((f=d.data)==null?void 0:f.source)!=="oeg-ext"||((I=d.data)==null?void 0:I.reqId)!==s||(window.removeEventListener("message",u),clearTimeout(p),(U=d.data.response)!=null&&U.ok?a(d.data.response.data):r(new Error(((N=d.data.response)==null?void 0:N.error)??"Extension proxy failed"))))};window.addEventListener("message",u),window.postMessage({source:"oeg-sdk",type:"api-request",reqId:s,url:e,options:{method:t.method,headers:o,body:t.body}},window.location.origin),p=setTimeout(()=>{window.removeEventListener("message",u),r(new Error("Request timed out"))},3e4)}):fetch(e,{...t,headers:o}).then(async a=>{if(!a.ok)throw new Error(`Request failed (${a.status})`);return a.json()})}async function he(){try{const e=await H(`${n.serverUrl}/api/flows`,{method:"GET"});n.flowIds=(e.flows??[]).map(t=>t.id)}catch(e){console.warn("[oe-guide] Could not load flow list:",e)}}function k(e){n.messages.push({role:"status",content:e}),g()}async function be(e){n.running=!0,n.abort=new AbortController;const t=n.abort.signal;g();let o=0,i=!0;try{for(let a=0;a<e.length;a++){if(t.aborted){i=!1;break}const r=e[a];e.length>2&&Le(a+1,e.length),r.type==="navigate"&&k(`Opening ${r.path}...`);const s=await ue(r,t);if(s.ok&&(r.type==="subtitle"?k(r.text):"subtitle"in r&&r.subtitle&&k(r.subtitle)),!s.ok&&s.reason&&(o++,k(s.reason),s.fatal)){i=!1;break}if(t.aborted){i=!1;break}const p=r.type==="navigate"?1800:r.type==="subtitle"?r.duration??4e3:r.type==="highlight"?r.duration??3e3:1500;await T(p,t)}}finally{W(),w(),G(),n.running=!1,n.abort=null,g()}return t.aborted?k("Guide stopped."):i&&o===0?k("Done. Ask me anything else."):i&&k("That's as far as I can take you on this screen."),g(),{completed:i,failures:o}}function ve(){var e;(e=n.abort)==null||e.abort(),n.running=!1,w(),G(),W(),g()}async function oe(e){var i;const t=document.getElementById("oeg-in"),o=(e??(t==null?void 0:t.value)??"").trim();if(!(!o||n.typing||n.running)){t&&(t.value=""),n.messages.push({role:"user",content:o}),n.typing=!0,g();try{const a=await H(`${n.serverUrl}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:n.sessionId,message:o,user:n.user,path:window.location.pathname})});n.typing=!1,n.messages.push({role:"assistant",content:a.reply??""}),g(),(i=a.commands)!=null&&i.length&&await be(a.commands)}catch(a){n.typing=!1,console.error("[oe-guide] Chat failed:",a),n.messages.push({role:"assistant",content:"I couldn't reach the guide service. Please try again."}),g()}}}async function nt(e,t){var o;if(e==="guide_flow"){const i=String(t.flow_id??"");try{const a=await H(`${n.serverUrl}/api/flow/${encodeURIComponent(i)}?lang=${encodeURIComponent(((o=n.user)==null?void 0:o.language)??"en")}`,{method:"GET"});if(!a.flow)return JSON.stringify({ok:!1,error:`No flow called ${i}`});const r=await be(a.flow.steps.map(s=>s.command));return JSON.stringify({ok:!0,flow:i,completed:r.completed,steps_that_failed:r.failures})}catch(a){return JSON.stringify({ok:!1,error:String((a==null?void 0:a.message)??a)})}}if(e==="navigate"){const i=await ue({type:"navigate",path:String(t.path??""),subtitle:typeof t.subtitle=="string"?t.subtitle:void 0});return JSON.stringify(i)}return JSON.stringify({ok:!1,error:`Unknown tool ${e}`})}async function ne(){var e,t;if(!n.voiceEnabled){n.mode="chat",k(((e=n.voiceBlocked)==null?void 0:e.detail)??"Voice isn't available on this page. We can chat instead.");return}n.mode="call",n.callStatus="connecting",g(),n.flowIds.length===0&&await he();try{await He({serverUrl:n.serverUrl,sessionId:n.sessionId,lang:(t=n.user)==null?void 0:t.language,flowIds:n.flowIds,apiFetch:H,callbacks:{onToolCall:nt,onTranscript:(o,i)=>{n.messages.push({role:i,content:o}),g()},onStatus:o=>{n.callStatus=o==="live"?"live":o==="connecting"?"connecting":"idle",o==="ended"&&n.mode==="call"&&(n.mode="hidden"),n.micOn=Je(),g()},onError:o=>k(o)}}),te(j),n.micOn=!0,g()}catch(o){const i=(o==null?void 0:o.message)??"";console.error("[oe-guide] Call failed:",i,o),n.callStatus="idle",n.mode="chat",k(i||"I couldn't start the call. Let's chat instead.")}}function it(){const e=!n.micOn;Ge(e),n.micOn=e,g()}function ye(){ee(),n.callStatus="idle",n.mode="hidden",g()}function at(e){n.mode==="hidden"&&(n.proactiveMsg=e,g())}function xe(e){if(n.booted)return;n.booted=!0,n.user=e,n.serverUrl=(e.server??Xe()).replace(/\/$/,""),n.token=e.token??"",n.sessionId=Ye();const t=X();n.voiceBlocked=t.available?null:t,n.voiceEnabled=!e.disableVoice&&t.available,!t.available&&!e.disableVoice&&console.warn(`[OpenEvent Guide] Voice is unavailable (${t.reason}). ${t.detail??""}`.trim()),Ie(),et(),n.mode=Ke(j)?"hidden":"welcome",g(),he(),e.disableTriggers||qe({onTrigger:at,isBusy:Ze}),console.log("[OpenEvent Guide] Ready",n.serverUrl,n.voiceEnabled?"(voice on)":"(chat only)")}function we(){var e,t;ve(),Re(),We()&&ee(),Ce(),(e=document.getElementById(_))==null||e.remove(),(t=document.getElementById("oe-guide-sdk-styles"))==null||t.remove(),n.booted=!1,n.mode="hidden",n.messages=[]}const rt={boot:xe,shutdown:we,open:()=>{n.mode=n.voiceEnabled?"picker":"chat",g()},close:()=>{n.mode="hidden",g()},startCall:ne,endCall:ye,diagnostics:()=>({...X(),server:n.serverUrl,flows:n.flowIds.length})};return window.OpenEventGuide=rt,V.boot=xe,V.shutdown=we,Object.defineProperty(V,Symbol.toStringTag,{value:"Module"}),V})({});
