// WebGL renderer for the envelope flaps while they open.
//
// Each flap is a strip of quads running from its hinge to its tip. Every frame
// the strip is bent along a continuous curve (the tip lags the hinge, as paper
// does when lifted), projected with the same 1500px perspective as the page,
// and lit by a key light from the top-left: diffuse shading plus a soft
// specular sheen that travels across the paper as it turns. The flap's own
// baked artwork is the texture; its outline is cut in the shader, and the
// back face shows the ivory lining.

export type Side = 'top' | 'left' | 'right' | 'bottom'
export interface FlapState {
  /** Hinge angle in degrees (0 = flat, 180 = folded right back). */
  angle: number
  /** Extra bend in degrees between hinge and tip. */
  curl: number
  alpha: number
}

const ROWS = 48
const PERSPECTIVE = 1500

const VERT = `
precision highp float;
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aFlat;
uniform vec2 uView;
varying vec3 vNormal;
varying vec2 vFlat;
void main() {
  // Same projection as CSS perspective: 1500px, centred on the screen.
  vec2 c = uView * 0.5;
  float k = ${PERSPECTIVE.toFixed(1)} / (${PERSPECTIVE.toFixed(1)} - aPos.z);
  vec2 p = c + (aPos.xy - c) * k;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
  vNormal = aNormal;
  vFlat = aFlat;
}`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;
uniform vec2 uView;
uniform vec3 uTri0;
uniform vec3 uTri1;
uniform vec3 uTri2;
uniform float uAlpha;
varying vec3 vNormal;
varying vec2 vFlat;
float edge(vec2 a, vec2 b, vec2 p) { return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x); }
void main() {
  // Cut the flap's outline (the baked texture also holds its resting shadow).
  vec2 a = uTri0.xy, b = uTri1.xy, cc = uTri2.xy;
  float e0 = edge(a, b, vFlat), e1 = edge(b, cc, vFlat), e2 = edge(cc, a, vFlat);
  bool inside = (e0 >= 0.0 && e1 >= 0.0 && e2 >= 0.0) || (e0 <= 0.0 && e1 <= 0.0 && e2 <= 0.0);
  if (!inside) discard;
  vec3 n = normalize(vNormal);
  // Screen y runs down, so the strips' winding is reversed in clip space.
  bool front = !gl_FrontFacing;
  if (!front) n = -n;
  vec3 L = normalize(vec3(-0.45, -0.55, 0.85));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, H), 0.0), 36.0);
  // Scaled so a flat flap looks exactly like its baked artwork.
  float rest = max(dot(vec3(0.0, 0.0, 1.0), L), 0.0);
  float shade = 1.0 + 0.85 * (diff - rest);
  vec3 col;
  if (front) {
    vec4 t = texture2D(uTex, vFlat / uView);
    col = t.rgb * shade + vec3(1.0, 0.97, 0.88) * spec * 0.18;
  } else {
    col = vec3(0.965, 0.955, 0.92) * shade + vec3(1.0) * spec * 0.12;
  }
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}`

interface Flap {
  side: Side
  tri: [number, number][]
  tex: WebGLTexture | null
  buf: WebGLBuffer
  data: Float32Array
}

export interface FlapRenderer {
  render(states: Record<Side, FlapState>): void
  dispose(): void
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
  return s
}

/** Geometry of a flap: its hinge, the direction from hinge to tip, and its depth. */
function frame(side: Side, w: number, h: number) {
  switch (side) {
    case 'top': return { hingeA: [0, 0], hingeB: [w, 0], dir: [0, 1], depth: h * 0.56, tip: [w / 2, h * 0.56] }
    case 'bottom': return { hingeA: [w, h], hingeB: [0, h], dir: [0, -1], depth: h * 0.56, tip: [w / 2, h * 0.44] }
    case 'left': return { hingeA: [0, h], hingeB: [0, 0], dir: [1, 0], depth: w * 0.58, tip: [w * 0.58, h / 2] }
    case 'right': return { hingeA: [w, 0], hingeB: [w, h], dir: [-1, 0], depth: w * 0.58, tip: [w * 0.42, h / 2] }
  }
}

export function createFlapRenderer(canvas: HTMLCanvasElement, w: number, h: number, textures: Record<Side, HTMLImageElement>): FlapRenderer | null {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true })
  if (!gl) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  gl.viewport(0, 0, canvas.width, canvas.height)

  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link failed')
  gl.useProgram(prog)
  const loc = {
    pos: gl.getAttribLocation(prog, 'aPos'),
    normal: gl.getAttribLocation(prog, 'aNormal'),
    flat: gl.getAttribLocation(prog, 'aFlat'),
    view: gl.getUniformLocation(prog, 'uView'),
    tex: gl.getUniformLocation(prog, 'uTex'),
    tri: [gl.getUniformLocation(prog, 'uTri0'), gl.getUniformLocation(prog, 'uTri1'), gl.getUniformLocation(prog, 'uTri2')],
    alpha: gl.getUniformLocation(prog, 'uAlpha'),
  }
  gl.uniform2f(loc.view, w, h)
  gl.uniform1i(loc.tex, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)

  // Drawn back to front, the same stacking as the paper: bottom, left, right, top.
  const order: Side[] = ['bottom', 'left', 'right', 'top']
  const flaps: Flap[] = order.map((side) => {
    const f = frame(side, w, h)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[side])
    return {
      side,
      tri: [f.hingeA as [number, number], f.hingeB as [number, number], f.tip as [number, number]],
      tex,
      buf: gl.createBuffer()!,
      // Per vertex: position (3), normal (3), flat position (2).
      data: new Float32Array((ROWS + 1) * 2 * 8),
    }
  })

  /** Bends one flap: integrates the curl from hinge to tip, row by row. */
  const build = (fl: Flap, st: FlapState) => {
    const f = frame(fl.side, w, h)
    const [ax, ay] = f.hingeA, [bx, by] = f.hingeB, [dx, dy] = f.dir
    const ds = f.depth / ROWS
    let ox = 0, oy = 0, oz = 0
    const d = fl.data
    for (let r = 0; r <= ROWS; r++) {
      const u = r / ROWS
      // The tip lags the hinge: the angle falls off along the flap.
      const theta = ((st.angle - st.curl * Math.pow(u, 1.3)) * Math.PI) / 180
      const c = Math.cos(theta), s = Math.sin(theta)
      // Normal: perpendicular to the hinge and to the local direction of the paper.
      const nx = -dx * s, ny = -dy * s, nz = c
      for (let e = 0; e < 2; e++) {
        const hx = e ? bx : ax, hy = e ? by : ay
        const i = (r * 2 + e) * 8
        d[i] = hx + ox
        d[i + 1] = hy + oy
        d[i + 2] = oz
        d[i + 3] = nx
        d[i + 4] = ny
        d[i + 5] = nz
        d[i + 6] = hx + dx * u * f.depth
        d[i + 7] = hy + dy * u * f.depth
      }
      ox += dx * c * ds
      oy += dy * c * ds
      oz += s * ds
    }
  }

  return {
    render(states) {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      for (const fl of flaps) {
        const st = states[fl.side]
        if (st.alpha <= 0.001) continue
        build(fl, st)
        gl.bindBuffer(gl.ARRAY_BUFFER, fl.buf)
        gl.bufferData(gl.ARRAY_BUFFER, fl.data, gl.DYNAMIC_DRAW)
        gl.enableVertexAttribArray(loc.pos)
        gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 32, 0)
        gl.enableVertexAttribArray(loc.normal)
        gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, 32, 12)
        gl.enableVertexAttribArray(loc.flat)
        gl.vertexAttribPointer(loc.flat, 2, gl.FLOAT, false, 32, 24)
        fl.tri.forEach(([x, y], i) => gl.uniform3f(loc.tri[i], x, y, 0))
        gl.uniform1f(loc.alpha, st.alpha)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, fl.tex)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, (ROWS + 1) * 2)
      }
    },
    dispose() {
      flaps.forEach((fl) => {
        gl.deleteBuffer(fl.buf)
        gl.deleteTexture(fl.tex)
      })
      gl.deleteProgram(prog)
    },
  }
}
