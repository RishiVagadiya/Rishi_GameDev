/**
 * =============================================================================
 * RISHI VAGADIYA — VOX-STYLE EXPLAINER ENGINE (vox.js)
 * Smooth-gliding RAF loop, Camera Keyframing & Analog Texture Boil
 * =============================================================================
 */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // Check reduced motion preference
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Audio synthesizer state
  let audioEnabled = localStorage.getItem('rv_audio') === 'true';
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playBlip(freq = 600, duration = 0.03) {
    if (!audioEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  /* =============================================================================
     SCROLL ENGINE & CAMERA INTERPOLATION
     ============================================================================= */
  function initVoxEngine() {
    const voxRoot = document.querySelector('.vox-wrapper');
    if (!voxRoot || isReducedMotion) return;

    const beats = [...voxRoot.querySelectorAll('[data-beat]')].map(node => ({
      node,
      p: -1
    }));

    const cams = [...voxRoot.querySelectorAll('[data-cam]')].map(node => ({
      node,
      beat: beats.find(b => b.node === node.closest('[data-beat]')),
      keys: JSON.parse(node.dataset.cam || '[]'),
      p: -1,
      pan: node.hasAttribute('data-pan')
    }));

    const turbulence = document.querySelector('#vox-boil feTurbulence');
    let camMult = window.innerWidth < 760 ? 0.35 : 1;

    function handleResize() {
      camMult = window.innerWidth < 760 ? 0.35 : 1;
      cams.forEach(c => c.p = -1);
    }
    window.addEventListener('resize', handleResize);

    function interpolateCam(keys, p, mult = 1) {
      if (!keys || keys.length === 0) return '';
      let s = keys[0], t = keys[keys.length - 1];
      for (let i = 0; i < keys.length - 1; i++) {
        if (p >= keys[i][0] && p <= keys[i + 1][0]) {
          s = keys[i];
          t = keys[i + 1];
          break;
        }
      }
      if (p <= keys[0][0]) { s = t = keys[0]; }
      if (p >= keys[keys.length - 1][0]) { s = t = keys[keys.length - 1]; }

      const d = (t[0] === s[0]) ? 1 : (p - s[0]) / (t[0] - s[0]);
      const o = d * d * (3 - 2 * d); // Smoothstep easing
      const interp = idx => s[idx] + (t[idx] - s[idx]) * o;

      const x = interp(1) * mult;
      const y = interp(2) * mult;
      const scale = 1 + (interp(3) - 1) * mult;
      const rot = interp(4) * mult;

      return `translate(${x.toFixed(3)}%, ${y.toFixed(3)}%) scale(${scale.toFixed(4)}) rotate(${rot.toFixed(3)}deg)`;
    }

    let rafId = 0;
    let lastTime = performance.now();
    let lastTexture = -1000;
    let frame = 0;

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Glide factor: follow = 1 - exp(-9 * dt)
      const follow = 1 - Math.exp(-9 * dt);
      const vh = window.innerHeight;

      // 1. Measure and update --p on each beat
      for (const beat of beats) {
        const rect = beat.node.getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > 2 * vh) continue;

        const totalScroll = rect.height - vh;
        const target = Math.min(1, Math.max(0, totalScroll > 0 ? -rect.top / totalScroll : 1 - rect.top / vh));
        const newP = (beat.p < 0 || Math.abs(target - beat.p) < 0.0004) ? target : beat.p + (target - beat.p) * follow;

        if (newP !== beat.p) {
          beat.p = newP;
          beat.node.style.setProperty('--p', newP.toFixed(4));
        }
      }

      // 2. Interpolate camera keyframes
      for (const cam of cams) {
        if (!cam.beat || cam.beat.p < 0) continue;
        if (cam.p === cam.beat.p) continue;
        cam.p = cam.beat.p;
        cam.node.style.transform = interpolateCam(cam.keys, cam.p, cam.pan ? 1 : camMult);
      }

      // 3. Step texture on twos (12 fps = every ~83ms)
      if (now - lastTexture >= 81.33) {
        lastTexture = now;
        frame++;
        if (frame % 2 === 0 && turbulence) {
          turbulence.setAttribute('seed', String(frame % 7));
        }
        voxRoot.style.setProperty('--grain-x', `${(37 * frame) % 240}px`);
        voxRoot.style.setProperty('--grain-y', `${(91 * frame) % 240}px`);
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  /* =============================================================================
     INTERACTIVE MODALS & RECRUITER DOSSIER
     ============================================================================= */
  function initModals() {
    const dossierModal = document.getElementById('modal-dossier');
    const lightboxModal = document.getElementById('modal-lightbox');
    const chatModal = document.getElementById('modal-chat');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCap = document.getElementById('lightbox-cap');

    // Open Dossier
    document.querySelectorAll('[data-open-dossier]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        playBlip(720);
        if (dossierModal) dossierModal.classList.add('is-open');
      });
    });

    // Open AI Chat
    document.querySelectorAll('[data-open-chat]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        playBlip(800);
        if (chatModal) {
          chatModal.classList.add('is-open');
          const input = chatModal.querySelector('#chat-user-input');
          if (input) setTimeout(() => input.focus(), 150);
        }
      });
    });

    // Lightbox for screenshots
    document.querySelectorAll('[data-lightbox-src]').forEach(el => {
      el.addEventListener('click', () => {
        const src = el.getAttribute('data-lightbox-src');
        const cap = el.getAttribute('data-lightbox-caption') || '';
        if (src && lightboxImg && lightboxModal) {
          playBlip(640);
          lightboxImg.src = src;
          if (lightboxCap) lightboxCap.textContent = cap;
          lightboxModal.classList.add('is-open');
        }
      });
    });

    // Close buttons
    document.querySelectorAll('.vox-modal-close, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        playBlip(480);
        document.querySelectorAll('.vox-modal-backdrop').forEach(m => m.classList.remove('is-open'));
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.vox-modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('is-open');
        }
      });
    });

    // ESC key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.vox-modal-backdrop').forEach(m => m.classList.remove('is-open'));
      }
    });

    // Copy contact info button
    const copyBtn = document.getElementById('btn-copy-contact');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        playBlip(880);
        const text = 'Rishi Vagadiya | Senior Unity Game Developer & AI Engineer\nEmail: rishivagadiya@gmail.com\nWhatsApp: +91 6352294215\nPortfolio: https://rishivagadiya.github.io/Rishi_GameDev/';
        navigator.clipboard.writeText(text).then(() => {
          const orig = copyBtn.textContent;
          copyBtn.textContent = '✓ COPIED TO CLIPBOARD';
          setTimeout(() => copyBtn.textContent = orig, 2000);
        });
      });
    }

    // Audio toggle button
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        localStorage.setItem('rv_audio', audioEnabled ? 'true' : 'false');
        audioBtn.classList.toggle('is-muted', !audioEnabled);
        audioBtn.title = audioEnabled ? 'Mute Studio Audio' : 'Enable Studio Audio';
        if (audioEnabled) playBlip(750);
      });
    }
  }

  /* =============================================================================
     NEXUS AI CLIENT-SIDE CHAT ENGINE
     ============================================================================= */
  function initAiChat() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-user-input');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatForm || !chatInput || !chatMessages) return;

    const KNOWLEDGE_BASE = [
      {
        triggers: ['why hire', 'hire rishi', 'experience', 'background', 'role'],
        response: "Rishi Vagadiya is a Senior Unity Game Developer & Applied AI Engineer with 2 live published Google Play games (CrowdWar, Car Parking) and deep experience training custom deep learning models. He specializes in GPU mesh instancing, custom raycast vehicle physics, mobile 60 FPS optimization, and LoRA/Unsloth fine-tuning of open-source LLMs."
      },
      {
        triggers: ['crowdwar', 'crowd', '150+', 'gpu instancing', 'runner'],
        response: "CrowdWar: Crowd Runner 3D achieves a flat 60 FPS with 150+ active crowd agents by using GPU mesh instancing and unified material draws. Rishi bypassed heavy GameObject overhead with compute buffers, spatial hash collision detection, and custom LOD culling."
      },
      {
        triggers: ['car parking', 'physics', 'wheelcollider', 'raycast', 'handling'],
        response: "Car Parking: Real Drive 3D avoids the common glitches of Unity's default WheelCollider by using a custom mathematical 4-raycast suspension model. It implements Ackermann steering geometry, non-linear tire friction curves (Pacejka model), and first-person cockpit camera stabilization."
      },
      {
        triggers: ['loss', 'training', 'nexus ai', 'lora', 'unsloth', 'llama'],
        response: "Nexus AI is a fine-tuned LLaMA-3.2-1B-Instruct model trained on custom C# Unity and game development instruction datasets. Using LoRA (Rank 16, Alpha 32) and Unsloth 4-bit QLoRA, training loss plunged from 1.4820 down to 0.4140 (-72.1% drop) with a verified 94.8% domain knowledge accuracy score."
      },
      {
        triggers: ['contact', 'email', 'phone', 'whatsapp', 'reach'],
        response: "You can reach Rishi directly via WhatsApp at +91 6352294215, email him at rishivagadiya@gmail.com, or check out his code at github.com/RishiVagadiya. He is available for immediate hire!"
      }
    ];

    function appendMessage(sender, text) {
      const msg = document.createElement('div');
      msg.className = `vox-chat-bubble ${sender === 'user' ? 'bubble-user' : 'bubble-ai'}`;
      msg.innerHTML = `<strong>${sender === 'user' ? 'YOU' : 'NEXUS AI'}</strong><p>${text}</p>`;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = chatInput.value.trim();
      if (!query) return;

      appendMessage('user', query);
      chatInput.value = '';
      playBlip(540);

      // Typing simulation
      setTimeout(() => {
        const lower = query.toLowerCase();
        let match = KNOWLEDGE_BASE.find(k => k.triggers.some(t => lower.includes(t)));
        const reply = match ? match.response : "Rishi Vagadiya is a Senior Unity 3D Developer & Applied AI Engineer who built CrowdWar and Car Parking on Google Play, and fine-tuned Nexus AI (LLaMA-3.2-1B) with -72.1% loss reduction. Ask me about his game physics, 60 FPS optimization, or training metrics!";
        appendMessage('ai', reply);
        playBlip(780);
      }, 350);
    });

    // Quick prompt buttons
    document.querySelectorAll('.chat-quick-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        chatInput.value = tag.textContent.replace(/^"|"$/g, '');
        chatForm.dispatchEvent(new Event('submit'));
      });
    });
  }

  // Audio blips on hover for interactive links
  function initHoverEffects() {
    document.querySelectorAll('a, button, .headline-strip, .panel-clip img').forEach(el => {
      el.addEventListener('mouseenter', () => playBlip(500, 0.015));
    });
  }

  // Initialize all components when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initVoxEngine();
      initModals();
      initAiChat();
      initHoverEffects();
    });
  } else {
    initVoxEngine();
    initModals();
    initAiChat();
    initHoverEffects();
  }
})();
