// js/mannequin-3d.js
// Minimal WebGL renderer for the character preview mannequin.
//
// Draws one static, unrigged mesh (assets/mannequin.mesh, produced offline
// from the Mixamo FBX) into an offscreen canvas, which the page then blits
// into its own 2D canvas. Keeping the 3D pass off to the side is what lets
// the description text, the PNG export and the history thumbnails go on
// working against a single 2D canvas.
//
// Raw WebGL on purpose: the project ships no 3D library and adding one for a
// single lit mesh would cost more than the mesh itself.
"use strict";

(() => {
  // ── Mesh binary ─────────────────────────────────────────────────
  // 'GMSH' | version u16 | flags u16 | vertCount u32 | indexCount u32 |
  // bboxMin f32[3] | bboxMax f32[3] | pos u16[3V] | normal i8[4V] | idx u16[I]
  const HEADER_BYTES = 40;
  const MAGIC = 0x48534d47; // 'GMSH' little-endian

  const VERT_SRC = `
    attribute vec3 aPos;
    attribute vec3 aNor;
    uniform mat4 uMVP;
    uniform mat4 uModel;
    uniform vec3 uQScale;
    uniform vec3 uQOffset;
    varying vec3 vNor;
    void main() {
      vec3 p = aPos * uQScale + uQOffset;
      vNor = mat3(uModel) * aNor;
      gl_Position = uMVP * vec4(p, 1.0);
    }
  `;

  // Three-point studio light in world space, so the lighting stays put while
  // the figure turns instead of sliding around with it.
  const FRAG_SRC = `
    precision mediump float;
    varying vec3 vNor;
    const vec3 KEY = vec3(-0.550, 0.620, -0.560);
    const vec3 FILL = vec3(0.720, 0.220, -0.620);
    const vec3 RIM = vec3(0.350, 0.350, 0.860);
    // Tuned so a lit surface lands on roughly #757575: the shader multiplies
    // this by the light sum and then gamma-encodes, so the albedo sits well
    // below the target grey.
    const vec3 ALBEDO = vec3(0.198, 0.200, 0.205);
    void main() {
      vec3 n = normalize(vNor);
      float key = max(dot(n, normalize(KEY)), 0.0);
      float fill = max(dot(n, normalize(FILL)), 0.0);
      float rim = max(dot(n, normalize(RIM)), 0.0);
      float up = clamp(0.5 + 0.5 * n.y, 0.0, 1.0);

      // Rasterising gives no ambient occlusion or cast shadows, so the same
      // light rig that reads as grey plastic in a ray marcher washes out here.
      // The levels below are pulled down to land back on a mid grey.
      vec3 col = ALBEDO * (
          (0.20 + 0.10 * up) * vec3(0.80, 0.84, 0.94)
        + 0.80 * key * vec3(1.00, 0.99, 0.96)
        + 0.18 * fill * vec3(0.86, 0.90, 1.00)
        + 0.10 * rim * rim * vec3(0.92, 0.95, 1.00)
      );

      // Wide, weak highlight: matte plastic rather than gloss.
      vec3 h = normalize(normalize(KEY) + vec3(0.0, 0.0, -1.0));
      col += 0.10 * pow(max(dot(n, h), 0.0), 22.0);

      gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
    }
  `;

  // ── mat4 helpers (column-major, as WebGL wants them) ────────────
  function perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    // prettier-ignore
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }

  function rotationY(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    // prettier-ignore
    return new Float32Array([
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ]);
  }

  /** View matrix for a camera on the -z side looking at (0, targetY, 0). */
  function viewMatrix(targetY, dist) {
    // Camera basis: right = +x, up = +y, forward (eye -> target) = +z, so the
    // eye-space -z axis the projection expects is world -z.
    // prettier-ignore
    return new Float32Array([
      -1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, -1, 0,
      0, -targetY, -dist, 1,
    ]);
  }

  function multiply(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k];
        out[c * 4 + r] = sum;
      }
    }
    return out;
  }

  // ── Renderer ────────────────────────────────────────────────────
  class Mannequin3D {
    constructor(width, height) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = width;
      this.canvas.height = height;
      this.ready = false;
      this.gl = null;

      const opts = { antialias: true, alpha: true, premultipliedAlpha: false, depth: true };
      const gl = this.canvas.getContext("webgl", opts) || this.canvas.getContext("experimental-webgl", opts);
      if (!gl) return; // caller falls back to the flat image

      this.gl = gl;
      this.canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        this.ready = false;
      });

      const program = this._buildProgram(gl);
      if (!program) {
        this.gl = null;
        return;
      }
      this.program = program;
      this.loc = {
        aPos: gl.getAttribLocation(program, "aPos"),
        aNor: gl.getAttribLocation(program, "aNor"),
        uMVP: gl.getUniformLocation(program, "uMVP"),
        uModel: gl.getUniformLocation(program, "uModel"),
        uQScale: gl.getUniformLocation(program, "uQScale"),
        uQOffset: gl.getUniformLocation(program, "uQOffset"),
      };
    }

    _buildProgram(gl) {
      const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          console.warn("mannequin-3d: shader failed", gl.getShaderInfoLog(sh));
          return null;
        }
        return sh;
      };
      const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
      if (!vs || !fs) return null;

      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn("mannequin-3d: link failed", gl.getProgramInfoLog(prog));
        return null;
      }
      return prog;
    }

    /** Fetches and uploads the mesh. Resolves to true when it can draw. */
    async load(url) {
      const gl = this.gl;
      if (!gl) return false;
      let buf;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        buf = await res.arrayBuffer();
      } catch (err) {
        console.warn("mannequin-3d: mesh not loaded", err);
        return false;
      }

      const dv = new DataView(buf);
      if (buf.byteLength < HEADER_BYTES || dv.getUint32(0, true) !== MAGIC) {
        console.warn("mannequin-3d: not a GMSH mesh");
        return false;
      }
      const vCount = dv.getUint32(8, true);
      const iCount = dv.getUint32(12, true);
      const bmin = [dv.getFloat32(16, true), dv.getFloat32(20, true), dv.getFloat32(24, true)];
      const bmax = [dv.getFloat32(28, true), dv.getFloat32(32, true), dv.getFloat32(36, true)];

      const vertBytes = 6 * vCount + 4 * vCount;
      if (buf.byteLength < HEADER_BYTES + vertBytes + 2 * iCount) {
        console.warn("mannequin-3d: mesh truncated");
        return false;
      }

      this.vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(buf, HEADER_BYTES, vertBytes), gl.STATIC_DRAW);

      this.ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint8Array(buf, HEADER_BYTES + vertBytes, 2 * iCount),
        gl.STATIC_DRAW
      );

      this.indexCount = iCount;
      this.normalOffset = 6 * vCount;
      // Positions arrive as 0..1 (normalised u16) and are stretched back over
      // the bounding box in the vertex shader.
      this.qScale = new Float32Array([bmax[0] - bmin[0], bmax[1] - bmin[1], bmax[2] - bmin[2]]);
      this.qOffset = new Float32Array(bmin);
      this.height = bmax[1] - bmin[1];
      this.ready = true;
      return true;
    }

    /**
     * Renders the figure into the offscreen canvas.
     * @param {{yaw:number, heightFrac:number, feetFrac:number}} view
     *   heightFrac: figure height as a share of the canvas height.
     *   feetFrac: where the soles sit, as a share of the canvas height.
     */
    render(view) {
      const gl = this.gl;
      if (!gl || !this.ready) return false;

      const W = this.canvas.width;
      const H = this.canvas.height;
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE); // imported meshes are not reliably wound
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Frame the figure: pick the vertical field of view so the mesh covers
      // heightFrac of the canvas, then aim the camera so the soles land on
      // feetFrac. A long lens keeps the perspective mild, like a studio shot.
      const dist = 6.0;
      const visible = this.height / Math.max(view.heightFrac, 0.05);
      const targetY = (view.feetFrac - 0.5) * visible;
      const fovY = 2 * Math.atan(visible / 2 / dist);

      const model = rotationY(view.yaw);
      const mvp = multiply(multiply(perspective(fovY, W / H, 0.1, 40), viewMatrix(targetY, dist)), model);

      gl.useProgram(this.program);
      gl.uniformMatrix4fv(this.loc.uMVP, false, mvp);
      gl.uniformMatrix4fv(this.loc.uModel, false, model);
      gl.uniform3fv(this.loc.uQScale, this.qScale);
      gl.uniform3fv(this.loc.uQOffset, this.qOffset);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.enableVertexAttribArray(this.loc.aPos);
      gl.vertexAttribPointer(this.loc.aPos, 3, gl.UNSIGNED_SHORT, true, 6, 0);
      gl.enableVertexAttribArray(this.loc.aNor);
      gl.vertexAttribPointer(this.loc.aNor, 3, gl.BYTE, true, 4, this.normalOffset);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
      return true;
    }
  }

  window.GumaMannequin3D = {
    /** @returns {?Mannequin3D} null when the browser has no usable WebGL. */
    create(width, height) {
      const m = new Mannequin3D(width, height);
      return m.gl ? m : null;
    },
  };
})();
