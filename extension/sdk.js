var OpenEventGuide=(function(L){"use strict";const W="oe-guide-overlay",V="oe-guide-subtitle",z="oe-guide-highlight",A="oe-guide-spotlight";let w=null,f=null,p=null,m=null,E=null;function le(){if(document.getElementById("oe-guide-overlay-styles"))return;const e=document.createElement("style");e.id="oe-guide-overlay-styles",e.textContent=`
    #${W} {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #${V} {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 600px;
      padding: 12px 24px;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      font-size: 16px;
      line-height: 1.5;
      border-radius: 12px;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100001;
      pointer-events: none;
      backdrop-filter: blur(8px);
    }

    #${V}.visible {
      opacity: 1;
    }

    #${A} {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 99998;
      pointer-events: none;
    }

    #${A}.visible {
      opacity: 1;
    }

    #${z} {
      position: fixed;
      border: 3px solid #6366f1;
      border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25), 0 0 20px rgba(99, 102, 241, 0.3);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      z-index: 100000;
      pointer-events: none;
    }

    #${z}.visible {
      opacity: 1;
    }

    #${z}::after {
      content: '';
      position: absolute;
      inset: -3px;
      border: 3px solid #6366f1;
      border-radius: 8px;
      animation: oe-guide-pulse 2s ease-in-out infinite;
    }

    @keyframes oe-guide-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.05); }
    }

    .oe-guide-click-ripple {
      position: fixed;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.4);
      transform: translate(-50%, -50%) scale(0);
      animation: oe-guide-ripple 0.6s ease-out forwards;
      z-index: 100002;
      pointer-events: none;
    }

    @keyframes oe-guide-ripple {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }

    .oe-guide-step-badge {
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 8px 16px;
      background: #6366f1;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      border-radius: 20px;
      z-index: 100001;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
  `,document.head.appendChild(e)}function de(){w||(le(),w=document.createElement("div"),w.id=W,document.body.appendChild(w),m=document.createElement("div"),m.id=A,document.body.appendChild(m),f=document.createElement("div"),f.id=V,document.body.appendChild(f),p=document.createElement("div"),p.id=z,document.body.appendChild(p))}function F(e,n=5e3){f&&(E&&clearTimeout(E),f.textContent=e,f.classList.add("visible"),n>0&&(E=setTimeout(()=>{f==null||f.classList.remove("visible")},n)))}function U(){E&&clearTimeout(E),f==null||f.classList.remove("visible")}function B(e,n=0){const i=document.querySelector(e);if(!i||!p)return console.warn(`[oe-guide] Element not found: ${e}`),()=>{};const o=i.getBoundingClientRect(),s=6;p.style.top=`${o.top-s}px`,p.style.left=`${o.left-s}px`,p.style.width=`${o.width+s*2}px`,p.style.height=`${o.height+s*2}px`,p.classList.add("visible"),m&&(m.style.clipPath=`polygon(
      0% 0%, 0% 100%, ${o.left-s}px 100%,
      ${o.left-s}px ${o.top-s}px,
      ${o.right+s}px ${o.top-s}px,
      ${o.right+s}px ${o.bottom+s}px,
      ${o.left-s}px ${o.bottom+s}px,
      ${o.left-s}px 100%, 100% 100%, 100% 0%
    )`,m.classList.add("visible")),i.scrollIntoView({behavior:"smooth",block:"center"});const a=()=>{p==null||p.classList.remove("visible"),m==null||m.classList.remove("visible")};return n>0&&setTimeout(a,n),a}function T(){p==null||p.classList.remove("visible"),m==null||m.classList.remove("visible")}function pe(e,n){const i=document.createElement("div");i.className="oe-guide-click-ripple",i.style.left=`${e}px`,i.style.top=`${n}px`,document.body.appendChild(i),setTimeout(()=>i.remove(),600)}function ge(e,n){let i=document.querySelector(".oe-guide-step-badge");i||(i=document.createElement("div"),i.className="oe-guide-step-badge",document.body.appendChild(i)),i.textContent=`Step ${e} of ${n}`,i.style.opacity="1"}function Y(){const e=document.querySelector(".oe-guide-step-badge");e&&e.remove()}function ue(){var e,n;w==null||w.remove(),f==null||f.remove(),p==null||p.remove(),m==null||m.remove(),(e=document.querySelector(".oe-guide-step-badge"))==null||e.remove(),(n=document.getElementById("oe-guide-overlay-styles"))==null||n.remove(),w=null,f=null,p=null,m=null,E&&clearTimeout(E)}function N(e,n=1e4){return new Promise(i=>{const o=document.querySelector(e);if(o){i(o);return}const s=new MutationObserver(()=>{const a=document.querySelector(e);a&&(s.disconnect(),i(a))});s.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{s.disconnect(),i(null)},n)})}function fe(e=5e3){return new Promise(n=>{let i=!1;const o=()=>{i||(i=!0,setTimeout(n,500))},s=()=>o();window.addEventListener("popstate",s,{once:!0});const a=new MutationObserver(()=>{a.disconnect(),o()});a.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{window.removeEventListener("popstate",s),a.disconnect(),o()},e)})}async function me(e){const n=e.getBoundingClientRect(),i=n.left+n.width/2,o=n.top+n.height/2;pe(i,o);for(const s of["mousedown","mouseup","click"])e.dispatchEvent(new MouseEvent(s,{bubbles:!0,cancelable:!0,clientX:i,clientY:o,view:window}))}async function he(e,n){e.focus(),e.value="",e.dispatchEvent(new Event("input",{bubbles:!0}));for(const i of n)e.value+=i,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keydown",{key:i,bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{key:i,bubbles:!0})),await new Promise(o=>setTimeout(o,30+Math.random()*50));e.dispatchEvent(new Event("change",{bubbles:!0}))}async function D(e){switch("subtitle"in e&&e.subtitle&&F(e.subtitle,0),e.type){case"navigate":{if(window.location.pathname!==e.path){const i=[`a[href="${e.path}"]`,`a[href$="${e.path}"]`,`nav a[href*="${e.path.split("/").pop()}"]`];let o=!1;for(const s of i){const a=document.querySelector(s);if(a){a.click(),o=!0;break}}o||(window.location.href=e.path),await fe(),await new Promise(s=>setTimeout(s,1e3))}break}case"highlight":{const n=e.selector.split(",").map(o=>o.trim());let i=!1;for(const o of n)try{if(document.querySelector(o)){B(o,e.duration),i=!0;break}}catch{}if(!i){await new Promise(o=>setTimeout(o,1500));for(const o of n)try{if(document.querySelector(o)){B(o,e.duration);break}}catch{}}break}case"click":{T();const n=e.selector.split(",").map(s=>s.trim());let i=null,o="";for(const s of n)try{if(i=await N(s,3e3),i){o=s;break}}catch{}i?(B(o),await new Promise(s=>setTimeout(s,1200)),await me(i),T(),await new Promise(s=>setTimeout(s,500))):console.warn(`[oe-guide] Could not find element to click: ${e.selector}`);break}case"fill":{const n=await N(e.selector);n&&(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement)?(B(e.selector),await new Promise(i=>setTimeout(i,500)),await he(n,e.value),T()):console.warn(`[oe-guide] Could not find input: ${e.selector}`);break}case"scroll":{const n=await N(e.selector);n&&(n.scrollIntoView({behavior:"smooth",block:"center"}),await new Promise(i=>setTimeout(i,500)));break}case"subtitle":{F(e.text,e.duration??5e3);break}case"wait":{await new Promise(n=>setTimeout(n,e.ms));break}case"sequence":{for(const n of e.commands)await D(n),await new Promise(i=>setTimeout(i,300));break}case"clear":{T(),U();break}}}const be={"/settings/payments":{message:"Need help connecting Stripe? I can walk you through it step by step.",delay:15e3},"/settings/business":{message:"Setting up your business profile? I can guide you through each field.",delay:2e4},"/settings/rooms":{message:"Want help creating a room or floor plan? Just ask!",delay:15e3},"/settings/staff":{message:"Need to invite team members? I can show you how.",delay:15e3},"/settings/ticketing":{message:"Setting up ticketing defaults? I can explain what each option does.",delay:2e4},"/ticketing":{message:"Want to create your first ticket link? I can walk you through it.",delay:2e4},"/membership":{message:"Ready to set up memberships? I can guide you through creating your first plan.",delay:2e4},"/membership/plans":{message:"Need help creating a membership plan? Just say the word.",delay:15e3},"/pos":{message:"Setting up Point of Sale? I can help you create your first outlet.",delay:2e4},"/audience":{message:"Want to create your first email campaign or set up automations? Ask me!",delay:25e3},"/reports":{message:"Need help understanding your reports? I can explain what each metric means.",delay:2e4},"/calendar":{message:"Want to create your first event? I can show you how in 30 seconds.",delay:25e3},"/settings/quick-setup":{message:"The Quick Setup will get you going fast. Need help with any step?",delay:1e4},"/welcome":{message:"Welcome to OpenEvent! Want a quick tour of the platform?",delay:5e3}},c={active:!1,idleTimer:null,lastInteraction:Date.now(),clickTimes:[],currentPath:"",hasOfferedHelp:new Set,dismissedUntil:0,onTrigger:null};function $(){c.lastInteraction=Date.now(),G()}function K(){const e=Date.now();c.clickTimes.push(e),c.clickTimes=c.clickTimes.filter(n=>e-n<2e3),c.clickTimes.length>=4&&(c.clickTimes=[],O("It looks like something isn't working as expected. Can I help?")),$()}function G(){c.idleTimer&&clearTimeout(c.idleTimer);const e=window.location.pathname,n=Object.entries(be).find(([i])=>e.startsWith(i));if(n&&!c.hasOfferedHelp.has(e)){const[,i]=n;c.idleTimer=setTimeout(()=>{c.hasOfferedHelp.add(e),O(i.message)},i.delay)}}function ve(){const e=window.location.pathname;e!==c.currentPath&&(c.currentPath=e,G())}function xe(){const e=["[role='alert']",".toast-error",".Toastify__toast--error","[data-sonner-toast][data-type='error']"];for(const n of e){const i=document.querySelector(n);if(i&&i.textContent&&!c.hasOfferedHelp.has("error-"+i.textContent.slice(0,30))){c.hasOfferedHelp.add("error-"+i.textContent.slice(0,30)),O("I noticed an error occurred. Can I help troubleshoot?");break}}}function ye(){const e="oe-guide-seen";localStorage.getItem(e)||(localStorage.setItem(e,"1"),setTimeout(()=>{O("Welcome to OpenEvent! I'm your guide. Click here for a quick tour of the platform.")},3e3))}function O(e){Date.now()<c.dismissedUntil||c.onTrigger&&c.onTrigger(e)}function we(){c.dismissedUntil=Date.now()+3e5}function ke(e){if(c.active)return;c.active=!0,c.onTrigger=e,c.currentPath=window.location.pathname,document.addEventListener("mousemove",$,{passive:!0}),document.addEventListener("keydown",$,{passive:!0}),document.addEventListener("scroll",$,{passive:!0}),document.addEventListener("click",K,{passive:!0});const n=setInterval(()=>{if(!c.active){clearInterval(n);return}ve(),xe()},2e3);ye(),G()}function Ee(){c.active=!1,c.onTrigger=null,c.idleTimer&&clearTimeout(c.idleTimer),document.removeEventListener("mousemove",$),document.removeEventListener("keydown",$),document.removeEventListener("scroll",$),document.removeEventListener("click",K)}const r={active:!1,pc:null,dc:null,audioEl:null,onToolCall:null,onTranscript:null,onStateChange:null},$e=[{type:"function",name:"guide_flow",description:"Start a predefined guided walkthrough that navigates the user's browser, highlights elements, and shows subtitles.",parameters:{type:"object",properties:{flow_id:{type:"string",description:"Flow ID to execute"}},required:["flow_id"]}},{type:"function",name:"navigate",description:"Navigate the user's browser to a specific page in OpenEvent.",parameters:{type:"object",properties:{path:{type:"string",description:"URL path like /ticketing or /settings/payments"},subtitle:{type:"string",description:"Text to show on screen"}},required:["path"]}},{type:"function",name:"highlight",description:"Highlight a UI element on the page to draw the user's attention.",parameters:{type:"object",properties:{selector:{type:"string",description:"CSS selector of the element"},subtitle:{type:"string",description:"Text to show on screen"}},required:["selector"]}},{type:"function",name:"click",description:"Click a UI element on the page.",parameters:{type:"object",properties:{selector:{type:"string",description:"CSS selector of the element"},subtitle:{type:"string",description:"Text to show on screen"}},required:["selector"]}}];async function Te(e,n,i){const o=`${e}/api/voice-session`,s={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:n})};if(i)return(await i(o,s)).clientSecret;const a=await fetch(o,s);if(!a.ok)throw new Error(`Voice session failed: ${a.status}`);return(await a.json()).clientSecret}async function Se(e,n,i,o,s){var a;if(!r.active){r.onToolCall=o.onToolCall,r.onTranscript=o.onTranscript,r.onStateChange=o.onStateChange;try{const h=await Te(e,n,s),d=new RTCPeerConnection;r.pc=d;const g=document.createElement("audio");g.autoplay=!0,r.audioEl=g,d.ontrack=k=>{g.srcObject=k.streams[0]};const b=await navigator.mediaDevices.getUserMedia({audio:!0});b.getTracks().forEach(k=>d.addTrack(k,b));const u=d.createDataChannel("oai-events");r.dc=u,u.onopen=()=>{u.send(JSON.stringify({type:"session.update",session:{instructions:i,tools:$e,input_audio_transcription:{model:"whisper-1"}}}))},u.onmessage=k=>{try{const j=JSON.parse(k.data);Ie(j)}catch{}};const y=await d.createOffer();await d.setLocalDescription(y);const I=await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",{method:"POST",headers:{Authorization:`Bearer ${h}`,"Content-Type":"application/sdp"},body:y.sdp});if(!I.ok)throw new Error(`SDP exchange failed: ${I.status}`);const H=await I.text();await d.setRemoteDescription({type:"answer",sdp:H}),r.active=!0,(a=r.onStateChange)==null||a.call(r,!0)}catch(h){throw console.error("[oe-guide] Voice start failed:",h),X(),h}}}function Ie(e){var i,o;const n=e.type;if(n==="conversation.item.input_audio_transcription.completed"){const s=e.transcript;s&&((i=r.onTranscript)==null||i.call(r,s,"user"))}if(n==="response.audio_transcript.done"){const s=e.transcript;s&&((o=r.onTranscript)==null||o.call(r,s,"assistant"))}if(n==="response.function_call_arguments.done"){const s=e.name,a=e.arguments,h=e.call_id;if(s&&a)try{const d=JSON.parse(a);let g=null;s==="navigate"?g={type:"navigate",path:d.path,subtitle:d.subtitle}:s==="highlight"?g={type:"highlight",selector:d.selector,subtitle:d.subtitle,duration:5e3}:s==="click"?g={type:"click",selector:d.selector,subtitle:d.subtitle}:s==="guide_flow"&&(g={type:"subtitle",text:`Starting guide: ${d.flow_id}`,duration:3e3}),g&&r.onToolCall&&r.onToolCall(g).then(()=>{var b,u;(b=r.dc)==null||b.send(JSON.stringify({type:"conversation.item.create",item:{type:"function_call_output",call_id:h,output:JSON.stringify({success:!0})}})),(u=r.dc)==null||u.send(JSON.stringify({type:"response.create"}))})}catch{}}}function X(){var e,n,i;(e=r.pc)==null||e.close(),(n=r.dc)==null||n.close(),r.audioEl&&(r.audioEl.srcObject=null,r.audioEl.remove()),r.pc=null,r.dc=null,r.audioEl=null,r.active=!1,(i=r.onStateChange)==null||i.call(r,!1)}function R(){X()}function Ce(){return r.active}const C="oe-guide-widget",t={booted:!1,mode:"hidden",messages:[],typing:!1,running:!1,runningCancel:!1,voiceActive:!1,voiceEnabled:!0,sessionId:crypto.randomUUID(),serverUrl:"",user:null,proactiveMsg:null,firstVisit:!1};function Le(){for(const e of document.querySelectorAll("script[src]")){const n=e.src;if(n.includes("/sdk.js")||n.includes("/sdk.iife.js")){const i=new URL(n),o=i.pathname.replace(/\/sdk(\.iife)?\.js$/,"");return i.origin+(o==="/"?"":o)}}return window.location.origin}function ze(){return document.documentElement.classList.contains("dark")||localStorage.getItem("theme")==="dark"}function P(e){const n=document.createElement("div");return n.textContent=e,n.innerHTML}function Be(){if(document.getElementById("oe-guide-sdk-styles"))return;const e=ze(),n=e?"#1e293b":"#fff",i=e?"#334155":"#f3f4f6",o=e?"#f1f5f9":"#1f2937",s=e?"#94a3b8":"#6b7280",a=e?"#475569":"#e5e7eb",h=e?"#334155":"#fff",d=e?"#f1f5f9":"#1f2937",g=e?"#475569":"#e5e7eb",b=e?"#475569":"#eef2ff",u=e?"#1e293b":"#fff",y=document.createElement("style");y.id="oe-guide-sdk-styles",y.textContent=`
    #${C}{position:fixed;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    #${C} *{box-sizing:border-box}

    /* ── Bubble (bottom-right) ─────────────────── */
    .oeg-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(99,102,241,.4);transition:transform .2s,box-shadow .2s;z-index:99991}
    .oeg-bubble:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(99,102,241,.5)}
    .oeg-bubble svg{width:24px;height:24px;fill:#fff}
    .oeg-bubble.pulse{animation:oeg-pulse 2s ease-in-out infinite}
    @keyframes oeg-pulse{0%,100%{box-shadow:0 4px 20px rgba(99,102,241,.4)}50%{box-shadow:0 4px 30px rgba(99,102,241,.7)}}

    /* ── Proactive hint ────────────────────────── */
    .oeg-hint{position:fixed;bottom:92px;right:24px;background:${u};color:${o};padding:12px 16px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.15);font-size:14px;line-height:1.5;max-width:280px;animation:oeg-fadein .3s ease;cursor:pointer;border:1px solid ${a};z-index:99991}
    .oeg-hint::after{content:'';position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:${u};border-right:1px solid ${a};border-bottom:1px solid ${a};transform:rotate(45deg)}
    .oeg-hint-x{position:absolute;top:6px;right:10px;cursor:pointer;color:${s};font-size:18px;line-height:1}
    @keyframes oeg-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

    /* ── Welcome card (centered) ───────────────── */
    .oeg-welcome-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99995;animation:oeg-fadein .3s ease;backdrop-filter:blur(4px)}
    .oeg-welcome{background:${u};border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-width:480px;width:90%;overflow:hidden;animation:oeg-scalein .35s ease}
    @keyframes oeg-scalein{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
    .oeg-welcome-img{width:100%;height:200px;object-fit:cover;display:block;background:linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 50%,#a5b4fc 100%)}
    .oeg-welcome-body{padding:24px 28px}
    .oeg-welcome-body h2{margin:0 0 8px;font-size:22px;font-weight:700;color:${o}}
    .oeg-welcome-body p{margin:0 0 20px;font-size:15px;color:${s};line-height:1.6}
    .oeg-welcome-agent{display:flex;align-items:center;gap:10px;margin-bottom:20px}
    .oeg-welcome-avatar{width:36px;height:36px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;flex-shrink:0;overflow:hidden}
    .oeg-welcome-avatar img{width:100%;height:100%;object-fit:cover}
    .oeg-welcome-name{font-size:14px;font-weight:600;color:${o}}
    .oeg-welcome-role{font-size:12px;color:${s}}
    .oeg-welcome-actions{display:flex;gap:10px}
    .oeg-welcome-btn{flex:1;padding:12px;border-radius:12px;border:none;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s}
    .oeg-welcome-btn.primary{background:#6366f1;color:#fff}
    .oeg-welcome-btn.primary:hover{background:#4f46e5}
    .oeg-welcome-btn.secondary{background:${i};color:${o};border:1px solid ${a}}
    .oeg-welcome-btn.secondary:hover{background:${b}}
    .oeg-welcome-btn svg{width:18px;height:18px;fill:currentColor}
    .oeg-welcome-skip{display:block;margin:16px auto 0;background:none;border:none;color:${s};font-size:13px;cursor:pointer;padding:4px 8px}
    .oeg-welcome-skip:hover{color:${o}}

    /* ── Picker (call or chat) ─────────────────── */
    .oeg-picker{position:fixed;bottom:92px;right:24px;background:${u};border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:8px;display:flex;flex-direction:column;gap:4px;min-width:200px;animation:oeg-fadein .2s ease;z-index:99992;border:1px solid ${a}}
    .oeg-picker-btn{display:flex;align-items:center;gap:12px;padding:12px 16px;border:none;background:none;cursor:pointer;border-radius:12px;font-size:14px;color:${o};transition:background .15s;width:100%;text-align:left}
    .oeg-picker-btn:hover{background:${i}}
    .oeg-picker-btn svg{width:20px;height:20px;fill:#6366f1;flex-shrink:0}
    .oeg-picker-label{font-weight:500}
    .oeg-picker-desc{font-size:12px;color:${s}}

    /* ── Call pill (bottom center) ──────────────── */
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
    .oeg-call-status .listening{color:#22c55e}
    .oeg-call-status .speaking{color:#6366f1}
    .oeg-call-wave{display:flex;gap:2px;align-items:center;justify-content:center;height:20px}
    .oeg-call-wave span{width:3px;background:#6366f1;border-radius:2px;animation:oeg-wave 1s ease-in-out infinite}
    .oeg-call-wave span:nth-child(1){height:8px;animation-delay:0s}
    .oeg-call-wave span:nth-child(2){height:14px;animation-delay:.15s}
    .oeg-call-wave span:nth-child(3){height:20px;animation-delay:.3s}
    .oeg-call-wave span:nth-child(4){height:14px;animation-delay:.45s}
    .oeg-call-wave span:nth-child(5){height:8px;animation-delay:.6s}
    @keyframes oeg-wave{0%,100%{height:8px}50%{height:20px}}

    /* ── Chat panel ────────────────────────────── */
    .oeg-chat{position:fixed;bottom:92px;right:24px;width:380px;max-height:520px;background:${n};border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden;animation:oeg-fadein .25s ease;z-index:99992;border:1px solid ${a}}
    .oeg-chat-hd{padding:14px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;gap:10px}
    .oeg-chat-hd svg{width:20px;height:20px;fill:#fff;opacity:.8}
    .oeg-chat-hd h3{margin:0;font-size:15px;font-weight:600;flex:1}
    .oeg-chat-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.7);padding:4px}
    .oeg-chat-close:hover{color:#fff}
    .oeg-chat-close svg{width:18px;height:18px;fill:currentColor}
    .oeg-ms{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:180px;max-height:360px}
    .oeg-m{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word;animation:oeg-fadein .2s ease}
    .oeg-m.user{align-self:flex-end;background:#6366f1;color:#fff;border-bottom-right-radius:4px}
    .oeg-m.assistant{align-self:flex-start;background:${i};color:${o};border-bottom-left-radius:4px}
    .oeg-m.status{align-self:center;background:transparent;color:#6366f1;font-size:12px;font-weight:500;padding:2px 0}
    .oeg-tp{align-self:flex-start;padding:10px 14px;background:${i};border-radius:12px;display:flex;gap:4px}
    .oeg-tp span{width:5px;height:5px;background:#9ca3af;border-radius:50%;animation:oeg-bo 1.4s ease-in-out infinite}
    .oeg-tp span:nth-child(2){animation-delay:.2s}.oeg-tp span:nth-child(3){animation-delay:.4s}
    @keyframes oeg-bo{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    .oeg-sg{padding:6px 14px 2px;display:flex;flex-wrap:wrap;gap:5px}
    .oeg-ch{padding:5px 10px;border:1px solid ${g};border-radius:14px;background:${e?"#334155":"#fff"};font-size:12px;color:#6366f1;cursor:pointer;transition:all .15s}
    .oeg-ch:hover{background:${b};border-color:#6366f1}
    .oeg-ir{padding:10px 14px;border-top:1px solid ${a};display:flex;gap:6px}
    .oeg-in{flex:1;border:1px solid ${g};border-radius:10px;padding:9px 12px;font-size:14px;outline:none;transition:border-color .2s;background:${h};color:${d}}
    .oeg-in:focus{border-color:#6366f1}
    .oeg-in::placeholder{color:#9ca3af}
    .oeg-sb{width:38px;height:38px;border:none;background:#6366f1;color:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .oeg-sb:hover{background:#4f46e5}
    .oeg-sb svg{width:16px;height:16px;fill:currentColor}
    .oeg-cancel{display:flex;justify-content:center;padding:0 14px 6px}
    .oeg-cancel button{padding:5px 14px;border:1px solid #ef4444;border-radius:8px;background:transparent;color:#ef4444;font-size:12px;cursor:pointer}
    .oeg-cancel button:hover{background:#ef4444;color:#fff}

    @media(max-width:440px){.oeg-chat{width:calc(100vw - 16px);right:8px;bottom:80px}.oeg-welcome{width:95%}}
  `,document.head.appendChild(y)}const v={guide:'<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>',send:'<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',close:'<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',mic:'<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',micOff:'<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>',phone:'<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',phoneEnd:'<svg viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',chat:'<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>'};function l(){var a,h,d,g,b,u,y,I,H,k,j,oe,ne,ie,se,ae,re,ce;let e=document.getElementById(C);e||(e=document.createElement("div"),e.id=C,document.body.appendChild(e));const n=((a=t.user)==null?void 0:a.agentName)??"Guide",i=(h=t.user)!=null&&h.name?P(t.user.name):"";let o="";if(t.mode==="welcome"&&(o=`
      <div class="oeg-welcome-overlay" id="oeg-welcome-overlay">
        <div class="oeg-welcome">
          <div class="oeg-welcome-img"></div>
          <div class="oeg-welcome-body">
            <h2>Ready for a quick walkthrough?</h2>
            <p>I'll guide you through the platform step by step, and I can answer any questions you might have.</p>
            <div class="oeg-welcome-agent">
              <div class="oeg-welcome-avatar">${n[0]}</div>
              <div>
                <div class="oeg-welcome-name">${P(n)}</div>
                <div class="oeg-welcome-role">Your OpenEvent assistant</div>
              </div>
            </div>
            <div class="oeg-welcome-actions">
              <button class="oeg-welcome-btn primary" id="oeg-start-call">${v.phone} Start call</button>
              <button class="oeg-welcome-btn secondary" id="oeg-start-chat">${v.chat} Chat instead</button>
            </div>
            <button class="oeg-welcome-skip" id="oeg-skip">Skip for now</button>
          </div>
        </div>
      </div>`),t.mode==="picker"&&(o+=`
      <div class="oeg-picker" id="oeg-picker">
        <button class="oeg-picker-btn" id="oeg-pick-call">
          ${v.phone}
          <div>
            <div class="oeg-picker-label">Start a call</div>
            <div class="oeg-picker-desc">Voice walkthrough with your guide</div>
          </div>
        </button>
        <button class="oeg-picker-btn" id="oeg-pick-chat">
          ${v.chat}
          <div>
            <div class="oeg-picker-label">Chat</div>
            <div class="oeg-picker-desc">Type your questions</div>
          </div>
        </button>
      </div>`),t.mode==="call"&&(o+=`
      <div class="oeg-call-pill">
        <button class="oeg-call-btn mic ${t.voiceActive?"":"muted"}" id="oeg-call-mic" title="${t.voiceActive?"Mute":"Unmute"}">
          ${t.voiceActive?v.mic:v.micOff}
        </button>
        <div class="oeg-call-status">
          ${t.voiceActive?'<div class="oeg-call-wave"><span></span><span></span><span></span><span></span><span></span></div>':'<span style="color:#9ca3af">Muted</span>'}
        </div>
        <button class="oeg-call-btn chat" id="oeg-call-chat" title="Open chat">${v.chat}</button>
        <button class="oeg-call-btn end" id="oeg-call-end" title="End call">${v.phoneEnd}</button>
      </div>`),t.mode==="chat"){const x=i?`Hi ${i}! I'm your OpenEvent Guide. How can I help?`:`Hi! I'm your OpenEvent Guide. Ask anything or say "show me".`,q=["Show me around","Create an event","Set up ticketing","Connect Stripe"];o+=`
      <div class="oeg-chat">
        <div class="oeg-chat-hd">
          ${v.guide}
          <h3>OpenEvent Guide</h3>
          <button class="oeg-chat-close" id="oeg-chat-close">${v.close}</button>
        </div>
        <div class="oeg-ms" id="oeg-ms">
          ${t.messages.length===0?`<div class="oeg-m assistant">${x}</div>`:""}
          ${t.messages.map(_=>`<div class="oeg-m ${_.role}">${P(_.content)}</div>`).join("")}
          ${t.typing?'<div class="oeg-tp"><span></span><span></span><span></span></div>':""}
        </div>
        ${t.messages.length===0?`<div class="oeg-sg">${q.map(_=>`<button class="oeg-ch">${_}</button>`).join("")}</div>`:""}
        ${t.running?'<div class="oeg-cancel"><button id="oeg-cancel">Stop guide</button></div>':""}
        <div class="oeg-ir">
          <input class="oeg-in" type="text" placeholder="Ask anything..." id="oeg-in" ${t.typing||t.running?"disabled":""} />
          <button class="oeg-sb" id="oeg-sd" ${t.typing||t.running?"disabled":""}>${v.send}</button>
        </div>
      </div>`}t.proactiveMsg&&t.mode==="hidden"&&(o+=`<div class="oeg-hint" id="oeg-hint"><span class="oeg-hint-x" id="oeg-hint-x">&times;</span>${P(t.proactiveMsg)}</div>`),t.mode!=="welcome"&&t.mode!=="call"&&(o+=`<button class="oeg-bubble ${t.proactiveMsg&&t.mode==="hidden"?"pulse":""}" id="oeg-tg">
      ${t.mode==="chat"||t.mode==="picker"?v.close:v.guide}
    </button>`),e.innerHTML=o;const s=document.getElementById("oeg-ms");s&&(s.scrollTop=s.scrollHeight),(d=document.getElementById("oeg-start-call"))==null||d.addEventListener("click",()=>M()),(g=document.getElementById("oeg-start-chat"))==null||g.addEventListener("click",()=>{t.mode="chat",l()}),(b=document.getElementById("oeg-skip"))==null||b.addEventListener("click",()=>{t.mode="hidden",localStorage.setItem("oe-guide-seen","1"),l()}),(u=document.getElementById("oeg-welcome-overlay"))==null||u.addEventListener("click",x=>{x.target.classList.contains("oeg-welcome-overlay")&&(t.mode="hidden",localStorage.setItem("oe-guide-seen","1"),l())}),(y=document.getElementById("oeg-tg"))==null||y.addEventListener("click",()=>{t.mode==="chat"||t.mode==="picker"?t.mode="hidden":(t.mode=t.voiceEnabled?"picker":"chat",t.proactiveMsg=null),l()}),(I=document.getElementById("oeg-pick-call"))==null||I.addEventListener("click",()=>M()),(H=document.getElementById("oeg-pick-chat"))==null||H.addEventListener("click",()=>{t.mode="chat",l()}),(k=document.getElementById("oeg-call-mic"))==null||k.addEventListener("click",Oe),(j=document.getElementById("oeg-call-chat"))==null||j.addEventListener("click",()=>{t.mode="chat",l()}),(oe=document.getElementById("oeg-call-end"))==null||oe.addEventListener("click",Q),(ne=document.getElementById("oeg-chat-close"))==null||ne.addEventListener("click",()=>{t.mode="hidden",l()}),(ie=document.getElementById("oeg-sd"))==null||ie.addEventListener("click",J),(se=document.getElementById("oeg-in"))==null||se.addEventListener("keydown",x=>{x.key==="Enter"&&!t.typing&&!t.running&&J()}),(ae=document.getElementById("oeg-cancel"))==null||ae.addEventListener("click",He),e.querySelectorAll(".oeg-ch").forEach(x=>{x.addEventListener("click",()=>{const q=document.getElementById("oeg-in");q&&(q.value=x.textContent??"",J())})}),(re=document.getElementById("oeg-hint"))==null||re.addEventListener("click",()=>{t.mode="chat",t.proactiveMsg=null,l()}),(ce=document.getElementById("oeg-hint-x"))==null||ce.addEventListener("click",x=>{x.stopPropagation(),t.proactiveMsg=null,we(),l()}),t.mode==="chat"&&setTimeout(()=>{var x;return(x=document.getElementById("oeg-in"))==null?void 0:x.focus()},200)}async function M(){var e;t.mode="call",l();try{await Se(t.serverUrl,t.sessionId,`You are the OpenEvent Guide. Help ${((e=t.user)==null?void 0:e.name)??"the user"} learn to use OpenEvent. Keep responses short (1-2 sentences). You can control their browser with tools. Be warm and conversational.`,{onToolCall:async n=>{await D(n)},onTranscript:(n,i)=>{t.messages.push({role:i==="user"?"user":"assistant",content:n})},onStateChange:n=>{t.voiceActive=n,l()}},Z),t.voiceActive=!0,localStorage.setItem("oe-guide-seen","1"),l()}catch{S("Could not start voice. Check microphone permissions."),t.mode="chat",l()}}function Oe(){t.voiceActive?(R(),t.voiceActive=!1):M(),l()}function Q(){R(),t.voiceActive=!1,t.mode="hidden",l()}function Pe(e){return new Promise(n=>{const i=setInterval(()=>{t.runningCancel&&(clearInterval(i),n())},100);setTimeout(()=>{clearInterval(i),n()},e)})}async function Me(e){t.running=!0,t.runningCancel=!1,l();const n=e.length;for(let i=0;i<e.length&&!t.runningCancel;i++){const o=e[i];if(n>2&&ge(i+1,n),o.type==="subtitle"&&"text"in o?S(o.text):"subtitle"in o&&o.subtitle?S(o.subtitle):o.type==="navigate"&&"path"in o&&S(`Navigating to ${o.path}...`),await D(o),t.runningCancel)break;const s=o.type==="navigate"?3e3:o.type==="subtitle"?o.duration??4e3:o.type==="highlight"?o.duration??3e3:2e3;await Pe(s)}Y(),T(),U(),t.running=!1,S(t.runningCancel?"Guide stopped.":"Done! Ask me anything else."),l()}function He(){t.runningCancel=!0,t.running=!1,T(),U(),Y(),l()}function S(e){t.messages.push({role:"status",content:e}),l()}let je=0;function Z(e,n){return window.__oeGuideExtProxy?new Promise((o,s)=>{const a="oeg-"+ ++je,h=d=>{var g,b,u,y;((g=d.data)==null?void 0:g.source)!=="oeg-ext"||((b=d.data)==null?void 0:b.reqId)!==a||(window.removeEventListener("message",h),(u=d.data.response)!=null&&u.ok?o(d.data.response.data):s(new Error(((y=d.data.response)==null?void 0:y.error)??"Extension proxy failed")))};window.addEventListener("message",h),window.postMessage({source:"oeg-sdk",type:"api-request",reqId:a,url:e,options:{method:n.method,headers:n.headers,body:n.body}},"*"),setTimeout(()=>{window.removeEventListener("message",h),s(new Error("Request timed out"))},3e4)}):fetch(e,n).then(o=>{if(!o.ok)throw new Error(`${o.status}`);return o.json()})}async function J(){var i;const e=document.getElementById("oeg-in");if(!(e!=null&&e.value.trim())||t.typing||t.running)return;const n=e.value.trim();e.value="",t.messages.push({role:"user",content:n}),t.typing=!0,l();try{const o=await Z(`${t.serverUrl}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:t.sessionId,message:n,user:t.user})});if(t.messages.push({role:"assistant",content:o.reply}),t.typing=!1,l(),(i=o.commands)!=null&&i.length)try{await Me(o.commands)}catch(s){console.error("[oe-guide] Flow error:",s),t.running=!1,S("The guide ran into an issue on this page. Try asking again."),l()}}catch(o){t.typing=!1,console.error("[oe-guide] Chat failed:",o),t.messages.push({role:"assistant",content:"Connection issue. Please try again."}),l()}}function qe(e){t.mode==="chat"?(t.messages.push({role:"assistant",content:e}),l()):t.mode==="hidden"&&(t.proactiveMsg=e,l())}function ee(e){t.booted||(t.booted=!0,t.user=e,t.serverUrl=e.server??Le(),t.voiceEnabled=!e.disableVoice,t.firstVisit=!localStorage.getItem("oe-guide-seen"),de(),Be(),t.mode=t.firstVisit?"welcome":"hidden",l(),e.disableTriggers||ke(qe),console.log("[OpenEvent Guide] Ready",t.serverUrl))}function te(){var e,n;t.booted=!1,t.mode="hidden",t.messages=[],Ee(),Ce()&&R(),ue(),(e=document.getElementById(C))==null||e.remove(),(n=document.getElementById("oe-guide-sdk-styles"))==null||n.remove()}const _e={boot:ee,shutdown:te,open:()=>{t.mode=t.voiceEnabled?"picker":"chat",l()},close:()=>{t.mode="hidden",l()},startCall:M,endCall:Q};return window.OpenEventGuide=_e,L.boot=ee,L.shutdown=te,Object.defineProperty(L,Symbol.toStringTag,{value:"Module"}),L})({});
