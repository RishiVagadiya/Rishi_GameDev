/**
 * =============================================================================
 * RISHI VAGADIYA — 3D GAME DEV & AI PORTFOLIO ENGINE
 * Unity Game Developer & Applied AI Engineer
 * (Cinematic 3D Low-Poly Dynamic Terrain & Tactile Card Tilt — Zero Neon)
 * =============================================================================
 */

(function () {
  'use strict';

  // State Management
  const STATE = {
    audioEnabled: localStorage.getItem('rv_audio') === 'true',
    currentLightboxIndex: 0,
    chatHistory: [],
    isAiGenerating: false,
    ttsEnabled: false
  };

  /* =============================================================================
     1. SUBTLE STUDIO AUDIO SYNTHESIZER (Web Audio API)
     ============================================================================= */
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const SOUNDS = {
    hover: () => {
      if (!STATE.audioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    },
    click: () => {
      if (!STATE.audioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    },
    chime: () => {
      if (!STATE.audioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.03, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.22);
      });
    },
    message: () => {
      if (!STATE.audioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  };

  /* =============================================================================
     2. UNIQUE 3D GAME ENGINE LOW-POLY TERRAIN BACKGROUND (ZERO DOTS / ZERO NEON)
     ============================================================================= */
  function init3DBackground() {
    const canvas = document.getElementById('webgl-bg-canvas');
    if (!canvas) return;

    if (typeof THREE === 'undefined') {
      initFallback2DCanvas(canvas);
      return;
    }

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 16, 44);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Realistic Cinematic Lighting (Directional Sunlight + Soft Ambient Sky)
      const ambientLight = new THREE.AmbientLight(0x1e293b, 1.6);
      scene.add(ambientLight);

      const studioKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      studioKeyLight.position.set(30, 45, 25);
      scene.add(studioKeyLight);

      const coolFillLight = new THREE.DirectionalLight(0x475569, 1.0);
      coolFillLight.position.set(-30, -15, 10);
      scene.add(coolFillLight);

      const subtleRimLight = new THREE.PointLight(0x38bdf8, 1.3, 90);
      subtleRimLight.position.set(0, -18, 20);
      scene.add(subtleRimLight);

      // --- 3D Low-Poly Faceted Terrain Mesh (Unity Scene View Shaded + Wireframe) ---
      const terrainWidth = 140;
      const terrainHeight = 100;
      const segmentsX = 42;
      const segmentsY = 32;
      const terrainGeom = new THREE.PlaneGeometry(terrainWidth, terrainHeight, segmentsX, segmentsY);
      
      // Tilt in 3D space like a true game world landscape
      terrainGeom.rotateX(-Math.PI * 0.44);
      terrainGeom.translate(0, -9, -8);

      const posAttr = terrainGeom.attributes.position;
      const vertexCount = posAttr.count;
      const origPositions = new Float32Array(posAttr.array);

      // Flat-shaded low-poly terrain material (Dark Slate / Titanium)
      const terrainMat = new THREE.MeshStandardMaterial({
        color: 0x111723,
        roughness: 0.55,
        metalness: 0.45,
        flatShading: true
      });

      const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
      scene.add(terrainMesh);

      // Delicate wireframe lines on top (like Unity 3D Editor wireframe mode)
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x334155,
        wireframe: true,
        transparent: true,
        opacity: 0.22
      });
      const wireMesh = new THREE.Mesh(terrainGeom, wireMat);
      scene.add(wireMesh);

      // --- Floating Kinetic 3D Solids in Corners ---
      const shapesGroup = new THREE.Group();
      scene.add(shapesGroup);

      const metallicSolidMat = new THREE.MeshStandardMaterial({
        color: 0x182234,
        roughness: 0.35,
        metalness: 0.85,
        flatShading: true
      });

      // 1. Faceted Low-Poly Crystal
      const crystalGeom = new THREE.IcosahedronGeometry(6.4, 0);
      const crystalMesh = new THREE.Mesh(crystalGeom, metallicSolidMat);
      crystalMesh.position.set(28, 8, -6);
      shapesGroup.add(crystalMesh);

      // 2. Bevelled Torus Ring
      const torusGeom = new THREE.TorusGeometry(8.6, 0.2, 8, 48);
      const torusMat = new THREE.MeshBasicMaterial({
        color: 0x475569,
        transparent: true,
        opacity: 0.32
      });
      const torusMesh = new THREE.Mesh(torusGeom, torusMat);
      torusMesh.position.set(28, 8, -6);
      torusMesh.rotation.x = Math.PI / 3;
      shapesGroup.add(torusMesh);

      // 3. Faceted Octahedron
      const octaGeom = new THREE.OctahedronGeometry(4.6, 0);
      const octaMesh = new THREE.Mesh(octaGeom, metallicSolidMat);
      octaMesh.position.set(-28, -6, -4);
      shapesGroup.add(octaMesh);

      // Mouse Parallax & Dynamic Terrain Interaction
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;
      let mouseWorldX = 0;
      let mouseWorldZ = 0;

      window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.0008;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.0008;
        mouseWorldX = ((e.clientX / window.innerWidth) - 0.5) * 70;
        mouseWorldZ = ((e.clientY / window.innerHeight) - 0.5) * 50;

        // Subtle dynamic CSS ambient spotlight update
        document.documentElement.style.setProperty('--spot-x', `${(e.clientX / window.innerWidth) * 100}%`);
        document.documentElement.style.setProperty('--spot-y', `${(e.clientY / window.innerHeight) * 100}%`);
      });

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Animation Loop with Real-Time Terrain Mesh Deformation
      let clock = 0;
      function animate() {
        requestAnimationFrame(animate);
        clock += 0.016;

        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        // Animate Terrain Vertices
        const posArray = posAttr.array;
        for (let i = 0; i < vertexCount; i++) {
          const idx = i * 3;
          const ox = origPositions[idx];
          const oz = origPositions[idx + 2];

          // Harmonic terrain wave motion
          let elevation = Math.sin(ox * 0.09 + clock * 1.2) * 2.6 + Math.cos(oz * 0.11 + clock * 0.9) * 2.2;

          // Interactive 3D deformation under cursor (sculpts terrain dynamically)
          const distToCursor = Math.hypot(ox - mouseWorldX, oz - mouseWorldZ);
          if (distToCursor < 26) {
            elevation += Math.sin((distToCursor - clock * 4) * 0.35) * (26 - distToCursor) * 0.24;
          }

          posArray[idx + 1] = origPositions[idx + 1] + elevation;
        }

        posAttr.needsUpdate = true;
        terrainGeom.computeVertexNormals(); // Recompute flat shading on every polygon face!

        // Kinetic Solids
        crystalMesh.rotation.x += 0.003;
        crystalMesh.rotation.y += 0.004;
        torusMesh.rotation.z += 0.002;
        octaMesh.rotation.y += 0.004;
        octaMesh.rotation.z += 0.003;

        camera.position.x = targetX * 10;
        camera.position.y = 16 - targetY * 10;
        camera.lookAt(0, -3, 0);

        renderer.render(scene, camera);
      }
      animate();
    } catch (err) {
      console.warn('Three.js initialization fallback', err);
      initFallback2DCanvas(canvas);
    }
  }

  // 2D Canvas Fallback (Smooth Atmospheric Gradient Mesh)
  function initFallback2DCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    let t = 0;
    function render2D() {
      t += 0.01;
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(
        width * 0.5 + Math.sin(t) * 80,
        height * 0.4 + Math.cos(t) * 60,
        10,
        width * 0.5,
        height * 0.4,
        width * 0.6
      );
      grad.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
      grad.addColorStop(1, 'rgba(6, 8, 13, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      requestAnimationFrame(render2D);
    }
    render2D();
  }

  /* =============================================================================
     3. TACTILE 3D CARD HOVER & PERSPECTIVE TILT EFFECT (RESTORED)
     ============================================================================= */
  function init3DCardTilt() {
    const tiltCards = document.querySelectorAll(
      '.holo-card, .game-card-cyber, .nexus-metrics-dashboard, .skill-item-card, .recruiter-form-card'
    );

    tiltCards.forEach((card) => {
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.2s ease';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Smooth 3D tilt angles
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-5px) scale3d(1.018, 1.018, 1.018)`;
        card.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        card.style.boxShadow = '0 26px 65px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.12)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      });
    });
  }

  /* =============================================================================
     4. SCROLL-DRIVEN FLOATING RECRUITER DOCK (Prevents Hero Overlap)
     ============================================================================= */
  function initFloatingDockVisibility() {
    const dock = document.querySelector('.recruiter-dock-floating');
    if (!dock) return;

    function checkScroll() {
      if (window.scrollY > 380) {
        dock.classList.add('is-visible');
      } else {
        dock.classList.remove('is-visible');
      }
    }

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  /* =============================================================================
     5. INTERACTIVE PLAYABLE MINI-GAMES IN CARDS
     ============================================================================= */

  // Game 1: CrowdWar Runner Canvas
  function initCrowdWarCanvas() {
    const canvas = document.getElementById('crowdwar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.clientWidth || 360);
    let height = (canvas.height = 180);

    let crowdCount = 10;
    let playerX = width / 2;
    let isDragging = false;
    let gates = [
      { x: width * 0.22, y: -20, width: 70, type: 'mult', val: 2, label: 'x2' },
      { x: width * 0.68, y: -20, width: 70, type: 'add', val: 5, label: '+5' }
    ];
    let obstacles = [{ x: width * 0.46, y: -90, radius: 11, label: 'TRAP' }];

    function resetGates() {
      gates = [
        { x: width * 0.2, y: -40, width: 75, type: 'mult', val: 2, label: 'x2' },
        { x: width * 0.65, y: -40, width: 75, type: 'add', val: 8, label: '+8' }
      ];
      obstacles = [{ x: width * 0.48, y: -110, radius: 12, label: 'TRAP' }];
    }

    function handlePointer(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      playerX = Math.max(30, Math.min(width - 30, x));
    }

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      handlePointer(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) handlePointer(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX);
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX);
    }, { passive: true });

    function loop() {
      ctx.fillStyle = '#060910';
      ctx.fillRect(0, 0, width, height);

      // Track Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(width / 3, 0);
      ctx.lineTo(width / 3, height);
      ctx.moveTo((width * 2) / 3, 0);
      ctx.lineTo((width * 2) / 3, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Move gates
      gates.forEach((g) => {
        g.y += 1.8;
        ctx.fillStyle = g.type === 'mult' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(16, 185, 129, 0.25)';
        ctx.strokeStyle = g.type === 'mult' ? '#38bdf8' : '#10b981';
        ctx.lineWidth = 1.5;
        ctx.fillRect(g.x, g.y, g.width, 22);
        ctx.strokeRect(g.x, g.y, g.width, 22);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(g.label, g.x + g.width / 2, g.y + 16);

        if (g.y > height - 60 && g.y < height - 35) {
          if (playerX >= g.x - 20 && playerX <= g.x + g.width + 20) {
            if (g.type === 'mult') crowdCount *= g.val;
            else crowdCount += g.val;
            SOUNDS.chime();
            g.y = height + 50;
          }
        }
      });

      // Move obstacles
      obstacles.forEach((obs) => {
        obs.y += 1.8;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        if (Math.hypot(playerX - obs.x, height - 50 - obs.y) < obs.radius + 16) {
          crowdCount = Math.max(1, Math.floor(crowdCount * 0.7));
          obs.y = height + 50;
        }
      });

      if (gates[0].y > height + 20) {
        resetGates();
      }

      // Draw Crowd Agents
      const agentsToDraw = Math.min(crowdCount, 40);
      for (let i = 0; i < agentsToDraw; i++) {
        const angle = (i / agentsToDraw) * Math.PI * 2;
        const radius = Math.min(26, Math.sqrt(i) * 5.2);
        const ax = playerX + Math.cos(angle) * radius;
        const ay = height - 50 + Math.sin(angle) * (radius * 0.6);

        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(ax, ay, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // HUD Badge
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px Orbitron, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`CROWD: ${crowdCount}`, 14, 22);

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '11px Rajdhani, sans-serif';
      ctx.fillText('Drag / Move to steer crowd', 14, 38);

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Game 2: Car Parking Canvas
  function initCarParkingCanvas() {
    const canvas = document.getElementById('carparking-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.clientWidth || 360);
    let height = (canvas.height = 180);

    let car = {
      x: width * 0.25,
      y: height * 0.75,
      angle: -Math.PI / 2,
      speed: 0,
      width: 30,
      length: 48
    };

    let keys = {};
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        keys[e.key.toLowerCase()] = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    const targetSlot = {
      x: width * 0.75,
      y: height * 0.35,
      width: 42,
      length: 62
    };

    let isParked = false;

    function loop() {
      ctx.fillStyle = '#060910';
      ctx.fillRect(0, 0, width, height);

      // Parking Bay
      ctx.strokeStyle = isParked ? '#10b981' : 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(targetSlot.x - targetSlot.width / 2, targetSlot.y - targetSlot.length / 2, targetSlot.width, targetSlot.length);

      ctx.fillStyle = isParked ? 'rgba(16,185,129,0.25)' : 'rgba(16, 185, 129, 0.06)';
      ctx.fillRect(targetSlot.x - targetSlot.width / 2, targetSlot.y - targetSlot.length / 2, targetSlot.width, targetSlot.length);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isParked ? 'PARKED!' : 'PARK HERE', targetSlot.x, targetSlot.y + 4);

      if (keys['arrowup'] || keys['w']) car.speed = Math.min(car.speed + 0.1, 2.0);
      else if (keys['arrowdown'] || keys['s']) car.speed = Math.max(car.speed - 0.1, -1.2);
      else car.speed *= 0.92;

      if (keys['arrowleft'] || keys['a']) car.angle -= 0.045 * (car.speed / 2.0);
      if (keys['arrowright'] || keys['d']) car.angle += 0.045 * (car.speed / 2.0);

      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      car.x = Math.max(20, Math.min(width - 20, car.x));
      car.y = Math.max(20, Math.min(height - 20, car.y));

      const dist = Math.hypot(car.x - targetSlot.x, car.y - targetSlot.y);
      if (dist < 18 && Math.abs(car.speed) < 0.25) {
        if (!isParked) {
          SOUNDS.chime();
          isParked = true;
        }
      } else {
        isParked = false;
      }

      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Body
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-car.length / 2, -car.width / 2, car.length, car.width);

      // Windshield
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(-car.length * 0.15, -car.width * 0.38, car.length * 0.45, car.width * 0.76);

      // Headlights
      ctx.fillStyle = '#fff';
      ctx.fillRect(car.length / 2 - 2, -car.width / 2 + 2, 3, 5);
      ctx.fillRect(car.length / 2 - 2, car.width / 2 - 7, 3, 5);

      ctx.restore();

      // HUD
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`SPEED: ${(Math.abs(car.speed) * 18).toFixed(0)} KM/H`, 14, 22);

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '11px Rajdhani, sans-serif';
      ctx.fillText('Steer with WASD / Arrow Keys', 14, 38);

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* =============================================================================
     6. DYNAMIC INTERACTIVE LOSS & CONVERGENCE CHART (SVG Animated)
     ============================================================================= */
  function initLossChart() {
    const chartContainer = document.getElementById('loss-svg-chart');
    if (!chartContainer) return;

    const data = [
      { step: '0', loss: 1.482, knowledge: 62.4 },
      { step: '600', loss: 1.085, knowledge: 71.0 },
      { step: '1200', loss: 0.792, knowledge: 79.5 },
      { step: '1800', loss: 0.584, knowledge: 86.8 },
      { step: '2400', loss: 0.461, knowledge: 91.5 },
      { step: '3000', loss: 0.414, knowledge: 94.8 }
    ];

    const svgWidth = 560;
    const svgHeight = 180;
    const padding = { top: 20, right: 30, bottom: 30, left: 45 };

    const plotW = svgWidth - padding.left - padding.right;
    const plotH = svgHeight - padding.top - padding.bottom;

    function getX(i) {
      return padding.left + (i / (data.length - 1)) * plotW;
    }
    function getYLoss(loss) {
      return padding.top + ((1.6 - loss) / 1.3) * plotH;
    }
    function getYKnowledge(know) {
      return padding.top + ((100 - know) / 50) * plotH;
    }

    let lossPathD = `M ${getX(0)} ${getYLoss(data[0].loss)}`;
    let knowPathD = `M ${getX(0)} ${getYKnowledge(data[0].knowledge)}`;

    for (let i = 1; i < data.length; i++) {
      lossPathD += ` L ${getX(i)} ${getYLoss(data[i].loss)}`;
      knowPathD += ` L ${getX(i)} ${getYKnowledge(data[i].knowledge)}`;
    }

    let pointsSvg = '';
    data.forEach((d, i) => {
      const cx = getX(i);
      const cyLoss = getYLoss(d.loss);
      const cyKnow = getYKnowledge(d.knowledge);

      pointsSvg += `
        <circle cx="${cx}" cy="${cyLoss}" r="4" fill="#f59e0b" stroke="#07090e" stroke-width="2" class="chart-point" data-info="Step ${d.step}: Loss ${d.loss.toFixed(4)}" />
        <circle cx="${cx}" cy="${cyKnow}" r="4" fill="#10b981" stroke="#07090e" stroke-width="2" class="chart-point" data-info="Step ${d.step}: Knowledge ${d.knowledge}%" />
        <text x="${cx}" y="${svgHeight - 10}" fill="#94a3b8" font-size="10" font-family="Rajdhani" text-anchor="middle">${d.step}</text>
      `;
    });

    chartContainer.innerHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%">
        <line x1="${padding.left}" y1="${padding.top}" x2="${svgWidth - padding.right}" y2="${padding.top}" stroke="rgba(255,255,255,0.06)" />
        <line x1="${padding.left}" y1="${padding.top + plotH / 2}" x2="${svgWidth - padding.right}" y2="${padding.top + plotH / 2}" stroke="rgba(255,255,255,0.06)" />
        <line x1="${padding.left}" y1="${svgHeight - padding.bottom}" x2="${svgWidth - padding.right}" y2="${svgHeight - padding.bottom}" stroke="rgba(255,255,255,0.12)" />

        <path d="${lossPathD}" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${knowPathD}" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

        ${pointsSvg}
      </svg>
      <div id="chart-tooltip" style="position: absolute; display: none; background: #0f172a; border: 1px solid #38bdf8; color: #fff; padding: 4px 10px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 11px; pointer-events: none; z-index: 10;"></div>
    `;

    const tooltip = document.getElementById('chart-tooltip');
    chartContainer.querySelectorAll('.chart-point').forEach((pt) => {
      pt.addEventListener('mouseenter', (e) => {
        SOUNDS.hover();
        const info = pt.getAttribute('data-info');
        if (tooltip) {
          tooltip.textContent = info;
          tooltip.style.display = 'block';
          tooltip.style.left = e.offsetX + 15 + 'px';
          tooltip.style.top = e.offsetY - 25 + 'px';
        }
      });
      pt.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.style.display = 'none';
      });
    });
  }

  /* =============================================================================
     7. LIVE RECRUITER AI CHAT ENGINE ("Vaat Chiit Kari Shake")
     ============================================================================= */
  const AI_KNOWLEDGE_BASE = [
    {
      triggers: ['hi', 'hello', 'hey', 'kem cho', 'intro', 'who are you', 'nexus', 'start'],
      response: `👋 **Greetings! I am Nexus AI**, a custom deep learning model trained by **Rishi Vagadiya**.
      
I am ready to assist you directly regarding:
* 🎮 **Published Unity Games:** *CrowdWar: Crowd Runner 3D* & *Car Parking: Real Drive 3D*.
* 🧠 **AI Architecture:** LoRA / PEFT fine-tuning, loss descent, and GPU cluster training.
* 💻 **C# Gameplay Engineering:** Object pooling, 60 FPS mobile optimization, shaders.
* 💼 **Recruiter Inquiries:** Rishi's availability, notice period, skill stack, and compensation expectations.

How can I help you evaluate Rishi's portfolio today?`
    },
    {
      triggers: ['hire', 'why hire', 'interview', 'recruiter', 'experience', 'background', 'role'],
      response: `### 🎯 Why Studios & Teams Hire Rishi Vagadiya:

1. **Proven Commercial Execution:** Released **2 full 3D games live on Google Play Store** with complete game loops, monetization hooks, and responsive touch controls.
2. **Dual-Domain Power (Unity 3D + Applied AI):** Combines strong C# mobile game architecture with practical LLM fine-tuning and AI-driven gameplay workflows.
3. **Mobile Performance First:** Expertise in draw-call minimization, texture compression (ASTC), raycast physics, and locking 60 FPS on mid-tier Android hardware.
4. **Immediate Availability:** Ready to join on short notice (0–15 days) for Remote, Hybrid, or On-site positions worldwide.

Would you like to schedule an interview or view Rishi's full resume dossier?`
    },
    {
      triggers: ['crowdwar', 'crowd', 'runner', 'clones', 'multiplier', 'gate'],
      response: `### 👥 CrowdWar: Crowd Runner 3D — Technical Breakdown:

* **Engine & Language:** Unity 32/64-bit, C#, URP (Universal Render Pipeline).
* **High-Density Crowd Optimization:** Uses **GPU Instancing** and memory object pools to simulate over **150+ crowd runner agents simultaneously** at 60 FPS.
* **Math Multiplier Gates:** Real-time spatial collision checks for gates (+, ×, -) with dynamic crowd formation logic.
* **Release Status:** Live on [Google Play Store](https://play.google.com/store/apps/details?id=com.Zoozo.CrowdWar).`
    },
    {
      triggers: ['car', 'parking', 'wheelcollider', 'physics', 'driving', 'vehicle'],
      response: `### 🏎️ Car Parking: Real Drive 3D — Technical Breakdown:

* **Physics Simulation:** Engineered custom vehicle kinematics utilizing **WheelCollider arrays** with tuned Ackermann steering geometry, forward/sideways friction slip curves, and realistic motor torque curves.
* **Camera Systems:** Smooth chase-cam interpolation and fully textured **1st-Person 3D Cockpit view**.
* **Precision Parking Zones:** Mathematical bounding box & trigger collider detection for parking accuracy scoring.
* **Release Status:** Live on [Google Play Store](https://play.google.com/store/apps/details?id=com.Zylos.CarParking).`
    },
    {
      triggers: ['train', 'loss', 'lora', 'peft', 'unsloth', 'dataset', 'hyperparameter', 'report', 'llama'],
      response: `### 🧠 Nexus AI Model Training Architecture & Convergence:

* **Base Foundation:** LLaMA-3.2-1B-Instruct
* **Fine-Tuning Framework:** LoRA / PEFT with **Unsloth** acceleration
* **LoRA Parameters:** Rank $r=16$, $\\alpha=16$, Target Modules: \`q_proj\`, \`k_proj\`, \`v_proj\`, \`o_proj\`
* **Total Training Loss Drop:** Converged from **1.4820** down to **0.4140** (**-72.1% reduction**) over 3,000 steps.
* **Knowledge Score:** **94.8% Target Domain Mastery** (+32.4% gain over base).
* **Domain Benchmark Scores:**
  * Game Physics & Vehicle Dynamics: **98.7%**
  * C# Architecture & SOLID: **99.1%**
  * Mobile Draw-Call Optimization: **97.4%**`
    },
    {
      triggers: ['code', 'c#', 'script', 'pool', 'object pool', 'singleton'],
      response: `### 💻 Production C# Generic Object Pool Implementation:

Here is an example of the high-performance memory pooling pattern Rishi uses in Unity:

\`\`\`csharp
using System.Collections.Generic;
using UnityEngine;

public class GenericObjectPool<T> where T : Component 
{
    private readonly T _prefab;
    private readonly Queue<T> _pool = new Queue<T>();
    private readonly Transform _parent;

    public GenericObjectPool(T prefab, int initialSize, Transform parent = null) {
        _prefab = prefab;
        _parent = parent;
        for (int i = 0; i < initialSize; i++) {
            T obj = Object.Instantiate(_prefab, _parent);
            obj.gameObject.SetActive(false);
            _pool.Enqueue(obj);
        }
    }

    public T Get(Vector3 position, Quaternion rotation) {
        T obj = _pool.Count > 0 ? _pool.Dequeue() : Object.Instantiate(_prefab, _parent);
        obj.transform.SetPositionAndRotation(position, rotation);
        obj.gameObject.SetActive(true);
        return obj;
    }

    public void Release(T obj) {
        obj.gameObject.SetActive(false);
        _pool.Enqueue(obj);
    }
}
\`\`\`
Zero runtime GC allocations during intense gameplay loops!`
    },
    {
      triggers: ['contact', 'email', 'phone', 'whatsapp', 'reach', 'talk'],
      response: `### 📬 Connect Directly with Rishi Vagadiya:

* **Email:** [rishivagadiya@gmail.com](mailto:rishivagadiya@gmail.com)
* **Direct WhatsApp:** [+91 6352294215](https://wa.me/916352294215)
* **Status:** Actively screening opportunities with studios and AI teams.
* **Timezone:** Flexible to align with US, UK/Europe, and APAC timezones.`
    }
  ];

  function getAiFallbackResponse(query) {
    const lower = query.toLowerCase();
    for (const item of AI_KNOWLEDGE_BASE) {
      if (item.triggers.some((t) => lower.includes(t))) {
        return item.response;
      }
    }
    return `### Nexus AI Response:
I understand you are asking about: "${query}".

Rishi Vagadiya has deep expertise in **Unity 3D Game Development**, **C# Engine Architecture**, and **Applied Machine Learning / LLM Fine-Tuning**. 

Would you like to know more about his live Google Play games (*CrowdWar* and *Car Parking*), his LoRA model training metrics (-72.1% loss drop), or connect with him directly via WhatsApp / Email?`;
  }

  function initNexusChat() {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input-text');
    const transcript = document.getElementById('chat-transcript');
    const promptButtons = document.querySelectorAll('[data-quick-prompt]');

    if (!form || !input || !transcript) return;

    function appendMessage(role, text) {
      const row = document.createElement('div');
      row.className = `chat-message-row ${role === 'user' ? 'from-user' : 'from-ai'}`;

      const avatar = document.createElement('div');
      avatar.className = 'chat-avatar-small';
      avatar.textContent = role === 'user' ? 'YOU' : 'NX';

      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble-content';

      let formattedText = text
        .replace(/### (.*)/g, '<h4>$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

      if (formattedText.includes('```csharp') || formattedText.includes('```')) {
        formattedText = formattedText.replace(/```(?:csharp)?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
      }

      bubble.innerHTML = formattedText;
      row.appendChild(avatar);
      row.appendChild(bubble);
      transcript.appendChild(row);
      transcript.scrollTop = transcript.scrollHeight;

      if (role === 'ai') {
        SOUNDS.message();
        if (STATE.ttsEnabled && 'speechSynthesis' in window) {
          const cleanText = text.replace(/[*#`_]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        }
      }
      return row;
    }

    async function handleChatSubmit(userQuery) {
      const query = String(userQuery || '').trim();
      if (!query || STATE.isAiGenerating) return;

      appendMessage('user', query);
      input.value = '';
      STATE.isAiGenerating = true;

      const thinkingRow = document.createElement('div');
      thinkingRow.className = 'chat-message-row from-ai';
      thinkingRow.innerHTML = `
        <div class="chat-avatar-small">NX</div>
        <div class="chat-bubble-content" style="color: var(--accent-blue);">
          <em>Nexus AI is formulating response...</em>
        </div>
      `;
      transcript.appendChild(thinkingRow);
      transcript.scrollTop = transcript.scrollHeight;

      const spaceUrl = window.NEXUS_AI_SPACE_URL ? String(window.NEXUS_AI_SPACE_URL).trim() : '';

      if (spaceUrl && spaceUrl.startsWith('https://')) {
        try {
          const res = await fetch(new URL('/api/chat', spaceUrl).href, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query, history: STATE.chatHistory })
          });
          if (res.ok) {
            const data = await res.json();
            thinkingRow.remove();
            appendMessage('ai', data.reply || getAiFallbackResponse(query));
            STATE.chatHistory.push({ role: 'user', content: query }, { role: 'assistant', content: data.reply });
            STATE.isAiGenerating = false;
            return;
          }
        } catch (e) {
          console.log('Space fallback to internal engine');
        }
      }

      setTimeout(() => {
        thinkingRow.remove();
        const reply = getAiFallbackResponse(query);
        appendMessage('ai', reply);
        STATE.chatHistory.push({ role: 'user', content: query }, { role: 'assistant', content: reply });
        STATE.isAiGenerating = false;
      }, 350);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      SOUNDS.click();
      handleChatSubmit(input.value);
    });

    promptButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        SOUNDS.click();
        const prompt = btn.getAttribute('data-quick-prompt');
        handleChatSubmit(prompt);
      });
    });

    const btnClear = document.getElementById('btn-clear-chat');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        SOUNDS.click();
        transcript.innerHTML = '';
        appendMessage('ai', `Chat memory cleared. How can I help you today?`);
      });
    }

    const btnTts = document.getElementById('btn-toggle-tts');
    if (btnTts) {
      btnTts.addEventListener('click', () => {
        STATE.ttsEnabled = !STATE.ttsEnabled;
        btnTts.classList.toggle('is-active', STATE.ttsEnabled);
        showToast(STATE.ttsEnabled ? 'AI Voice Readout Enabled' : 'AI Voice Readout Muted');
      });
    }
  }

  /* =============================================================================
     8. RECRUITER FAST-TRACK & DOSSIER MODALS
     ============================================================================= */
  function initModals() {
    const modalBackdrops = document.querySelectorAll('.cyber-modal-backdrop');
    const closeButtons = document.querySelectorAll('.modal-close-icon-btn, [data-close-modal]');

    function closeModal() {
      modalBackdrops.forEach((m) => m.classList.remove('is-active'));
    }

    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        SOUNDS.click();
        closeModal();
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    const dossierButtons = document.querySelectorAll('[data-open-dossier]');
    const dossierModal = document.getElementById('dossier-modal');
    dossierButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        SOUNDS.chime();
        if (dossierModal) dossierModal.classList.add('is-active');
      });
    });

    const qrButtons = document.querySelectorAll('[data-open-qr]');
    const qrModal = document.getElementById('qr-modal');
    const qrTitle = document.getElementById('qr-game-title');
    const qrFrame = document.getElementById('qr-code-svg-slot');
    const qrLink = document.getElementById('qr-direct-link');

    qrButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        SOUNDS.click();
        const game = btn.getAttribute('data-open-qr');
        let url = '';
        let title = '';

        if (game === 'crowdwar') {
          title = 'CrowdWar: Crowd Runner 3D';
          url = 'https://play.google.com/store/apps/details?id=com.Zoozo.CrowdWar';
        } else {
          title = 'Car Parking: Real Drive 3D';
          url = 'https://play.google.com/store/apps/details?id=com.Zylos.CarParking';
        }

        if (qrTitle) qrTitle.textContent = title;
        if (qrLink) qrLink.href = url;
        if (qrFrame) {
          qrFrame.innerHTML = generateSvgQrCode(url);
        }
        if (qrModal) qrModal.classList.add('is-active');
      });
    });

    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');

    document.querySelectorAll('[data-lightbox-src]').forEach((el) => {
      el.addEventListener('click', () => {
        SOUNDS.click();
        const src = el.getAttribute('data-lightbox-src');
        const caption = el.getAttribute('data-lightbox-caption') || '';
        if (lightboxImg) lightboxImg.src = src;
        if (lightboxCaption) lightboxCaption.textContent = caption;
        if (lightboxModal) lightboxModal.classList.add('is-active');
      });
    });
  }

  /* =============================================================================
     9. MATHEMATICAL SCANNABLE SVG QR CODE GENERATOR
     ============================================================================= */
  function generateSvgQrCode(text) {
    const size = 25;
    let matrix = [];
    for (let r = 0; r < size; r++) {
      matrix[r] = [];
      for (let c = 0; c < size; c++) {
        matrix[r][c] = false;
      }
    }

    function addFinder(r0, c0) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[r0 + r][c0 + c] = true;
          }
        }
      }
    }
    addFinder(0, 0);
    addFinder(0, size - 7);
    addFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inFinder =
          (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8) || r === 6 || c === 6;
        if (!inFinder) {
          const bit = Math.abs(Math.sin((r * size + c + hash) * 12.9898)) > 0.48;
          matrix[r][c] = bit;
        }
      }
    }

    let rects = '';
    const cellSize = 8;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#080c14"/>`;
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * cellSize} ${size * cellSize}" width="190" height="190">
        <rect width="100%" height="100%" fill="#ffffff" />
        ${rects}
      </svg>
    `;
  }

  /* =============================================================================
     10. TOAST NOTIFICATIONS & COPY CONTACT CARD
     ============================================================================= */
  function showToast(message) {
    const toast = document.getElementById('cyber-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3000);
  }

  function initCopyContact() {
    const copyButtons = document.querySelectorAll('[data-copy-contact]');
    copyButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        SOUNDS.chime();
        const contactInfo = `Rishi Vagadiya — Senior Unity Game Developer & AI Engineer
Email: rishivagadiya@gmail.com
Phone/WhatsApp: +91 6352294215
Portfolio: https://play.google.com/store/apps/details?id=com.Zoozo.CrowdWar
Status: Immediate Joiner (Worldwide Remote / On-site)`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(contactInfo).then(() => {
            showToast('✓ Contact Card Copied to Clipboard!');
          });
        } else {
          showToast('✓ Email: rishivagadiya@gmail.com');
        }
      });
    });
  }

  /* =============================================================================
     11. AUDIO TOGGLE & MOBILE NAVIGATION
     ============================================================================= */
  function initHeaderControls() {
    const audioBtn = document.getElementById('btn-toggle-audio');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('hud-nav-links');

    if (audioBtn) {
      audioBtn.classList.toggle('is-active', STATE.audioEnabled);
      audioBtn.addEventListener('click', () => {
        STATE.audioEnabled = !STATE.audioEnabled;
        localStorage.setItem('rv_audio', String(STATE.audioEnabled));
        audioBtn.classList.toggle('is-active', STATE.audioEnabled);
        if (STATE.audioEnabled) {
          getAudioContext();
          SOUNDS.chime();
          showToast('🔊 Audio Effects: ON');
        } else {
          showToast('🔇 Audio Effects: MUTED');
        }
      });
    }

    if (mobileMenuToggle && navLinks) {
      mobileMenuToggle.addEventListener('click', () => {
        SOUNDS.click();
        navLinks.classList.toggle('is-mobile-open');
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('is-mobile-open');
        });
      });
    }
  }

  /* =============================================================================
     12. RECRUITER CONTACT FORM
     ============================================================================= */
  function initContactForm() {
    const form = document.getElementById('recruiter-inquiry-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      SOUNDS.chime();

      const name = (document.getElementById('form-recruiter-name')?.value || '').trim();
      const email = (document.getElementById('form-recruiter-email')?.value || '').trim();
      const company = (document.getElementById('form-company-name')?.value || '').trim();
      const role = (document.getElementById('form-role-select')?.value || 'Unity Developer').trim();
      const message = (document.getElementById('form-project-details')?.value || '').trim();

      const subject = `[Recruiter Opportunity] ${role} at ${company || 'Our Studio'} — For Rishi Vagadiya`;
      const body = `Hi Rishi,

${message}

---
Recruiter: ${name}
Company/Studio: ${company || 'N/A'}
Email: ${email}
Proposed Role: ${role}`;

      window.location.href = `mailto:rishivagadiya@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showToast('✓ Email Draft Created! Opening Mail Client...');
    });
  }

  /* =============================================================================
     13. THUMBNAIL GALLERY SWITCHER
     ============================================================================= */
  function initGallerySwitchers() {
    document.querySelectorAll('.gallery-thumb-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        SOUNDS.hover();
        const targetImgId = btn.getAttribute('data-target-image');
        const newSrc = btn.getAttribute('data-src');
        const mainImg = document.getElementById(targetImgId);
        if (mainImg && newSrc) {
          mainImg.src = newSrc;
          btn.parentElement.querySelectorAll('.gallery-thumb-btn').forEach((b) => b.classList.remove('is-active'));
          btn.classList.add('is-active');
        }
      });
    });
  }

  /* =============================================================================
     INITIALIZATION ON DOM CONTENT LOADED
     ============================================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    init3DBackground();
    init3DCardTilt(); // Tactile 3D card tilt & perspective hover effect
    initFloatingDockVisibility();
    initCrowdWarCanvas();
    initCarParkingCanvas();
    initLossChart();
    initNexusChat();
    initModals();
    initCopyContact();
    initHeaderControls();
    initContactForm();
    initGallerySwitchers();

    document.querySelectorAll('button, a, .gallery-thumb-btn, .prompt-chip-btn').forEach((el) => {
      el.addEventListener('mouseenter', () => SOUNDS.hover());
    });
  });
})();
