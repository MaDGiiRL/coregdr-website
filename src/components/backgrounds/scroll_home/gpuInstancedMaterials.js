import * as THREE from "three";

export function makeNeonShaderMaterial({ palette }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uOffset: { value: 0 },        // offset “dz accumulato”
      uRoadLoop: { value: 200 },
      uZStart: { value: 18 },
      uY: { value: 0.03 },

      uBlue: { value: new THREE.Color(palette.blue) },
      uViolet: { value: new THREE.Color(palette.violet) },
      uPink: { value: new THREE.Color(palette.pink) },

      uEmissive: { value: 1.2 },
      uAlpha: { value: 1.0 },
    },
    vertexShader: `
      attribute float aX;
      attribute float aZ0;
      attribute float aLen;
      attribute float aTint; // 0 blue, 1 violet, 2 pink

      varying float vTint;
      varying float vGlow;

      uniform float uTime;
      uniform float uOffset;
      uniform float uRoadLoop;
      uniform float uZStart;
      uniform float uY;

      // wrap z in range [-uRoadLoop, uZStart)
      float wrapZ(float z){
        float L = uRoadLoop + uZStart;
        return mod(z + uRoadLoop, L) - uRoadLoop;
      }

      void main() {
        vTint = aTint;

        float z = wrapZ(aZ0 + uOffset);

        // geometry is already rotated flat: its local Y becomes “length axis”
        vec3 p = position;
        p.y *= aLen;

        // a little shimmer to help bloom feel alive (cheap)
        float shimmer = 0.85 + 0.15 * sin(uTime * 8.0 + aZ0 * 0.15);
        vGlow = shimmer;

        vec3 world = vec3(aX, uY, z) + p;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying float vTint;
      varying float vGlow;

      uniform vec3 uBlue;
      uniform vec3 uViolet;
      uniform vec3 uPink;
      uniform float uEmissive;
      uniform float uAlpha;

      void main() {
        vec3 c = (vTint < 0.5) ? uBlue : (vTint < 1.5 ? uViolet : uPink);

        // emissive look (Bloom picks up bright pixels)
        vec3 col = c * (uEmissive * vGlow);

        gl_FragColor = vec4(col, uAlpha);
      }
    `,
  });
}

export function makeBuildingShaderMaterial({ palette, buildingTex }) {
  return new THREE.ShaderMaterial({
    transparent: false,
    uniforms: {
      uOffset: { value: 0 },
      uRoadLoop: { value: 200 },
      uZStart: { value: 18 },
      uTex: { value: buildingTex },

      uDark: { value: new THREE.Color(palette.bDark) },
      uCool: { value: new THREE.Color(palette.bCool) },
      uViolet: { value: new THREE.Color(palette.violet) },
      uBlue: { value: new THREE.Color(palette.blue) },

      uCoolEmissive: { value: 0.22 },
    },
    vertexShader: `
      attribute float aX;
      attribute float aZ0;
      attribute float aW;
      attribute float aH;
      attribute float aD;
      attribute float aCool; // 0 or 1
      attribute float aSide; // 0 left / 1 right

      varying vec2 vUv;
      varying float vCool;
      varying float vSide;

      uniform float uOffset;
      uniform float uRoadLoop;
      uniform float uZStart;

      float wrapZ(float z){
        float L = uRoadLoop + uZStart;
        return mod(z + uRoadLoop, L) - uRoadLoop;
      }

      void main() {
        vUv = uv;
        vCool = aCool;
        vSide = aSide;

        float z = wrapZ(aZ0 + uOffset);

        vec3 p = position;
        p.x *= aW;
        p.y *= aH;
        p.z *= aD;

        // place building: y centered at half height
        vec3 world = vec3(aX, aH * 0.5, z) + p;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      varying float vCool;
      varying float vSide;

      uniform sampler2D uTex;

      uniform vec3 uDark;
      uniform vec3 uCool;
      uniform vec3 uViolet;
      uniform vec3 uBlue;
      uniform float uCoolEmissive;

      void main() {
        vec3 tex = texture2D(uTex, vUv).rgb;

        vec3 base = mix(uDark, uCool, vCool);

        // tiny emissive edge bias depending on side (helps bloom without heavy lights)
        vec3 emiss = (vSide < 0.5) ? uViolet : uBlue;

        vec3 col = base * (0.65 + 0.35 * tex) + emiss * (uCoolEmissive * vCool);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
