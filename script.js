/* ============================================
   QMII Premium Redesign — 5 Hero Variants
   Three.js + GSAP + Interactive
   ============================================ */
(function () {
    'use strict';

    // ==========================================
    // Preloader
    // ==========================================
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.getElementById('preloader').classList.add('hidden');
            initAnimations();
        }, 1800);
    });

    // ==========================================
    // Hero Variant Switcher
    // ==========================================
    const heroSections = document.querySelectorAll('.hero');
    const switcherBtns = document.querySelectorAll('.hs-btn');

    switcherBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const heroNum = btn.dataset.hero;
            switcherBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            heroSections.forEach(h => {
                h.classList.remove('active');
                h.style.display = 'none';
            });

            const target = document.getElementById('hero-' + heroNum);
            if (target) {
                target.classList.add('active');
                target.style.display = 'flex';

                // Re-trigger animations for this hero
                target.querySelectorAll('[data-animate]').forEach(el => {
                    el.classList.remove('animated');
                    setTimeout(() => el.classList.add('animated'), 50);
                });

                // Initialize specific Three.js scene
                if (heroNum === '1' && !shieldInitialized) initShieldScene();
                if (heroNum === '2' && !globeHeroInitialized) initGlobeHeroScene();
                if (heroNum === '3' && !waveInitialized) initWaveScene();
                if (heroNum === '5' && !morphInitialized) initMorphScene();
            }
        });
    });

    // ==========================================
    // Three.js — Background Particles (always on)
    // ==========================================
    const canvas = document.getElementById('three-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 30;

    const particleCount = 600;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 80;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
        pSizes[i] = Math.random() * 2 + 0.5;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

    const pMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uScroll: { value: 0 }
        },
        vertexShader: `
            attribute float size;
            uniform float uTime;
            uniform float uScroll;
            varying float vAlpha;
            varying vec3 vPos;
            void main() {
                vec3 pos = position;
                pos.x += sin(uTime * 0.3 + position.y * 0.05) * 1.5;
                pos.y += cos(uTime * 0.2 + position.x * 0.05) * 1.5;
                pos.y -= uScroll * 0.05;
                vPos = pos;
                vAlpha = 0.3 + 0.4 * sin(uTime + position.x * 0.1);
                vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (200.0 / -mv.z);
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            varying float vAlpha;
            varying vec3 vPos;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float a = smoothstep(0.5, 0.0, d) * vAlpha;
                float m1 = sin(vPos.x * 0.05 + uTime * 0.2) * 0.5 + 0.5;
                float m2 = cos(vPos.y * 0.05 + uTime * 0.3) * 0.5 + 0.5;
                vec3 c1 = vec3(0.231, 0.510, 0.965);
                vec3 c2 = vec3(0.545, 0.361, 0.965);
                vec3 c3 = vec3(0.024, 0.714, 0.831);
                vec3 color = mix(mix(c1, c2, m1), c3, m2);
                gl_FragColor = vec4(color, a * 0.5);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    scene.add(new THREE.Points(pGeo, pMat));

    let mouseX = 0, mouseY = 0, scrollY = 0;
    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('scroll', () => { scrollY = window.pageYOffset; });
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();
    function animateBg() {
        requestAnimationFrame(animateBg);
        const t = clock.getElapsedTime();
        pMat.uniforms.uTime.value = t;
        pMat.uniforms.uScroll.value = scrollY;
        camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
    }
    animateBg();

    // ==========================================
    // HERO 1 — 3D Shield
    // ==========================================
    let shieldInitialized = false;
    function initShieldScene() {
        shieldInitialized = true;
        const c = document.getElementById('shield-canvas');
        if (!c) return;
        const s = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        cam.position.z = 4;
        const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
        const sz = Math.min(c.parentElement.clientWidth, 500);
        r.setSize(sz, sz);
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Shield shape
        const shieldShape = new THREE.Shape();
        shieldShape.moveTo(0, 1.5);
        shieldShape.quadraticCurveTo(1.2, 1.2, 1.2, 0.5);
        shieldShape.quadraticCurveTo(1.2, -0.5, 0, -1.5);
        shieldShape.quadraticCurveTo(-1.2, -0.5, -1.2, 0.5);
        shieldShape.quadraticCurveTo(-1.2, 1.2, 0, 1.5);

        const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 };
        const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.3 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        s.add(shield);

        // Orbiting nodes (ISO standards)
        const nodeGroup = new THREE.Group();
        const nodeGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const nodeMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        for (let i = 0; i < 8; i++) {
            const node = new THREE.Mesh(nodeGeo, nodeMat.clone());
            const angle = (i / 8) * Math.PI * 2;
            node.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0);
            nodeGroup.add(node);
        }
        s.add(nodeGroup);

        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            shield.rotation.y = Math.sin(t * 0.5) * 0.3;
            shield.rotation.x = Math.sin(t * 0.3) * 0.1;
            nodeGroup.rotation.z = t * 0.2;
            nodeGroup.children.forEach((n, i) => {
                n.position.z = Math.sin(t * 2 + i) * 0.3;
                n.material.opacity = 0.5 + Math.sin(t * 3 + i) * 0.3;
                n.material.transparent = true;
            });
            r.render(s, cam);
        }
        animate();
    }
    initShieldScene(); // Init for default hero

    // ==========================================
    // HERO 2 — Globe with pulses
    // ==========================================
    let globeHeroInitialized = false;
    function initGlobeHeroScene() {
        globeHeroInitialized = true;
        const c = document.getElementById('globe-hero-canvas');
        if (!c) return;
        const s = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(50, c.clientWidth / c.clientHeight, 0.1, 100);
        cam.position.z = 3.5;
        const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
        r.setSize(c.clientWidth, c.clientHeight);
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const globeGeo = new THREE.SphereGeometry(1.5, 48, 48);
        const wireframe = new THREE.WireframeGeometry(globeGeo);
        const globe = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.08 }));
        s.add(globe);

        // Dots on globe
        const dotGeo = new THREE.SphereGeometry(0.03, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const locations = [
            [38.9, -77.3], [51.5, -0.1], [25.2, 55.3], [1.3, 103.8], [35.6, 139.7],
            [-33.9, 18.4], [48.9, 2.3], [19.1, 72.9], [-23.5, -46.6], [37.8, -122.4]
        ];
        locations.forEach(([lat, lng]) => {
            const phi = (90 - lat) * Math.PI / 180;
            const theta = (lng + 180) * Math.PI / 180;
            const dot = new THREE.Mesh(dotGeo, dotMat.clone());
            dot.position.set(-1.52 * Math.sin(phi) * Math.cos(theta), 1.52 * Math.cos(phi), 1.52 * Math.sin(phi) * Math.sin(theta));
            s.add(dot);
        });

        function animate() {
            requestAnimationFrame(animate);
            globe.rotation.y = clock.getElapsedTime() * 0.1;
            r.render(s, cam);
        }
        animate();

        window.addEventListener('resize', () => {
            r.setSize(c.clientWidth, c.clientHeight);
            cam.aspect = c.clientWidth / c.clientHeight;
            cam.updateProjectionMatrix();
        });
    }

    // ==========================================
    // HERO 3 — Ocean Waves
    // ==========================================
    let waveInitialized = false;
    function initWaveScene() {
        waveInitialized = true;
        const c = document.getElementById('wave-canvas');
        if (!c) return;
        const s = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(60, c.clientWidth / c.clientHeight, 0.1, 100);
        cam.position.set(0, 2, 5);
        cam.lookAt(0, 0, 0);
        const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
        r.setSize(c.clientWidth, c.clientHeight);
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const planeGeo = new THREE.PlaneGeometry(20, 10, 80, 40);
        planeGeo.rotateX(-Math.PI / 2.5);
        const planeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.15 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        s.add(plane);

        const posAttr = planeGeo.getAttribute('position');
        const origY = new Float32Array(posAttr.count);
        for (let i = 0; i < posAttr.count; i++) origY[i] = posAttr.getY(i);

        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            for (let i = 0; i < posAttr.count; i++) {
                const x = posAttr.getX(i);
                const z = posAttr.getZ(i);
                posAttr.setY(i, origY[i] + Math.sin(x * 0.5 + t * 1.5) * 0.3 + Math.cos(z * 0.3 + t) * 0.2);
            }
            posAttr.needsUpdate = true;
            r.render(s, cam);
        }
        animate();
    }

    // ==========================================
    // HERO 5 — Morphing Geometry
    // ==========================================
    let morphInitialized = false;
    function initMorphScene() {
        morphInitialized = true;
        const c = document.getElementById('morph-canvas');
        if (!c) return;
        const s = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(60, c.clientWidth / c.clientHeight, 0.1, 100);
        cam.position.z = 6;
        const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
        r.setSize(c.clientWidth, c.clientHeight);
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Multiple geometric shapes
        const shapes = [];
        const geos = [
            new THREE.IcosahedronGeometry(0.8, 1),
            new THREE.OctahedronGeometry(0.7, 0),
            new THREE.TorusGeometry(0.5, 0.2, 8, 16),
            new THREE.TetrahedronGeometry(0.7, 0),
            new THREE.DodecahedronGeometry(0.6, 0)
        ];

        const colors = [0x3b82f6, 0x8b5cf6, 0x06b6d4, 0x60a5fa, 0xa78bfa];

        for (let i = 0; i < 12; i++) {
            const geo = geos[i % geos.length];
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                wireframe: true,
                transparent: true,
                opacity: 0.15 + Math.random() * 0.1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 6
            );
            mesh.userData = {
                baseX: mesh.position.x,
                baseY: mesh.position.y,
                rotSpeed: 0.2 + Math.random() * 0.5,
                floatSpeed: 0.5 + Math.random() * 1,
                floatAmp: 0.5 + Math.random() * 1
            };
            s.add(mesh);
            shapes.push(mesh);
        }

        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            shapes.forEach((m, i) => {
                m.rotation.x = t * m.userData.rotSpeed;
                m.rotation.y = t * m.userData.rotSpeed * 0.7;
                m.position.y = m.userData.baseY + Math.sin(t * m.userData.floatSpeed + i) * m.userData.floatAmp;
                m.position.x = m.userData.baseX + Math.cos(t * m.userData.floatSpeed * 0.5 + i) * 0.5;
            });
            r.render(s, cam);
        }
        animate();

        window.addEventListener('resize', () => {
            r.setSize(c.clientWidth, c.clientHeight);
            cam.aspect = c.clientWidth / c.clientHeight;
            cam.updateProjectionMatrix();
        });
    }

    // ==========================================
    // Standards Section — Interactive Globe
    // ==========================================
    const globeContainer = document.getElementById('globe-container');

    function initGlobe() {
        if (!globeContainer) return;
        const s = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        cam.position.z = 3.5;
        const r = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const sz = Math.min(globeContainer.clientWidth, 500);
        r.setSize(sz, sz);
        globeContainer.appendChild(r.domElement);

        const globeGeo = new THREE.SphereGeometry(1.2, 36, 36);
        const wireframe = new THREE.WireframeGeometry(globeGeo);
        const globe = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.12 }));
        s.add(globe);

        const inner = new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 32), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.03 }));
        s.add(inner);

        const pointsData = [
            { lat: 38.9, lng: -77.3 }, { lat: 51.5, lng: -0.1 }, { lat: 25.2, lng: 55.3 },
            { lat: 1.3, lng: 103.8 }, { lat: 35.6, lng: 139.7 }, { lat: -33.9, lng: 18.4 },
            { lat: 48.9, lng: 2.3 }, { lat: 19.1, lng: 72.9 }, { lat: -23.5, lng: -46.6 },
            { lat: 37.8, lng: -122.4 }, { lat: 55.8, lng: 37.6 }, { lat: -37.8, lng: 144.9 }
        ];

        const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const glowGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3 });

        const pts = new THREE.Group();
        pointsData.forEach(p => {
            const phi = (90 - p.lat) * Math.PI / 180;
            const theta = (p.lng + 180) * Math.PI / 180;
            const x = -1.22 * Math.sin(phi) * Math.cos(theta);
            const y = 1.22 * Math.cos(phi);
            const z = 1.22 * Math.sin(phi) * Math.sin(theta);
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.set(x, y, z);
            pts.add(dot);
            const glow = new THREE.Mesh(glowGeo, glowMat.clone());
            glow.position.set(x, y, z);
            pts.add(glow);
        });

        // Arcs
        for (let i = 0; i < pointsData.length - 1; i++) {
            const p1 = pointsData[i], p2 = pointsData[(i + 3) % pointsData.length];
            const phi1 = (90 - p1.lat) * Math.PI / 180, theta1 = (p1.lng + 180) * Math.PI / 180;
            const phi2 = (90 - p2.lat) * Math.PI / 180, theta2 = (p2.lng + 180) * Math.PI / 180;
            const v1 = new THREE.Vector3(-1.22 * Math.sin(phi1) * Math.cos(theta1), 1.22 * Math.cos(phi1), 1.22 * Math.sin(phi1) * Math.sin(theta1));
            const v2 = new THREE.Vector3(-1.22 * Math.sin(phi2) * Math.cos(theta2), 1.22 * Math.cos(phi2), 1.22 * Math.sin(phi2) * Math.sin(theta2));
            const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5).normalize().multiplyScalar(1.8);
            const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
            const cGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
            pts.add(new THREE.Line(cGeo, new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.15 })));
        }
        s.add(pts);

        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            globe.rotation.y = t * 0.15;
            inner.rotation.y = t * 0.15;
            pts.rotation.y = t * 0.15;
            pts.children.forEach((child, i) => {
                if (child.material && child.material.opacity < 0.5 && child.geometry.type === 'SphereGeometry') {
                    child.material.opacity = 0.2 + Math.sin(t * 2 + i * 0.5) * 0.15;
                    child.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.3);
                }
            });
            r.render(s, cam);
        }
        animate();

        new ResizeObserver(() => {
            const ns = Math.min(globeContainer.clientWidth, 500);
            r.setSize(ns, ns);
        }).observe(globeContainer);

        // Standards color change
        const standardItems = document.querySelectorAll('.standard-item');
        const sColors = { quality: 0x3b82f6, environment: 0x10b981, security: 0x8b5cf6, safety: 0xf59e0b, maritime: 0x06b6d4, specialized: 0xec4899 };
        standardItems.forEach(item => {
            item.addEventListener('click', () => {
                standardItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const color = sColors[item.dataset.standard] || 0x3b82f6;
                gsap.to(globe.material.color, { r: ((color >> 16) & 255) / 255, g: ((color >> 8) & 255) / 255, b: (color & 255) / 255, duration: 0.8 });
            });
        });
    }
    initGlobe();

    // ==========================================
    // GSAP Animations
    // ==========================================
    function initAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        document.querySelectorAll('[data-animate]').forEach(el => {
            const delay = parseFloat(el.dataset.delay) || 0;
            gsap.to(el, {
                opacity: 1, x: 0, y: 0, duration: 0.8, delay,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%', once: true, onEnter: () => el.classList.add('animated') }
            });
        });

        document.querySelectorAll('[data-count]').forEach(counter => {
            gsap.to(counter, {
                textContent: parseInt(counter.dataset.count), duration: 2, ease: 'power2.out',
                snap: { textContent: 1 },
                scrollTrigger: { trigger: counter, start: 'top 80%', once: true }
            });
        });

        // Parallax on active hero
        const activeHero = document.querySelector('.hero.active');
        if (activeHero) {
            const content = activeHero.querySelector('.hero__left') || activeHero.querySelector('.hero__center-content') || activeHero.querySelector('.hero__overlay-content');
            if (content) {
                gsap.to(content, {
                    yPercent: 20, opacity: 0.3, ease: 'none',
                    scrollTrigger: { trigger: activeHero, start: 'top top', end: 'bottom top', scrub: true }
                });
            }
        }
    }

    // ==========================================
    // Navigation
    // ==========================================
    const navbar = document.getElementById('navbar');
    const burger = document.getElementById('burger');
    const navLinks = document.getElementById('nav-links');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        // Hide scroll indicator
        const si = document.getElementById('hero-scroll');
        if (si) si.style.opacity = window.scrollY > 200 ? '0' : '1';
    });

    burger.addEventListener('click', () => {
        burger.classList.toggle('open');
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => { burger.classList.remove('open'); navLinks.classList.remove('open'); });
    });

    // Active nav on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const sp = window.scrollY + 150;
        sections.forEach(sec => {
            const top = sec.offsetTop, h = sec.offsetHeight, id = sec.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) link.classList.toggle('active', sp >= top && sp < top + h);
        });
    });

    // ==========================================
    // Smooth scroll
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            }
        });
    });

    // ==========================================
    // Contact form
    // ==========================================
    const contactForm = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');
    if (contactForm) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault();
            contactForm.style.display = 'none';
            formSuccess.style.display = 'block';
            setTimeout(() => {
                contactForm.style.display = 'block';
                formSuccess.style.display = 'none';
                contactForm.reset();
            }, 5000);
        });
    }

    // ==========================================
    // Magnetic buttons
    // ==========================================
    document.querySelectorAll('.btn--primary').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    // ==========================================
    // Tilt on cards
    // ==========================================
    document.querySelectorAll('.service-card, .training-card, .industry-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(800px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-8px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });

    // ==========================================
    // Floating cards animation (Hero 4)
    // ==========================================
    function animateFloatingCards() {
        const cards = document.querySelectorAll('.float-card');
        cards.forEach((card, i) => {
            const t = clock.getElapsedTime();
            const floatY = Math.sin(t * 0.8 + i * 1.5) * 8;
            const floatR = Math.sin(t * 0.5 + i * 2) * 1.5;
            card.style.transform += ` translateY(${floatY}px)`;
        });
        requestAnimationFrame(animateFloatingCards);
    }
    animateFloatingCards();

})();
