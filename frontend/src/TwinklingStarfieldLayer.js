import {
  AddEquation, BufferGeometry, Camera, CustomBlending,
  Float32BufferAttribute, Matrix4, OneFactor, OneMinusSrcAlphaFactor,
  Points, Scene, ShaderMaterial, Vector3, WebGLRenderer,
} from 'three';

/**
 * Twinkling starfield custom layer for MapLibre globe mode.
 *
 * Based on @geoql/maplibre-gl-starfield but adds per-star twinkling
 * via a time uniform + random phase offset per star. Each star's
 * opacity oscillates gently with sin(uTime * speed + aPhase).
 */

const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aOpacity;
  attribute float aPhase;
  attribute float aSpeed;

  uniform float uTime;

  varying float vOpacity;

  void main() {
    // Twinkle: modulate base opacity with a slow sine wave
    float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
    // Mix between 60% base and 100% so stars never fully disappear
    vOpacity = aOpacity * (0.6 + 0.4 * twinkle);

    vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    clipPos.z = clipPos.w * 0.9999;
    gl_Position = clipPos;
    gl_PointSize = aSize;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  varying float vOpacity;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float a = vOpacity * smoothstep(0.5, 0.1, d);
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export class TwinklingStarfieldLayer {
  constructor(options = {}) {
    this.id = options.id ?? 'starfield';
    this.type = 'custom';
    this.renderingMode = '3d';

    this._starCount = options.starCount ?? 4000;
    this._starSize = options.starSize ?? 2.0;
    this._starColor = options.starColor ?? 0xffffff;

    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._material = null;
    this._map = null;
    this._startTime = performance.now();
  }

  onAdd(map, gl) {
    this._map = map;
    this._scene = new Scene();
    this._camera = new Camera();

    const count = this._starCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const opacities = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random point on unit sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const i3 = i * 3;
      positions[i3] = Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = Math.cos(phi);

      sizes[i] = this._starSize * (0.4 + Math.random());
      opacities[i] = 0.15 + Math.random() * 0.85;
      phases[i] = Math.random() * Math.PI * 2;       // random phase offset
      speeds[i] = 0.3 + Math.random() * 1.2;         // twinkle speed variation
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aOpacity', new Float32BufferAttribute(opacities, 1));
    geo.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1));

    const c = this._starColor;
    this._material = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Vector3(((c >> 16) & 0xff) / 255, ((c >> 8) & 0xff) / 255, (c & 0xff) / 255) },
        uTime: { value: 0.0 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
      blendEquation: AddEquation,
    });

    this._scene.add(new Points(geo, this._material));

    this._renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
    });
    this._renderer.autoClear = false;
  }

  render(_gl, options) {
    if (!this._renderer || !this._scene || !this._camera || !this._material) return;

    // Update time uniform for twinkling
    const elapsed = (performance.now() - this._startTime) / 1000;
    this._material.uniforms.uTime.value = elapsed;

    // Decompose MapLibre matrices
    const P = new Matrix4().fromArray(options.projectionMatrix);
    const MVP = new Matrix4().fromArray(options.modelViewProjectionMatrix);
    const PInv = new Matrix4().copy(P).invert();
    const MV = new Matrix4().multiplyMatrices(PInv, MVP);

    // Strip translation so skybox stays at infinity
    const e = MV.elements;
    e[12] = 0; e[13] = 0; e[14] = 0;

    this._camera.projectionMatrix.multiplyMatrices(P, MV);

    // Reset Three.js GL state so it doesn't conflict with MapLibre
    const r = this._renderer;
    if (typeof r.resetState === 'function') r.resetState();
    else if (r.state && typeof r.state.reset === 'function') r.state.reset();

    this._renderer.render(this._scene, this._camera);

    // Request next frame to keep twinkling
    this._map?.triggerRepaint();
  }

  onRemove() {
    this._scene?.traverse((node) => {
      if (node instanceof Points) {
        node.geometry.dispose();
        node.material.dispose();
      }
    });
    this._renderer?.dispose();
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._material = null;
    this._map = null;
  }
}
