// Texture upload/alpha conventions: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
// One transparent texture, one full-screen triangle; no overlaid magnifier or image duplication.
const vertexSource = `
  attribute vec2 position;
  varying vec2 uv;
  void main() {
    uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
    gl_Position = vec4(position, 0., 1.);
  }
`;
const fragmentSource = `
  precision highp float;
  uniform sampler2D logo;
  uniform vec2 size;
  uniform vec2 pointer;
  uniform float padding;
  uniform float radius;
  uniform float strength;
  varying vec2 uv;
  void main() {
    vec2 point = uv * (size + 2. * padding) - padding;
    vec2 delta = point - pointer;
    float distance = clamp(length(delta) / radius, 0., 1.);
    // Smooth at both the center and rim: the center enlarges without a hard lens edge.
    float influence = pow(1. - distance * distance, 3.);
    vec2 sampleUv = (point - delta * strength * influence) / size;
    if (any(lessThan(sampleUv, vec2(0.))) || any(greaterThan(sampleUv, vec2(1.)))) {
      gl_FragColor = vec4(0.);
    } else {
      gl_FragColor = texture2D(logo, sampleUv);
    }
  }
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) {
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex); gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex); gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function uploadLogo(gl: WebGLRenderingContext, image: HTMLImageElement) {
  // Rasterize SVG at 3x intrinsic size so the expanded contour remains crisp on Retina.
  const raster = document.createElement('canvas');
  raster.width = image.naturalWidth * 3; raster.height = image.naturalHeight * 3;
  raster.getContext('2d')!.drawImage(image, 0, 0, raster.width, raster.height);
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster);
  for (const axis of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, axis, gl.CLAMP_TO_EDGE);
  for (const filter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, filter, gl.LINEAR);
  return texture;
}

export function createLogoBulge(canvas: HTMLCanvasElement, image: HTMLImageElement, paddingRatio: number) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const program = createProgram(gl);
  if (!program) { gl.getExtension('WEBGL_lose_context')?.loseContext(); return null; }
  gl.useProgram(program);
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = uploadLogo(gl, image);
  const uniforms = Object.fromEntries(['size', 'pointer', 'padding', 'radius', 'strength'].map(name => [name, gl.getUniformLocation(program, name)]));
  return {
    resize(width: number, height: number) {
      const padding = width * paddingRatio;
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round((width + 2 * padding) * dpr);
      canvas.height = Math.round((height + 2 * padding) * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.size, width, height);
      gl.uniform1f(uniforms.padding, padding);
    },
    draw(x: number, y: number, radius: number, strength: number) {
      gl.uniform2f(uniforms.pointer, x, y);
      gl.uniform1f(uniforms.radius, radius);
      gl.uniform1f(uniforms.strength, strength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
