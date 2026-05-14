import * as THREE from 'three';
import { extend } from '@react-three/fiber';

// Simplex 3D Noise by Ian McEwan, Ashima Arts
const snoise3 = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform sampler2D uTexture;
uniform float uBlur;
uniform float uThickness;
uniform float uAmplitude;
uniform float uSpeed;
uniform float uAudio;
uniform float uLiquify;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uFrequency;

varying vec2 vUv;

${snoise3}

void main() {
    vec2 uv = vUv;
    
    // Invert Y axis for canvas texture
    // uv.y = 1.0 - uv.y; 
    
    // Incorporate audio into speed and amplitude
    float currentSpeed = uSpeed + (uAudio * 2.0);
    float currentAmp = uAmplitude + (uAudio * 0.2);
    
    // Calculate noise for UV displacement
    float liquifyScale = 1.0 + uLiquify * 5.0;
    float noiseX = snoise(vec3(uv * liquifyScale, uTime * currentSpeed * 0.5));
    float noiseY = snoise(vec3(uv * liquifyScale + 100.0, uTime * currentSpeed * 0.5));
    
    // Distort UV coordinates
    vec2 distortedUV = uv + vec2(noiseX, noiseY) * currentAmp;
    
    // Read the distance field texture
    vec4 texColor = texture2D(uTexture, distortedUV);
    float d = texColor.r; // Value 0.0 to 1.0
    
    // If the pixel is completely outside the text area, return early with background
    if (d < 0.005) {
        // Base subtle background glow based on audio
        vec3 bg = uColor2 * max(0.0, snoise(vec3(uv * 1.5, uTime * 0.1))) * uAudio * 0.2;
        gl_FragColor = vec4(bg, 1.0);
        return;
    }
    
    // Generate contour rings based on distance (d)
    // uFrequency influences how many rings we can clearly see
    float freq = uFrequency; 
    float rings = fract(d * freq - uTime * currentSpeed * 2.0);
    
    float t = uThickness * 0.5;
    
    // Anti-aliased line drawing
    float lineAlpha = smoothstep(0.5 - t - 0.05, 0.5 - t, rings) 
                    - smoothstep(0.5 + t, 0.5 + t + 0.05, rings);
                    
    // Mask out the very outer edges to make it fade nicely
    float mask = smoothstep(0.01, 0.15, d);
    lineAlpha *= mask;
    
    // Mix colors based on distance to center and audio
    vec3 colorMix = mix(uColor1, uColor2, clamp(uAudio * 1.5 + (1.0 - d), 0.0, 1.0));
    vec3 glowColor = uColor2 * mask * d * clamp(uAudio, 0.2, 1.0) * 0.5;
    
    vec3 finalColor = colorMix * lineAlpha + glowColor;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

class DistortionMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: null },
        uBlur: { value: 0.5 },
        uThickness: { value: 0.2 },
        uAmplitude: { value: 0.1 },
        uSpeed: { value: 1.0 },
        uAudio: { value: 0.0 },
        uLiquify: { value: 0.5 },
        uFrequency: { value: 20.0 },
        uColor1: { value: new THREE.Color('#ffffff') },
        uColor2: { value: new THREE.Color('#ff3366') } // Adjust this based on audio later
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.NormalBlending
    });
  }

  get uTime() { return this.uniforms.uTime.value; }
  set uTime(v) { this.uniforms.uTime.value = v; }

  get uTexture() { return this.uniforms.uTexture.value; }
  set uTexture(v) { this.uniforms.uTexture.value = v; }

  get uBlur() { return this.uniforms.uBlur.value; }
  set uBlur(v) { this.uniforms.uBlur.value = v; }

  get uThickness() { return this.uniforms.uThickness.value; }
  set uThickness(v) { this.uniforms.uThickness.value = v; }

  get uAmplitude() { return this.uniforms.uAmplitude.value; }
  set uAmplitude(v) { this.uniforms.uAmplitude.value = v; }

  get uSpeed() { return this.uniforms.uSpeed.value; }
  set uSpeed(v) { this.uniforms.uSpeed.value = v; }

  get uAudio() { return this.uniforms.uAudio.value; }
  set uAudio(v) { this.uniforms.uAudio.value = v; }

  get uLiquify() { return this.uniforms.uLiquify.value; }
  set uLiquify(v) { this.uniforms.uLiquify.value = v; }

  get uFrequency() { return this.uniforms.uFrequency.value; }
  set uFrequency(v) { this.uniforms.uFrequency.value = v; }

  get uColor1() { return this.uniforms.uColor1.value; }
  set uColor1(v) { this.uniforms.uColor1.value = v; }

  get uColor2() { return this.uniforms.uColor2.value; }
  set uColor2(v) { this.uniforms.uColor2.value = v; }
}

extend({ DistortionMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      distortionMaterial: any;
    }
  }
}
