import * as THREE from 'three';

export class OrigamiCanvas {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.craneGroup = null;
    this.facets = [];
    this.particles = null;
    this.creaseLines = null;
    this.currentScrollProgress = 0; // 0..1 transition between sections
    this.targetRotation = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.createOrigamiGeometry();
    this.createSacredDustParticles();

    // Mouse parallax listener
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Soft celestial parchment ambient
    const ambientLight = new THREE.AmbientLight(0xfdfbf7, 1.2);
    this.scene.add(ambientLight);

    // Main golden morning sunlight beam
    const sunLight = new THREE.DirectionalLight(0xfff3db, 2.0);
    sunLight.position.set(4, 6, 5);
    this.scene.add(sunLight);

    // Gentle rim light for paper fold creases and paper fiber depth
    const rimLight = new THREE.DirectionalLight(0xe8d5b5, 1.0);
    rimLight.position.set(-4, -2, -3);
    this.scene.add(rimLight);

    // Warm subtle underlight
    const pointLight = new THREE.PointLight(0xd4af37, 0.8, 12);
    pointLight.position.set(0, -2, 3);
    this.scene.add(pointLight);
  }

  createOrigamiGeometry() {
    this.craneGroup = new THREE.Group();
    this.scene.add(this.craneGroup);

    // Paper material with authentic cream cotton texture feel
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: 0xf9f7f1,
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    // Darker underside/crease shadow material
    const shadowPaperMaterial = new THREE.MeshStandardMaterial({
      color: 0xede6d6,
      roughness: 0.9,
      metalness: 0.02,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    // Golden subtle crease line material
    const creaseMaterial = new THREE.LineBasicMaterial({
      color: 0xc8a96e,
      transparent: true,
      opacity: 0.35,
      linewidth: 1
    });

    // Define vertices for an authentic origami crane in 3D:
    // Centered at origin, origami facets
    // Key coordinates for crane:
    // Center spine: [0, 0, 0], [0, 0.4, 0.2], [0, -0.6, 0.1]
    // Head/Beak: [-2.2, 0.8, 0], Neck: [-1.6, 0.2, 0]
    // Tail: [1.8, 0.5, 0]
    // Left Wing tip: [0, 1.8, -2.4], Right Wing tip: [0, 1.8, 2.4]
    // Body keel & diamond facets

    // We create separate pivot groups for dynamic wing flapping and folding:
    this.leftWingGroup = new THREE.Group();
    this.rightWingGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.neckGroup = new THREE.Group();
    this.tailGroup = new THREE.Group();

    // 1. Central Body Keel (two mirrored triangles)
    const bodyGeom = new THREE.BufferGeometry();
    const bodyVertices = new Float32Array([
      // Triangle 1: center to top spine to chest
      0, 0.5, 0,
      -0.7, 0.1, 0,
      0, -0.6, 0.3,

      // Triangle 2: center to top spine to rear
      0, 0.5, 0,
      0, -0.6, 0.3,
      0.8, 0.0, 0,

      // Triangle 3: opposite side chest
      0, 0.5, 0,
      0, -0.6, -0.3,
      -0.7, 0.1, 0,

      // Triangle 4: opposite side rear
      0, 0.5, 0,
      0.8, 0.0, 0,
      0, -0.6, -0.3
    ]);
    bodyGeom.setAttribute('position', new THREE.BufferAttribute(bodyVertices, 3));
    bodyGeom.computeVertexNormals();
    const bodyMesh = new THREE.Mesh(bodyGeom, paperMaterial);
    this.bodyGroup.add(bodyMesh);

    // 2. Left Wing (Multi-facet folding geometry)
    const leftWingGeom = new THREE.BufferGeometry();
    const leftWingVertices = new Float32Array([
      // Main wing blade
      0, 0.5, 0.05,
      0.4, 1.6, 1.8,
      -0.5, 0.8, 1.2,

      // Wing tip facet
      0.4, 1.6, 1.8,
      0.2, 2.1, 2.5,
      -0.3, 1.3, 1.9,

      // Secondary fold facet
      0, 0.5, 0.05,
      0.6, 0.3, 1.1,
      0.4, 1.6, 1.8
    ]);
    leftWingGeom.setAttribute('position', new THREE.BufferAttribute(leftWingVertices, 3));
    leftWingGeom.computeVertexNormals();
    this.leftWingMesh = new THREE.Mesh(leftWingGeom, paperMaterial);
    this.leftWingGroup.add(this.leftWingMesh);

    // 3. Right Wing (Mirrored multi-facet)
    const rightWingGeom = new THREE.BufferGeometry();
    const rightWingVertices = new Float32Array([
      // Main wing blade
      0, 0.5, -0.05,
      -0.5, 0.8, -1.2,
      0.4, 1.6, -1.8,

      // Wing tip facet
      0.4, 1.6, -1.8,
      -0.3, 1.3, -1.9,
      0.2, 2.1, -2.5,

      // Secondary fold facet
      0, 0.5, -0.05,
      0.4, 1.6, -1.8,
      0.6, 0.3, -1.1
    ]);
    rightWingGeom.setAttribute('position', new THREE.BufferAttribute(rightWingVertices, 3));
    rightWingGeom.computeVertexNormals();
    this.rightWingMesh = new THREE.Mesh(rightWingGeom, paperMaterial);
    this.rightWingGroup.add(this.rightWingMesh);

    // 4. Neck & Head (Crisp diagonal origami folds)
    const neckGeom = new THREE.BufferGeometry();
    const neckVertices = new Float32Array([
      // Neck stem
      -0.7, 0.1, 0,
      -1.5, 0.8, 0.08,
      -1.3, 0.4, -0.08,

      // Neck reverse fold
      -1.5, 0.8, 0.08,
      -1.3, 0.4, -0.08,
      -1.9, 1.3, 0,

      // Head / Beak downward fold
      -1.9, 1.3, 0,
      -2.2, 0.95, 0.04,
      -2.0, 0.9, -0.04
    ]);
    neckGeom.setAttribute('position', new THREE.BufferAttribute(neckVertices, 3));
    neckGeom.computeVertexNormals();
    const neckMesh = new THREE.Mesh(neckGeom, paperMaterial);
    this.neckGroup.add(neckMesh);

    // 5. Tail (Crisp upward tapered fold)
    const tailGeom = new THREE.BufferGeometry();
    const tailVertices = new Float32Array([
      0.8, 0.0, 0,
      1.7, 0.9, 0.06,
      1.5, 0.6, -0.06,

      1.7, 0.9, 0.06,
      1.5, 0.6, -0.06,
      2.1, 1.3, 0
    ]);
    tailGeom.setAttribute('position', new THREE.BufferAttribute(tailVertices, 3));
    tailGeom.computeVertexNormals();
    const tailMesh = new THREE.Mesh(tailGeom, paperMaterial);
    this.tailGroup.add(tailMesh);

    // Add crease line wireframes for origami tactile scorelines
    const addCreaseEdges = (mesh) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
      const line = new THREE.LineSegments(edges, creaseMaterial);
      mesh.add(line);
    };

    addCreaseEdges(bodyMesh);
    addCreaseEdges(this.leftWingMesh);
    addCreaseEdges(this.rightWingMesh);
    addCreaseEdges(neckMesh);
    addCreaseEdges(tailMesh);

    // Assemble crane
    this.craneGroup.add(this.bodyGroup);
    this.craneGroup.add(this.leftWingGroup);
    this.craneGroup.add(this.rightWingGroup);
    this.craneGroup.add(this.neckGroup);
    this.craneGroup.add(this.tailGroup);

    // Scale & initial positioning:
    // Placed slightly to the right/background so it balances the centered scrapbook note
    this.craneGroup.scale.set(0.75, 0.75, 0.75);
    this.craneGroup.position.set(2.4, 0.3, -1.0);
    this.craneGroup.rotation.set(0.25, -0.55, 0.1);
  }

  createSacredDustParticles() {
    // Floating golden paper flecks & sacred light dust motes
    const particleCount = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
      scales[i] = Math.random() * 0.05 + 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom circular soft particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(235, 205, 150, 0.85)');
    grad.addColorStop(0.5, 'rgba(212, 175, 55, 0.35)');
    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.18,
      map: texture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  // Called continuously from scroll engine with local section progress (0..1)
  updateScroll(progress, sectionIndex, direction = 1) {
    this.currentScrollProgress = progress;
    this.sectionIndex = sectionIndex;

    // Origami transition dynamics:
    // As progress goes 0 -> 0.5 -> 1.0:
    // Crane lifts up, wings flap through full wing stroke, rotates along diagonal axis
    const foldFactor = Math.sin(progress * Math.PI); // 0 at rest, 1 at peak transition

    if (this.craneGroup && !this.isReducedMotion) {
      // Flap wings on fold
      const wingFlap = Math.sin(progress * Math.PI * 4) * 0.45 * foldFactor;
      this.leftWingMesh.rotation.x = wingFlap;
      this.rightWingMesh.rotation.x = -wingFlap;

      // Morph / soar path
      this.craneGroup.position.y = 0.3 + foldFactor * 1.4;
      this.craneGroup.position.z = -1.0 + foldFactor * 1.8;
      this.craneGroup.rotation.y = -0.55 + progress * Math.PI * 1.5;
      this.craneGroup.rotation.x = 0.25 + Math.sin(progress * Math.PI) * 0.35;
      this.craneGroup.rotation.z = 0.1 + Math.cos(progress * Math.PI * 2) * 0.2 * foldFactor;
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // Responsive crane positioning:
    // On smaller screens, tuck crane slightly back and higher so it doesn't overlap text
    if (width < 768) {
      this.craneGroup.position.set(0, 2.2, -2.5);
      this.craneGroup.scale.set(0.48, 0.48, 0.48);
    } else {
      this.craneGroup.position.set(2.4, 0.3, -1.0);
      this.craneGroup.scale.set(0.75, 0.75, 0.75);
    }
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    const t = time * 0.001;

    // Smooth mouse parallax lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Gentle floating breathing motion when idle
    if (this.craneGroup && !this.isReducedMotion) {
      const breath = Math.sin(t * 1.2) * 0.08;
      const wingIdle = Math.sin(t * 1.8) * 0.06;

      this.craneGroup.position.y += (0.3 + breath + this.mouse.y * 0.3 - this.craneGroup.position.y) * 0.08;
      this.craneGroup.position.x += (2.4 + this.mouse.x * 0.4 - this.craneGroup.position.x) * 0.08;

      this.leftWingMesh.rotation.z = wingIdle;
      this.rightWingMesh.rotation.z = -wingIdle;
    }

    // Drift sacred dust particles slowly
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(t + positions[i]) * 0.002 + 0.0015;
        if (positions[i + 1] > 6) positions[i + 1] = -6;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}

