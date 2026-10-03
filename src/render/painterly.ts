import * as THREE from 'three';
import { uniforms } from './look';

const VERT = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor, uLightDir, uLightColor, uAmbient, uRim, uFogColor;
uniform float uFogNear, uFogFar, uGrain;
varying vec3 vN; varying vec3 vW;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vW);
  float ndl = dot(n, uLightDir);
  float wrap = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
  float ramp = mix(wrap, floor(wrap * 4.0) / 4.0, 0.45);   // painted colour steps
  vec3 col = uColor * (uAmbient + uLightColor * ramp);
  float rim = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0) * smoothstep(-0.2, 0.6, ndl);
  col += uRim * rim * 0.35;
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.035 * uGrain;  // hand-made grain
  float fd = max(length(cameraPosition - vW) - uFogNear, 0.0) / max(uFogFar - uFogNear, 0.001);
  float f = 1.0 - exp(-fd * fd * 3.0); // exponential mist
  gl_FragColor = vec4(mix(col, uFogColor, f), 1.0);
  #include <colorspace_fragment>
}`;

export function painterlyMaterial(color: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ uniforms: { ...uniforms, uColor: { value: new THREE.Color(color) } }, vertexShader: VERT, fragmentShader: FRAG });
}
