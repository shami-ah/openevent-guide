var OpenEventGuide=(function(S){"use strict";const F="oe-guide-overlay",q="oe-guide-subtitle",C="oe-guide-highlight",V="oe-guide-spotlight";let w=null,f=null,p=null,m=null,E=null;function ce(){if(document.getElementById("oe-guide-overlay-styles"))return;const e=document.createElement("style");e.id="oe-guide-overlay-styles",e.textContent=`
    #${F} {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #${q} {
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

    #${q}.visible {
      opacity: 1;
    }

    #${V} {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 99998;
      pointer-events: none;
    }

    #${V}.visible {
      opacity: 1;
    }

    #${C} {
      position: fixed;
      border: 3px solid #6366f1;
      border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25), 0 0 20px rgba(99, 102, 241, 0.3);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      z-index: 100000;
      pointer-events: none;
    }

    #${C}.visible {
      opacity: 1;
    }

    #${C}::after {
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
  `,document.head.appendChild(e)}function le(){w||(ce(),w=document.createElement("div"),w.id=F,document.body.appendChild(w),m=document.createElement("div"),m.id=V,document.body.appendChild(m),f=document.createElement("div"),f.id=q,document.body.appendChild(f),p=document.createElement("div"),p.id=C,document.body.appendChild(p))}function J(e,o=5e3){f&&(E&&clearTimeout(E),f.textContent=e,f.classList.add("visible"),o>0&&(E=setTimeout(()=>{f==null||f.classList.remove("visible")},o)))}function A(){E&&clearTimeout(E),f==null||f.classList.remove("visible")}function U(e,o=0){const n=document.querySelector(e);if(!n||!p)return console.warn(`[oe-guide] Element not found: ${e}`),()=>{};const i=n.getBoundingClientRect(),s=6;p.style.top=`${i.top-s}px`,p.style.left=`${i.left-s}px`,p.style.width=`${i.width+s*2}px`,p.style.height=`${i.height+s*2}px`,p.classList.add("visible"),m&&(m.style.clipPath=`polygon(
      0% 0%, 0% 100%, ${i.left-s}px 100%,
      ${i.left-s}px ${i.top-s}px,
      ${i.right+s}px ${i.top-s}px,
      ${i.right+s}px ${i.bottom+s}px,
      ${i.left-s}px ${i.bottom+s}px,
      ${i.left-s}px 100%, 100% 100%, 100% 0%
    )`,m.classList.add("visible")),n.scrollIntoView({behavior:"smooth",block:"center"});const r=()=>{p==null||p.classList.remove("visible"),m==null||m.classList.remove("visible")};return o>0&&setTimeout(r,o),r}function T(){p==null||p.classList.remove("visible"),m==null||m.classList.remove("visible")}function de(e,o){const n=document.createElement("div");n.className="oe-guide-click-ripple",n.style.left=`${e}px`,n.style.top=`${o}px`,document.body.appendChild(n),setTimeout(()=>n.remove(),600)}function pe(e,o){let n=document.querySelector(".oe-guide-step-badge");n||(n=document.createElement("div"),n.className="oe-guide-step-badge",document.body.appendChild(n)),n.textContent=`Step ${e} of ${o}`,n.style.opacity="1"}function W(){const e=document.querySelector(".oe-guide-step-badge");e&&e.remove()}function ge(){var e,o;w==null||w.remove(),f==null||f.remove(),p==null||p.remove(),m==null||m.remove(),(e=document.querySelector(".oe-guide-step-badge"))==null||e.remove(),(o=document.getElementById("oe-guide-overlay-styles"))==null||o.remove(),w=null,f=null,p=null,m=null,E&&clearTimeout(E)}function L(e,o=1e4){return new Promise(n=>{const i=document.querySelector(e);if(i){n(i);return}const s=new MutationObserver(()=>{const r=document.querySelector(e);r&&(s.disconnect(),n(r))});s.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{s.disconnect(),n(null)},o)})}function ue(e=5e3){return new Promise(o=>{let n=!1;const i=()=>{n||(n=!0,setTimeout(o,500))},s=()=>i();window.addEventListener("popstate",s,{once:!0});const r=new MutationObserver(()=>{r.disconnect(),i()});r.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{window.removeEventListener("popstate",s),r.disconnect(),i()},e)})}async function fe(e){const o=e.getBoundingClientRect(),n=o.left+o.width/2,i=o.top+o.height/2;de(n,i);for(const s of["mousedown","mouseup","click"])e.dispatchEvent(new MouseEvent(s,{bubbles:!0,cancelable:!0,clientX:n,clientY:i,view:window}))}async function me(e,o){e.focus(),e.value="",e.dispatchEvent(new Event("input",{bubbles:!0}));for(const n of o)e.value+=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keydown",{key:n,bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{key:n,bubbles:!0})),await new Promise(i=>setTimeout(i,30+Math.random()*50));e.dispatchEvent(new Event("change",{bubbles:!0}))}async function N(e){switch("subtitle"in e&&e.subtitle&&J(e.subtitle,0),e.type){case"navigate":{if(window.location.pathname!==e.path){const n=document.querySelector(`a[href="${e.path}"], a[href*="${e.path}"]`);n?n.click():window.location.href=e.path,await ue()}break}case"highlight":{await L(e.selector)?U(e.selector,e.duration):console.warn(`[oe-guide] Could not find element: ${e.selector}`);break}case"click":{T();const o=await L(e.selector);o?(U(e.selector),await new Promise(n=>setTimeout(n,800)),await fe(o),T(),await new Promise(n=>setTimeout(n,300))):console.warn(`[oe-guide] Could not find element to click: ${e.selector}`);break}case"fill":{const o=await L(e.selector);o&&(o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement)?(U(e.selector),await new Promise(n=>setTimeout(n,500)),await me(o,e.value),T()):console.warn(`[oe-guide] Could not find input: ${e.selector}`);break}case"scroll":{const o=await L(e.selector);o&&(o.scrollIntoView({behavior:"smooth",block:"center"}),await new Promise(n=>setTimeout(n,500)));break}case"subtitle":{J(e.text,e.duration??5e3);break}case"wait":{await new Promise(o=>setTimeout(o,e.ms));break}case"sequence":{for(const o of e.commands)await N(o),await new Promise(n=>setTimeout(n,300));break}case"clear":{T(),A();break}}}const he={"/settings/payments":{message:"Need help connecting Stripe? I can walk you through it step by step.",delay:15e3},"/settings/business":{message:"Setting up your business profile? I can guide you through each field.",delay:2e4},"/settings/rooms":{message:"Want help creating a room or floor plan? Just ask!",delay:15e3},"/settings/staff":{message:"Need to invite team members? I can show you how.",delay:15e3},"/settings/ticketing":{message:"Setting up ticketing defaults? I can explain what each option does.",delay:2e4},"/ticketing":{message:"Want to create your first ticket link? I can walk you through it.",delay:2e4},"/membership":{message:"Ready to set up memberships? I can guide you through creating your first plan.",delay:2e4},"/membership/plans":{message:"Need help creating a membership plan? Just say the word.",delay:15e3},"/pos":{message:"Setting up Point of Sale? I can help you create your first outlet.",delay:2e4},"/audience":{message:"Want to create your first email campaign or set up automations? Ask me!",delay:25e3},"/reports":{message:"Need help understanding your reports? I can explain what each metric means.",delay:2e4},"/calendar":{message:"Want to create your first event? I can show you how in 30 seconds.",delay:25e3},"/settings/quick-setup":{message:"The Quick Setup will get you going fast. Need help with any step?",delay:1e4},"/welcome":{message:"Welcome to OpenEvent! Want a quick tour of the platform?",delay:5e3}},c={active:!1,idleTimer:null,lastInteraction:Date.now(),clickTimes:[],currentPath:"",hasOfferedHelp:new Set,dismissedUntil:0,onTrigger:null};function $(){c.lastInteraction=Date.now(),D()}function Y(){const e=Date.now();c.clickTimes.push(e),c.clickTimes=c.clickTimes.filter(o=>e-o<2e3),c.clickTimes.length>=4&&(c.clickTimes=[],z("It looks like something isn't working as expected. Can I help?")),$()}function D(){c.idleTimer&&clearTimeout(c.idleTimer);const e=window.location.pathname,o=Object.entries(he).find(([n])=>e.startsWith(n));if(o&&!c.hasOfferedHelp.has(e)){const[,n]=o;c.idleTimer=setTimeout(()=>{c.hasOfferedHelp.add(e),z(n.message)},n.delay)}}function be(){const e=window.location.pathname;e!==c.currentPath&&(c.currentPath=e,D())}function ve(){const e=["[role='alert']",".toast-error",".Toastify__toast--error","[data-sonner-toast][data-type='error']"];for(const o of e){const n=document.querySelector(o);if(n&&n.textContent&&!c.hasOfferedHelp.has("error-"+n.textContent.slice(0,30))){c.hasOfferedHelp.add("error-"+n.textContent.slice(0,30)),z("I noticed an error occurred. Can I help troubleshoot?");break}}}function xe(){const e="oe-guide-seen";localStorage.getItem(e)||(localStorage.setItem(e,"1"),setTimeout(()=>{z("Welcome to OpenEvent! I'm your guide. Click here for a quick tour of the platform.")},3e3))}function z(e){Date.now()<c.dismissedUntil||c.onTrigger&&c.onTrigger(e)}function ye(){c.dismissedUntil=Date.now()+3e5}function we(e){if(c.active)return;c.active=!0,c.onTrigger=e,c.currentPath=window.location.pathname,document.addEventListener("mousemove",$,{passive:!0}),document.addEventListener("keydown",$,{passive:!0}),document.addEventListener("scroll",$,{passive:!0}),document.addEventListener("click",Y,{passive:!0});const o=setInterval(()=>{if(!c.active){clearInterval(o);return}be(),ve()},2e3);xe(),D()}function ke(){c.active=!1,c.onTrigger=null,c.idleTimer&&clearTimeout(c.idleTimer),document.removeEventListener("mousemove",$),document.removeEventListener("keydown",$),document.removeEventListener("scroll",$),document.removeEventListener("click",Y)}const a={active:!1,pc:null,dc:null,audioEl:null,onToolCall:null,onTranscript:null,onStateChange:null},Ee=[{type:"function",name:"guide_flow",description:"Start a predefined guided walkthrough that navigates the user's browser, highlights elements, and shows subtitles.",parameters:{type:"object",properties:{flow_id:{type:"string",description:"Flow ID to execute"}},required:["flow_id"]}},{type:"function",name:"navigate",description:"Navigate the user's browser to a specific page in OpenEvent.",parameters:{type:"object",properties:{path:{type:"string",description:"URL path like /ticketing or /settings/payments"},subtitle:{type:"string",description:"Text to show on screen"}},required:["path"]}},{type:"function",name:"highlight",description:"Highlight a UI element on the page to draw the user's attention.",parameters:{type:"object",properties:{selector:{type:"string",description:"CSS selector of the element"},subtitle:{type:"string",description:"Text to show on screen"}},required:["selector"]}},{type:"function",name:"click",description:"Click a UI element on the page.",parameters:{type:"object",properties:{selector:{type:"string",description:"CSS selector of the element"},subtitle:{type:"string",description:"Text to show on screen"}},required:["selector"]}}];async function $e(e,o){const n=await fetch(`${e}/api/voice-session`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:o})});if(!n.ok)throw new Error(`Voice session failed: ${n.status}`);return(await n.json()).clientSecret}async function Te(e,o,n,i){var s;if(!a.active){a.onToolCall=i.onToolCall,a.onTranscript=i.onTranscript,a.onStateChange=i.onStateChange;try{const r=await $e(e,o),g=new RTCPeerConnection;a.pc=g;const d=document.createElement("audio");d.autoplay=!0,a.audioEl=d,g.ontrack=k=>{d.srcObject=k.streams[0]};const u=await navigator.mediaDevices.getUserMedia({audio:!0});u.getTracks().forEach(k=>g.addTrack(k,u));const h=g.createDataChannel("oai-events");a.dc=h,h.onopen=()=>{h.send(JSON.stringify({type:"session.update",session:{instructions:n,tools:Ee,input_audio_transcription:{model:"whisper-1"}}}))},h.onmessage=k=>{try{const H=JSON.parse(k.data);Ie(H)}catch{}};const b=await g.createOffer();await g.setLocalDescription(b);const x=await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",{method:"POST",headers:{Authorization:`Bearer ${r}`,"Content-Type":"application/sdp"},body:b.sdp});if(!x.ok)throw new Error(`SDP exchange failed: ${x.status}`);const P=await x.text();await g.setRemoteDescription({type:"answer",sdp:P}),a.active=!0,(s=a.onStateChange)==null||s.call(a,!0)}catch(r){throw console.error("[oe-guide] Voice start failed:",r),K(),r}}}function Ie(e){var n,i;const o=e.type;if(o==="conversation.item.input_audio_transcription.completed"){const s=e.transcript;s&&((n=a.onTranscript)==null||n.call(a,s,"user"))}if(o==="response.audio_transcript.done"){const s=e.transcript;s&&((i=a.onTranscript)==null||i.call(a,s,"assistant"))}if(o==="response.function_call_arguments.done"){const s=e.name,r=e.arguments,g=e.call_id;if(s&&r)try{const d=JSON.parse(r);let u=null;s==="navigate"?u={type:"navigate",path:d.path,subtitle:d.subtitle}:s==="highlight"?u={type:"highlight",selector:d.selector,subtitle:d.subtitle,duration:5e3}:s==="click"?u={type:"click",selector:d.selector,subtitle:d.subtitle}:s==="guide_flow"&&(u={type:"subtitle",text:`Starting guide: ${d.flow_id}`,duration:3e3}),u&&a.onToolCall&&a.onToolCall(u).then(()=>{var h,b;(h=a.dc)==null||h.send(JSON.stringify({type:"conversation.item.create",item:{type:"function_call_output",call_id:g,output:JSON.stringify({success:!0})}})),(b=a.dc)==null||b.send(JSON.stringify({type:"response.create"}))})}catch{}}}function K(){var e,o,n;(e=a.pc)==null||e.close(),(o=a.dc)==null||o.close(),a.audioEl&&(a.audioEl.srcObject=null,a.audioEl.remove()),a.pc=null,a.dc=null,a.audioEl=null,a.active=!1,(n=a.onStateChange)==null||n.call(a,!1)}function G(){K()}function Se(){return a.active}const I="oe-guide-widget",t={booted:!1,mode:"hidden",messages:[],typing:!1,running:!1,runningCancel:!1,voiceActive:!1,voiceEnabled:!0,sessionId:crypto.randomUUID(),serverUrl:"",user:null,proactiveMsg:null,firstVisit:!1};function Ce(){for(const e of document.querySelectorAll("script[src]")){const o=e.src;if(o.includes("/sdk.js")||o.includes("/sdk.iife.js")){const n=new URL(o),i=n.pathname.replace(/\/sdk(\.iife)?\.js$/,"");return n.origin+(i==="/"?"":i)}}return window.location.origin}function Le(){return document.documentElement.classList.contains("dark")||localStorage.getItem("theme")==="dark"}function B(e){const o=document.createElement("div");return o.textContent=e,o.innerHTML}function ze(){if(document.getElementById("oe-guide-sdk-styles"))return;const e=Le(),o=e?"#1e293b":"#fff",n=e?"#334155":"#f3f4f6",i=e?"#f1f5f9":"#1f2937",s=e?"#94a3b8":"#6b7280",r=e?"#475569":"#e5e7eb",g=e?"#334155":"#fff",d=e?"#f1f5f9":"#1f2937",u=e?"#475569":"#e5e7eb",h=e?"#475569":"#eef2ff",b=e?"#1e293b":"#fff",x=document.createElement("style");x.id="oe-guide-sdk-styles",x.textContent=`
    #${I}{position:fixed;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    #${I} *{box-sizing:border-box}

    /* ── Bubble (bottom-right) ─────────────────── */
    .oeg-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(99,102,241,.4);transition:transform .2s,box-shadow .2s;z-index:99991}
    .oeg-bubble:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(99,102,241,.5)}
    .oeg-bubble svg{width:24px;height:24px;fill:#fff}
    .oeg-bubble.pulse{animation:oeg-pulse 2s ease-in-out infinite}
    @keyframes oeg-pulse{0%,100%{box-shadow:0 4px 20px rgba(99,102,241,.4)}50%{box-shadow:0 4px 30px rgba(99,102,241,.7)}}

    /* ── Proactive hint ────────────────────────── */
    .oeg-hint{position:fixed;bottom:92px;right:24px;background:${b};color:${i};padding:12px 16px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.15);font-size:14px;line-height:1.5;max-width:280px;animation:oeg-fadein .3s ease;cursor:pointer;border:1px solid ${r};z-index:99991}
    .oeg-hint::after{content:'';position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:${b};border-right:1px solid ${r};border-bottom:1px solid ${r};transform:rotate(45deg)}
    .oeg-hint-x{position:absolute;top:6px;right:10px;cursor:pointer;color:${s};font-size:18px;line-height:1}
    @keyframes oeg-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

    /* ── Welcome card (centered) ───────────────── */
    .oeg-welcome-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99995;animation:oeg-fadein .3s ease;backdrop-filter:blur(4px)}
    .oeg-welcome{background:${b};border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-width:480px;width:90%;overflow:hidden;animation:oeg-scalein .35s ease}
    @keyframes oeg-scalein{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
    .oeg-welcome-img{width:100%;height:200px;object-fit:cover;display:block;background:linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 50%,#a5b4fc 100%)}
    .oeg-welcome-body{padding:24px 28px}
    .oeg-welcome-body h2{margin:0 0 8px;font-size:22px;font-weight:700;color:${i}}
    .oeg-welcome-body p{margin:0 0 20px;font-size:15px;color:${s};line-height:1.6}
    .oeg-welcome-agent{display:flex;align-items:center;gap:10px;margin-bottom:20px}
    .oeg-welcome-avatar{width:36px;height:36px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;flex-shrink:0;overflow:hidden}
    .oeg-welcome-avatar img{width:100%;height:100%;object-fit:cover}
    .oeg-welcome-name{font-size:14px;font-weight:600;color:${i}}
    .oeg-welcome-role{font-size:12px;color:${s}}
    .oeg-welcome-actions{display:flex;gap:10px}
    .oeg-welcome-btn{flex:1;padding:12px;border-radius:12px;border:none;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s}
    .oeg-welcome-btn.primary{background:#6366f1;color:#fff}
    .oeg-welcome-btn.primary:hover{background:#4f46e5}
    .oeg-welcome-btn.secondary{background:${n};color:${i};border:1px solid ${r}}
    .oeg-welcome-btn.secondary:hover{background:${h}}
    .oeg-welcome-btn svg{width:18px;height:18px;fill:currentColor}
    .oeg-welcome-skip{display:block;margin:16px auto 0;background:none;border:none;color:${s};font-size:13px;cursor:pointer;padding:4px 8px}
    .oeg-welcome-skip:hover{color:${i}}

    /* ── Picker (call or chat) ─────────────────── */
    .oeg-picker{position:fixed;bottom:92px;right:24px;background:${b};border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:8px;display:flex;flex-direction:column;gap:4px;min-width:200px;animation:oeg-fadein .2s ease;z-index:99992;border:1px solid ${r}}
    .oeg-picker-btn{display:flex;align-items:center;gap:12px;padding:12px 16px;border:none;background:none;cursor:pointer;border-radius:12px;font-size:14px;color:${i};transition:background .15s;width:100%;text-align:left}
    .oeg-picker-btn:hover{background:${n}}
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
    .oeg-chat{position:fixed;bottom:92px;right:24px;width:380px;max-height:520px;background:${o};border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden;animation:oeg-fadein .25s ease;z-index:99992;border:1px solid ${r}}
    .oeg-chat-hd{padding:14px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;gap:10px}
    .oeg-chat-hd svg{width:20px;height:20px;fill:#fff;opacity:.8}
    .oeg-chat-hd h3{margin:0;font-size:15px;font-weight:600;flex:1}
    .oeg-chat-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.7);padding:4px}
    .oeg-chat-close:hover{color:#fff}
    .oeg-chat-close svg{width:18px;height:18px;fill:currentColor}
    .oeg-ms{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:180px;max-height:360px}
    .oeg-m{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word;animation:oeg-fadein .2s ease}
    .oeg-m.user{align-self:flex-end;background:#6366f1;color:#fff;border-bottom-right-radius:4px}
    .oeg-m.assistant{align-self:flex-start;background:${n};color:${i};border-bottom-left-radius:4px}
    .oeg-m.status{align-self:center;background:transparent;color:#6366f1;font-size:12px;font-weight:500;padding:2px 0}
    .oeg-tp{align-self:flex-start;padding:10px 14px;background:${n};border-radius:12px;display:flex;gap:4px}
    .oeg-tp span{width:5px;height:5px;background:#9ca3af;border-radius:50%;animation:oeg-bo 1.4s ease-in-out infinite}
    .oeg-tp span:nth-child(2){animation-delay:.2s}.oeg-tp span:nth-child(3){animation-delay:.4s}
    @keyframes oeg-bo{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    .oeg-sg{padding:6px 14px 2px;display:flex;flex-wrap:wrap;gap:5px}
    .oeg-ch{padding:5px 10px;border:1px solid ${u};border-radius:14px;background:${e?"#334155":"#fff"};font-size:12px;color:#6366f1;cursor:pointer;transition:all .15s}
    .oeg-ch:hover{background:${h};border-color:#6366f1}
    .oeg-ir{padding:10px 14px;border-top:1px solid ${r};display:flex;gap:6px}
    .oeg-in{flex:1;border:1px solid ${u};border-radius:10px;padding:9px 12px;font-size:14px;outline:none;transition:border-color .2s;background:${g};color:${d}}
    .oeg-in:focus{border-color:#6366f1}
    .oeg-in::placeholder{color:#9ca3af}
    .oeg-sb{width:38px;height:38px;border:none;background:#6366f1;color:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .oeg-sb:hover{background:#4f46e5}
    .oeg-sb svg{width:16px;height:16px;fill:currentColor}
    .oeg-cancel{display:flex;justify-content:center;padding:0 14px 6px}
    .oeg-cancel button{padding:5px 14px;border:1px solid #ef4444;border-radius:8px;background:transparent;color:#ef4444;font-size:12px;cursor:pointer}
    .oeg-cancel button:hover{background:#ef4444;color:#fff}

    @media(max-width:440px){.oeg-chat{width:calc(100vw - 16px);right:8px;bottom:80px}.oeg-welcome{width:95%}}
  `,document.head.appendChild(x)}const v={guide:'<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>',send:'<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',close:'<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',mic:'<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',micOff:'<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>',phone:'<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',phoneEnd:'<svg viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',chat:'<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>'};function l(){var r,g,d,u,h,b,x,P,k,H,ee,te,oe,ne,ie,se,ae,re;let e=document.getElementById(I);e||(e=document.createElement("div"),e.id=I,document.body.appendChild(e));const o=((r=t.user)==null?void 0:r.agentName)??"Guide",n=(g=t.user)!=null&&g.name?B(t.user.name):"";let i="";if(t.mode==="welcome"&&(i=`
      <div class="oeg-welcome-overlay" id="oeg-welcome-overlay">
        <div class="oeg-welcome">
          <div class="oeg-welcome-img"></div>
          <div class="oeg-welcome-body">
            <h2>Ready for a quick walkthrough?</h2>
            <p>I'll guide you through the platform step by step, and I can answer any questions you might have.</p>
            <div class="oeg-welcome-agent">
              <div class="oeg-welcome-avatar">${o[0]}</div>
              <div>
                <div class="oeg-welcome-name">${B(o)}</div>
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
      </div>`),t.mode==="picker"&&(i+=`
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
      </div>`),t.mode==="call"&&(i+=`
      <div class="oeg-call-pill">
        <button class="oeg-call-btn mic ${t.voiceActive?"":"muted"}" id="oeg-call-mic" title="${t.voiceActive?"Mute":"Unmute"}">
          ${t.voiceActive?v.mic:v.micOff}
        </button>
        <div class="oeg-call-status">
          ${t.voiceActive?'<div class="oeg-call-wave"><span></span><span></span><span></span><span></span><span></span></div>':'<span style="color:#9ca3af">Muted</span>'}
        </div>
        <button class="oeg-call-btn chat" id="oeg-call-chat" title="Open chat">${v.chat}</button>
        <button class="oeg-call-btn end" id="oeg-call-end" title="End call">${v.phoneEnd}</button>
      </div>`),t.mode==="chat"){const y=n?`Hi ${n}! I'm your OpenEvent Guide. How can I help?`:`Hi! I'm your OpenEvent Guide. Ask anything or say "show me".`,j=["Show me around","Create an event","Set up ticketing","Connect Stripe"];i+=`
      <div class="oeg-chat">
        <div class="oeg-chat-hd">
          ${v.guide}
          <h3>OpenEvent Guide</h3>
          <button class="oeg-chat-close" id="oeg-chat-close">${v.close}</button>
        </div>
        <div class="oeg-ms" id="oeg-ms">
          ${t.messages.length===0?`<div class="oeg-m assistant">${y}</div>`:""}
          ${t.messages.map(_=>`<div class="oeg-m ${_.role}">${B(_.content)}</div>`).join("")}
          ${t.typing?'<div class="oeg-tp"><span></span><span></span><span></span></div>':""}
        </div>
        ${t.messages.length===0?`<div class="oeg-sg">${j.map(_=>`<button class="oeg-ch">${_}</button>`).join("")}</div>`:""}
        ${t.running?'<div class="oeg-cancel"><button id="oeg-cancel">Stop guide</button></div>':""}
        <div class="oeg-ir">
          <input class="oeg-in" type="text" placeholder="Ask anything..." id="oeg-in" ${t.typing||t.running?"disabled":""} />
          <button class="oeg-sb" id="oeg-sd" ${t.typing||t.running?"disabled":""}>${v.send}</button>
        </div>
      </div>`}t.proactiveMsg&&t.mode==="hidden"&&(i+=`<div class="oeg-hint" id="oeg-hint"><span class="oeg-hint-x" id="oeg-hint-x">&times;</span>${B(t.proactiveMsg)}</div>`),t.mode!=="welcome"&&t.mode!=="call"&&(i+=`<button class="oeg-bubble ${t.proactiveMsg&&t.mode==="hidden"?"pulse":""}" id="oeg-tg">
      ${t.mode==="chat"||t.mode==="picker"?v.close:v.guide}
    </button>`),e.innerHTML=i;const s=document.getElementById("oeg-ms");s&&(s.scrollTop=s.scrollHeight),(d=document.getElementById("oeg-start-call"))==null||d.addEventListener("click",()=>O()),(u=document.getElementById("oeg-start-chat"))==null||u.addEventListener("click",()=>{t.mode="chat",l()}),(h=document.getElementById("oeg-skip"))==null||h.addEventListener("click",()=>{t.mode="hidden",localStorage.setItem("oe-guide-seen","1"),l()}),(b=document.getElementById("oeg-welcome-overlay"))==null||b.addEventListener("click",y=>{y.target.classList.contains("oeg-welcome-overlay")&&(t.mode="hidden",localStorage.setItem("oe-guide-seen","1"),l())}),(x=document.getElementById("oeg-tg"))==null||x.addEventListener("click",()=>{t.mode==="chat"||t.mode==="picker"?t.mode="hidden":(t.mode=t.voiceEnabled?"picker":"chat",t.proactiveMsg=null),l()}),(P=document.getElementById("oeg-pick-call"))==null||P.addEventListener("click",()=>O()),(k=document.getElementById("oeg-pick-chat"))==null||k.addEventListener("click",()=>{t.mode="chat",l()}),(H=document.getElementById("oeg-call-mic"))==null||H.addEventListener("click",Be),(ee=document.getElementById("oeg-call-chat"))==null||ee.addEventListener("click",()=>{t.mode="chat",l()}),(te=document.getElementById("oeg-call-end"))==null||te.addEventListener("click",X),(oe=document.getElementById("oeg-chat-close"))==null||oe.addEventListener("click",()=>{t.mode="hidden",l()}),(ne=document.getElementById("oeg-sd"))==null||ne.addEventListener("click",R),(ie=document.getElementById("oeg-in"))==null||ie.addEventListener("keydown",y=>{y.key==="Enter"&&!t.typing&&!t.running&&R()}),(se=document.getElementById("oeg-cancel"))==null||se.addEventListener("click",Me),e.querySelectorAll(".oeg-ch").forEach(y=>{y.addEventListener("click",()=>{const j=document.getElementById("oeg-in");j&&(j.value=y.textContent??"",R())})}),(ae=document.getElementById("oeg-hint"))==null||ae.addEventListener("click",()=>{t.mode="chat",t.proactiveMsg=null,l()}),(re=document.getElementById("oeg-hint-x"))==null||re.addEventListener("click",y=>{y.stopPropagation(),t.proactiveMsg=null,ye(),l()}),t.mode==="chat"&&setTimeout(()=>{var y;return(y=document.getElementById("oeg-in"))==null?void 0:y.focus()},200)}async function O(){var e;t.mode="call",l();try{await Te(t.serverUrl,t.sessionId,`You are the OpenEvent Guide. Help ${((e=t.user)==null?void 0:e.name)??"the user"} learn to use OpenEvent. Keep responses short (1-2 sentences). You can control their browser with tools. Be warm and conversational.`,{onToolCall:async o=>{await N(o)},onTranscript:(o,n)=>{t.messages.push({role:n==="user"?"user":"assistant",content:o})},onStateChange:o=>{t.voiceActive=o,l()}}),t.voiceActive=!0,localStorage.setItem("oe-guide-seen","1"),l()}catch{M("Could not start voice. Check microphone permissions."),t.mode="chat",l()}}function Be(){t.voiceActive?(G(),t.voiceActive=!1):O(),l()}function X(){G(),t.voiceActive=!1,t.mode="hidden",l()}async function Oe(e){t.running=!0,t.runningCancel=!1,l();const o=e.length;for(let n=0;n<e.length&&!t.runningCancel;n++){const i=e[n];o>2&&pe(n+1,o),i.type==="navigate"&&"path"in i?M(`Navigating to ${i.path}...`):"subtitle"in i&&i.subtitle&&M(i.subtitle),await N(i),await new Promise(s=>setTimeout(s,500))}W(),T(),A(),t.running=!1,M(t.runningCancel?"Guide stopped.":"Done! Ask me anything else."),l()}function Me(){t.runningCancel=!0,T(),A(),W()}function M(e){t.messages.push({role:"status",content:e}),l()}let Pe=0;function He(e,o){return window.__oeGuideExtProxy?new Promise((i,s)=>{const r="oeg-"+ ++Pe,g=d=>{var u,h,b,x;((u=d.data)==null?void 0:u.source)!=="oeg-ext"||((h=d.data)==null?void 0:h.reqId)!==r||(window.removeEventListener("message",g),(b=d.data.response)!=null&&b.ok?i(d.data.response.data):s(new Error(((x=d.data.response)==null?void 0:x.error)??"Extension proxy failed")))};window.addEventListener("message",g),window.postMessage({source:"oeg-sdk",type:"api-request",reqId:r,url:e,options:{method:o.method,headers:o.headers,body:o.body}},"*"),setTimeout(()=>{window.removeEventListener("message",g),s(new Error("Request timed out"))},3e4)}):fetch(e,o).then(i=>{if(!i.ok)throw new Error(`${i.status}`);return i.json()})}async function R(){var n;const e=document.getElementById("oeg-in");if(!(e!=null&&e.value.trim())||t.typing||t.running)return;const o=e.value.trim();e.value="",t.messages.push({role:"user",content:o}),t.typing=!0,l();try{const i=await He(`${t.serverUrl}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:t.sessionId,message:o,user:t.user})});t.messages.push({role:"assistant",content:i.reply}),t.typing=!1,l(),(n=i.commands)!=null&&n.length&&await Oe(i.commands)}catch(i){t.typing=!1,console.error("[oe-guide] Chat failed:",i),t.messages.push({role:"assistant",content:"Connection issue. Please try again."}),l()}}function je(e){t.mode==="chat"?(t.messages.push({role:"assistant",content:e}),l()):t.mode==="hidden"&&(t.proactiveMsg=e,l())}function Q(e){t.booted||(t.booted=!0,t.user=e,t.serverUrl=e.server??Ce(),t.voiceEnabled=!e.disableVoice,t.firstVisit=!localStorage.getItem("oe-guide-seen"),le(),ze(),t.mode=t.firstVisit?"welcome":"hidden",l(),e.disableTriggers||we(je),console.log("[OpenEvent Guide] Ready",t.serverUrl))}function Z(){var e,o;t.booted=!1,t.mode="hidden",t.messages=[],ke(),Se()&&G(),ge(),(e=document.getElementById(I))==null||e.remove(),(o=document.getElementById("oe-guide-sdk-styles"))==null||o.remove()}const _e={boot:Q,shutdown:Z,open:()=>{t.mode=t.voiceEnabled?"picker":"chat",l()},close:()=>{t.mode="hidden",l()},startCall:O,endCall:X};return window.OpenEventGuide=_e,S.boot=Q,S.shutdown=Z,Object.defineProperty(S,Symbol.toStringTag,{value:"Module"}),S})({});
