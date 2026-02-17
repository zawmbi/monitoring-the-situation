import {
  AddEquation, BufferGeometry, Camera, Color, CustomBlending,
  Float32BufferAttribute, Matrix4, OneFactor, OneMinusSrcAlphaFactor,
  Points, Scene, ShaderMaterial, WebGLRenderer,
} from 'three';

/**
 * Twinkling starfield custom layer for MapLibre globe mode.
 *
 * Renders per-vertex colored stars with a soft gaussian glow and
 * independent twinkling (opacity + size pulsing) via GLSL shaders.
 *
 * Inspired by Black4315/3jsEarth starfield — blue-hued stars with
 * varied lightness, distributed on a sphere, with a soft circular
 * texture look rendered procedurally in the fragment shader.
 */

const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aOpacity;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3  aColor;

  uniform float uTime;

  varying float vOpacity;
  varying vec3  vColor;

  void main() {
    // Twinkle: modulate base opacity with a slow sine wave
    float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
    // Range: 50 – 100 % of base opacity so stars never fully disappear
    vOpacity = aOpacity * (0.5 + 0.5 * twinkle);
    vColor   = aColor;

    // Size pulsing — brighter stars grow slightly
    float sizePulse = 1.0 + 0.2 * twinkle;

    vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    clipPos.z = clipPos.w * 0.9999;
    gl_Position  = clipPos;
    gl_PointSize = aSize * sizePulse;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying float vOpacity;
  varying vec3  vColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Bright core with soft gaussian halo — mimics a circular star texture
    float core = smoothstep(0.5, 0.05, d);     // hard-ish bright center
    float halo = exp(-d * d * 12.0);            // soft gaussian glow
    float a    = vOpacity * (0.4 * core + 0.6 * halo);

    gl_FragColor = vec4(vColor * a, a);
  }
`;

export class TwinklingStarfieldLayer {
  constructor(options = {}) {
    this.id = options.id ?? 'starfield';
    this.type = 'custom';
    this.renderingMode = '3d';

    this._starCount = options.starCount ?? 5000;
    this._starSize  = options.starSize  ?? 3.5;

    this._renderer  = null;
    this._scene     = null;
    this._camera    = null;
    this._material  = null;
    this._map       = null;
    this._startTime = performance.now();
    this._lastRepaintTime = 0;
  }

  onAdd(map, gl) {
    this._map    = map;
    this._scene  = new Scene();
    this._camera = new Camera();

    const count     = this._starCount;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);
    const opacities = new Float32Array(count);
    const phases    = new Float32Array(count);
    const speeds    = new Float32Array(count);

    const tmpColor = new Color();

    for (let i = 0; i < count; i++) {
      // Random point on unit sphere (uniform distribution)
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const i3    = i * 3;

      positions[i3]     = Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = Math.cos(phi);

      // Per-star color — mostly cool blue-white, ~15 % warm amber
      const isWarm   = Math.random() < 0.15;
      const hue      = isWarm ? 0.08 + Math.random() * 0.08  // warm gold/amber
                               : 0.55 + Math.random() * 0.12; // cool blue
      const sat      = 0.15 + Math.random() * 0.15;
      const lightness = 0.5 + Math.random() * 0.5;

      tmpColor.setHSL(hue, sat, lightness);
      colors[i3]     = tmpColor.r;
      colors[i3 + 1] = tmpColor.g;
      colors[i3 + 2] = tmpColor.b;

      sizes[i]     = this._starSize * (0.4 + Math.random() * 0.8);
      opacities[i] = 0.2 + Math.random() * 0.8;
      phases[i]    = Math.random() * Math.PI * 2;
      speeds[i]    = 0.3 + Math.random() * 1.5;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aColor',   new Float32BufferAttribute(colors, 3));
    geo.setAttribute('aSize',    new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aOpacity', new Float32BufferAttribute(opacities, 1));
    geo.setAttribute('aPhase',   new Float32BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed',   new Float32BufferAttribute(speeds, 1));

    this._material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
      },
      vertexShader:   VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent:    true,
      depthWrite:     false,
      depthTest:      false,
      blending:       CustomBlending,
      blendSrc:       OneFactor,
      blendDst:       OneMinusSrcAlphaFactor,
      blendEquation:  AddEquation,
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
    const P    = new Matrix4().fromArray(options.projectionMatrix);
    const MVP  = new Matrix4().fromArray(options.modelViewProjectionMatrix);
    const PInv = new Matrix4().copy(P).invert();
    const MV   = new Matrix4().multiplyMatrices(PInv, MVP);

    // Strip translation so skybox stays at infinity
    const e = MV.elements;
    e[12] = 0; e[13] = 0; e[14] = 0;

    this._camera.projectionMatrix.multiplyMatrices(P, MV);

    // Reset Three.js GL state so it doesn't conflict with MapLibre
    const r = this._renderer;
    if (typeof r.resetState === 'function') r.resetState();
    else if (r.state && typeof r.state.reset === 'function') r.state.reset();

    this._renderer.render(this._scene, this._camera);

    // Request next frame for twinkling — throttled to ~24fps to reduce GPU load
    const now = performance.now();
    if (now - this._lastRepaintTime > 42) {
      this._lastRepaintTime = now;
      this._map?.triggerRepaint();
    }
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
    this._scene    = null;
    this._camera   = null;
    this._material = null;
    this._map      = null;
  }
}
