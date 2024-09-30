import tex from "./2x.png"


class PingPong {
  index: number;
  textures: WebGLTexture[]
  framebuffers: WebGLFramebuffer[]
  width: number
  height: number
  gl: WebGL2RenderingContext
  constructor(gl: WebGL2RenderingContext, width: number, height: number) {
    this.gl = gl
    this.width = width
    this.height = height
    this.index = 0
    this.textures = []
    this.framebuffers = []

    for (let i = 0; i < 2; i++) {
      this.textures[i] = setupTexture(0, width, height)
      this.framebuffers[i] = setupFramebuffer(this.textures[i])
    }
  }
  bindFramebufferOnly() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffers[this.index])
    this.gl.viewport(0, 0, this.width, this.height)
    this.index = (this.index + 1) % 2
  }
  bindNextFramebufferAndTexture() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffers[this.index]) // set which framebuffer to render to
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[(this.index + 1) % 2])
    this.gl.viewport(0, 0, this.width, this.height)
    this.index = (this.index + 1) % 2
  }
}

const vs = `#version 300 es

uniform float u_FlipY;

in vec2 a_Position;
in vec2 a_Texcoord;

out vec2 v_Texcoord;

void main(){
  v_Texcoord = a_Texcoord;
  vec2 position = vec2((a_Position.x*2.0-1.0),-a_Position.y*2.0+1.0);
  gl_Position = vec4(position.x,u_FlipY*position.y,0,1);
}
`

const fs = `#version 300 es
precision highp float;

uniform sampler2D u_Texture;
uniform float u_Kernel[9];
uniform float u_KernelWeight;

in vec2 v_Texcoord;

out vec4 color;

void main(){

  vec2 onePixel = 1.0/vec2(textureSize(u_Texture,0));

  vec4 colorSum = texture(u_Texture,v_Texcoord+onePixel*vec2(-1,-1))*u_Kernel[0]
  +texture(u_Texture,v_Texcoord+onePixel*vec2(-1,0))*u_Kernel[1]
  +texture(u_Texture,v_Texcoord+onePixel*vec2(-1,1))*u_Kernel[2]
  +texture(u_Texture,v_Texcoord+onePixel*vec2(0,-1))*u_Kernel[3]
  +texture(u_Texture,v_Texcoord+onePixel*vec2(0,0))*u_Kernel[4]
  +texture(u_Texture,v_Texcoord+onePixel*vec2(0,1))*u_Kernel[5]
  +texture(u_Texture,v_Texcoord+onePixel*vec2(1,-1))*u_Kernel[6]
  +texture(u_Texture,v_Texcoord+onePixel*vec2(1,0))*u_Kernel[7]
  +texture(u_Texture,v_Texcoord+onePixel*vec2(1,1))*u_Kernel[8];
   
  color = vec4(colorSum.rgb/u_KernelWeight,1.0);
}
`
//texture(u_Texture,v_Texcoord);
/* 
          (
          texture(u_Texture,v_Texcoord+onePixel*vec2(-1,-1))
          +texture(u_Texture,v_Texcoord+onePixel*vec2(-1,0))
          +texture(u_Texture,v_Texcoord+onePixel*vec2(-1,1))
          +texture(u_Texture,v_Texcoord+onePixel*vec2(0,-1))
          +texture(u_Texture,v_Texcoord+onePixel*vec2(0,0))
          +texture(u_Texture,v_Texcoord+onePixel*vec2(0,1))
          +texture(u_Texture,v_Texcoord+onePixel*vec2(1,-1))
          +texture(u_Texture,v_Texcoord+onePixel*vec2(1,0))
          +texture(u_Texture,v_Texcoord+onePixel*vec2(1,1))
          )/9.0;
*/


// Canvas init
const canvas = document.createElement("canvas")
document.body.append(canvas)
canvas.width = 300
canvas.height = 300

// gl init
const gl = createWebglContext(canvas)
gl.clearColor(255, 255, 255, 255)
gl.clear(gl.COLOR_BUFFER_BIT)

// program init
const program = createProgram(vs, fs)
const a_PositionLocation = gl.getAttribLocation(program, "a_Position")
const a_TexcoordLocation = gl.getAttribLocation(program, "a_Texcoord")
const u_KernelLocation = gl.getUniformLocation(program, "u_Kernel[0]") //!@#!@#!@# idk
const u_KernelWeightLocation = gl.getUniformLocation(program, "u_KernelWeight")
const u_FlipYLocation = gl.getUniformLocation(program, "u_FlipY")

// buffer
const position = [
  0, 0,
  1, 0,
  1, 1,
  0, 0,
  1, 1,
  0, 1
]
const texcoord = [
  0, 0,
  1, 0,
  1, 1,
  0, 0,
  1, 1,
  0, 1
]

// SETUP BUFFERS AND ATTRIBUTES
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW)
gl.vertexAttribPointer(a_PositionLocation, 2, gl.FLOAT, false, 0, 0)
gl.enableVertexAttribArray(a_PositionLocation)

const texcoordBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoord), gl.STATIC_DRAW)
gl.vertexAttribPointer(a_TexcoordLocation, 2, gl.FLOAT, false, 0, 0)
gl.enableVertexAttribArray(a_TexcoordLocation)




// TEXTURES
const texture = gl.createTexture()
gl.activeTexture(gl.TEXTURE0) //UNNEC
gl.bindTexture(gl.TEXTURE_2D, texture)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]))
// gl.generateMipmap(gl.TEXTURE_2D)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)


const img = new Image()
img.src = tex
img.onerror = (err) => {
  console.log("err", err)
}
img.onload = () => {
  console.log("img loaded")
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  gl.generateMipmap(gl.TEXTURE_2D)

  canvas.width = img.width
  canvas.height = img.height
  canvas.style.width = `${canvas.width}px`
  canvas.style.height = `${canvas.height}px`
  gl.viewport(0, 0, canvas.width, canvas.height)

  draw()
}

async function draw() {
  gl.useProgram(program)
  const sharpnessMag = 0// 0.25 (if jpeg), 0.8
  const kernel = [
    -sharpnessMag / 8, -sharpnessMag / 8, -sharpnessMag / 8,
    -sharpnessMag / 8, sharpnessMag + 1, -sharpnessMag / 8,
    -sharpnessMag / 8, -sharpnessMag / 8, -sharpnessMag / 8,
  ]
  const kernelWeight = 1
  gl.uniform1fv(u_KernelLocation, kernel)
  gl.uniform1f(u_KernelWeightLocation, kernelWeight)
  gl.uniform1f(u_FlipYLocation, 1)
  console.log("getKernelWeight", kernelWeight)
  // // draw arrays
  gl.drawArrays(gl.TRIANGLES, 0, position.length / 2)



  const originalTexture = setupTexture(0, img.clientWidth, img.clientHeight, img)

  const pingPong = new PingPong(gl, canvas.clientWidth, canvas.clientHeight)
  pingPong.bindFramebufferOnly()

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, originalTexture)



  // START DRAWING!!!
  gl.uniform1f(u_FlipYLocation, -1)
  gl.drawArrays(gl.TRIANGLES, 0, position.length / 2)
  for (let i = 0; i < 1; i++) {
    pingPong.bindNextFramebufferAndTexture()
    gl.drawArrays(gl.TRIANGLES, 0, position.length / 2)
  }
  gl.uniform1f(u_FlipYLocation, 1)



  // gl.activeTexture(gl.TEXTURE0)
  // gl.bindTexture(gl.TEXTURE_2D, originalTexture)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  // // draw arrays
  gl.drawArrays(gl.TRIANGLES, 0, position.length / 2)
}

// function getKernelWeight(kernel: number[]) {
//   const kernelWeight = kernel.reduce((pre, cur) => pre + cur)
//   console.log("asdkernelWeight", kernelWeight)
//   return kernelWeight <= 0 ? 1 : kernelWeight
// }


/* HELPER FUNCTIONS */
function setupFramebuffer(texture: WebGLTexture) {
  const framebuffer = gl.createFramebuffer()
  if (!framebuffer) throw new Error("ERROR: framebuffer was null!")
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

  // setup framebuffer data
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  return framebuffer
}
console.log("gl.getParameter(gl.MAX_COLOR_ATTACHMENTS)", gl.getParameter(gl.MAX_COLOR_ATTACHMENTS))

function setupTexture(textureUnit: number, initWidth: number, initHeight: number, imgElement?: HTMLImageElement) {

  gl.activeTexture(textureUnit)

  const texture = gl.createTexture()
  if (!texture) throw new Error("ERROR: texture was null!")
  gl.bindTexture(gl.TEXTURE_2D, texture)

  // Params
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // Load temporary image
  if (imgElement) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgElement)
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, initWidth, initHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  }

  return texture
}

function createWebglContext(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true })
  if (!gl) throw new Error("ERROR: couldn't load webgl context")
  return gl
}
function createProgram(vs: string, fs: string) {
  const program = gl.createProgram()
  if (!program) throw Error("Error: could not create program")
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vs))
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(program)
  gl.validateProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Error: could not link program. Info: " + gl.getProgramInfoLog(program))
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) throw new Error("Error: could not validate program. Info: " + gl.getProgramInfoLog(program))

  return program
}
function createShader(shaderType: typeof gl.FRAGMENT_SHADER | typeof gl.VERTEX_SHADER, shaderSource: string) {
  const shader = gl.createShader(shaderType)
  if (!shader) throw new Error("Error: could not create shader of type: " + gl.FRAGMENT_SHADER)
  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Error: when compiling shaders. Info: " + gl.getShaderInfoLog(shader))
  return shader
}
