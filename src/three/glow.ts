import * as THREE from 'three';

/**
 * Energy material used by the ribbons and platform rings.
 * - Fresnel falloff gives a soft luminous tube without post-processing.
 * - uDraw reveals the tube along its length (entrance animation).
 * - With `morph`, vertices blend between two tube shapes (3D swirl -> ground route).
 */
export function createGlowMaterial({ morph = false, halo = false } = {}) {
  const uniforms = {
    uTime: { value: 0 },
    uDraw: { value: 1 },
    uMorph: { value: 0 },
    uPower: { value: 1 },
    uIntensity: { value: 1 },
    uFlow: { value: 1 },
    uCore: { value: new THREE.Color('#ffffff') },
    uGlow: { value: new THREE.Color('#8EB69B') },
    uStreak: { value: new THREE.Color('#ffffff') },
  };
  const vertexShader = /* glsl */ `
    ${morph ? 'attribute vec3 aPosB; attribute vec3 aNormB;' : ''}
    uniform float uMorph;
    varying vec2 vUv;
    varying vec3 vN;
    varying vec3 vV;
    void main() {
      vec3 p = position;
      vec3 n = normal;
      ${morph ? 'float m = smoothstep(0.0, 1.0, uMorph); p = mix(position, aPosB, m); n = normalize(mix(normal, aNormB, m));' : ''}
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vV = normalize(-mv.xyz);
      vN = normalize(normalMatrix * n);
      vUv = uv;
      gl_Position = projectionMatrix * mv;
    }
  `;
  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uDraw;
    uniform float uPower;
    uniform float uIntensity;
    uniform float uFlow;
    uniform vec3 uCore;
    uniform vec3 uGlow;
    uniform vec3 uStreak;
    varying vec2 vUv;
    varying vec3 vN;
    varying vec3 vV;
    void main() {
      float along = vUv.x;
      if (along > uDraw + 0.001) discard;
      float facing = clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
      float body = ${halo ? 'pow(facing, 2.2) * 0.42' : 'pow(facing, 0.55)'};
      float streak = smoothstep(0.80, 1.0, fract(along * 5.0 - uTime * 0.42 * uFlow));
      float shimmer = 0.78 + 0.22 * sin(along * 70.0 - uTime * 5.0 * uFlow);
      float headGlow = smoothstep(uDraw - 0.07, uDraw, along) * step(uDraw, 0.995);
      float ends = smoothstep(0.0, 0.015, along);
      float a = body * (shimmer + streak * 1.3 + headGlow * 2.4) * ends * uIntensity * uPower;
      vec3 col = mix(uGlow, uCore, clamp(headGlow + ${halo ? '0.0' : 'facing * 0.65'}, 0.0, 1.0));
      col = mix(col, uStreak, streak * 0.85);
      gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      #include <colorspace_fragment>
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return material;
}

export type GlowMaterial = ReturnType<typeof createGlowMaterial>;

/** Tube that can morph between two curves. Both tubes use identical segment counts. */
export function createMorphTube(a: THREE.Curve<THREE.Vector3>, b: THREE.Curve<THREE.Vector3>, segs: number, rA: number, rB: number, radial = 10) {
  const ga = new THREE.TubeGeometry(a, segs, rA, radial, false);
  const gb = new THREE.TubeGeometry(b, segs, rB, radial, false);
  ga.setAttribute('aPosB', gb.getAttribute('position'));
  ga.setAttribute('aNormB', gb.getAttribute('normal'));
  gb.dispose();
  return ga;
}

/** Soft round sprite points (sparks travelling along the ribbon, ambient dust). */
export function createPointsMaterial(color: string, additive: boolean) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 }, uScale: { value: 300 } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      uniform float uScale;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
        vAlpha = aAlpha;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, a * a * vAlpha * uOpacity);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}
