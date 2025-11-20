import { findMarkers, flattenImg, findObjects, findObjectsCircle } from "./CV-Utils"

const REQD_BG_MARKERS = [
    10, // Top left 
    11, // Top right
    12, // Bottom right
    13 // Bottom left
]

const OBJECT_MARKER_SCALE = 3.9
const OBJECT_ID_RANGE = [100, 120]

// Gets ImageData Frame, converts it to img Mat and checks
export const checkMarkers = (frame, markers) => {
  const img = cv.matFromImageData(frame)
  findMarkers(img, markers)

  let found = true
  REQD_BG_MARKERS.map((val) => {
    found = markers.has(val) ? found : false   
  })

  // if (found && captureType === 'scene') markBackground(img, markers)
  // if (captureType === 'keyframe') markObjects(img, markers)
  // markObjects(img, markers)
  
  // Copy img to frame ImageData
  frame.data.set(img.data)

  img.delete()
  return found
}

export const highlightBg = (ctx, markers) => {
  if (markers == null || markers.size < 4) return 
  // console.log(markers)

  ctx.fillStyle = '#C2D2F2AA'
  ctx.beginPath()
  ctx.moveTo(markers.get(10).tl.x, markers.get(10).tl.y)
  ctx.lineTo(markers.get(11).tl.x, markers.get(11).tl.y)
  ctx.lineTo(markers.get(12).tl.x, markers.get(12).tl.y)
  ctx.lineTo(markers.get(13).tl.x, markers.get(13).tl.y)
  ctx.lineTo(markers.get(10).tl.x, markers.get(10).tl.y)
  ctx.fill()
}

export const highlightObjects = (ctx, markers) => {
  if (markers == null || markers.size < 4) return

  ctx.fillStyle = '#F2B950AA'

  ctx.beginPath() 
  markers.forEach((markerCorners, markerId) => {
    if (markerId >= OBJECT_ID_RANGE[0] && markerId <= OBJECT_ID_RANGE[1]) {
      // Find object center and size 
      let objCenter = {
        x: markerCorners.tl.x + OBJECT_MARKER_SCALE * 0.5 * (markerCorners.br.x - markerCorners.tl.x),
        y: markerCorners.tl.y + OBJECT_MARKER_SCALE * 0.5 * (markerCorners.br.y - markerCorners.tl.y)
      }

      let objRadius = Math.hypot(markerCorners.tr.x - markerCorners.tl.x, markerCorners.tr.y - markerCorners.tl.y) * 2

      ctx.arc(objCenter.x, objCenter.y, objRadius, 0, Math.PI * 2)
      ctx.fill()

    }
  })
}

export const captureBg = (frame, markers, width, height) => {
  let img = cv.matFromImageData(frame)
  let bg = new cv.Mat()

  const corners = {
    tl : markers.get(10).tl,
    tr : markers.get(11).tl,
    br : markers.get(12).tl,
    bl : markers.get(13).tl
  }
  let _ = flattenImg(img, bg, corners, width, height)

  let bgImgData = new ImageData(new Uint8ClampedArray(bg.data), bg.cols, bg.rows)
  
  img.delete()
  bg.delete()

  return bgImgData
}

export const addSprites = (frame, markers, width, height) => {
  let img = cv.matFromImageData(frame)
  let flat = new cv.Mat()

  // Flatten image with margin to detect off-boundary objects
  const corners = {
    tl : markers.get(10).tl,
    tr : markers.get(11).tl,
    br : markers.get(12).tl,
    bl : markers.get(13).tl
  }
  let M = flattenImg(img, flat, corners, width, height, true)

  // console.log(`Original markers: `)
  // console.log(markers)

  // // Detect objects again in flattened image
  // markers.clear()
  // findMarkers(flat, markers)

  // console.log(`Flattened markers: `)
  // console.log(markers)

  // Find objects in flattened image
  // let objects = new Map()
  let sprites = findObjectsCircle(flat, markers, M)

  // let captureImgData = new ImageData(new Uint8ClampedArray(flat.data), flat.cols, flat.rows)

  img.delete()
  flat.delete()

  return sprites
}

export const renderKeyframeSprites = (frameCtx, sprites) => {
  // console.log('Rendering sprites: ', sprites)

  Object.values(sprites).forEach((sprite) => {
    const spriteCanvas = document.createElement('canvas')
    spriteCanvas.width = sprite.img.width
    spriteCanvas.height = sprite.img.height
    const spriteCtx = spriteCanvas.getContext('2d')

    // console.log('Rendering sprite with size: ', sprite.img.width, sprite.img.height)
    // console.log('Recorded size: ', sprite.size, sprite.size)
    spriteCtx.putImageData(sprite.img, 0, 0)
    frameCtx.drawImage(spriteCanvas, sprite.pos.x, sprite.pos.y, sprite.size, sprite.size)
  })
}

export const renderInterframeSprites = (ctx, spritesA, spritesB, t) => {
  console.log('Interpolating sprites with t = ', t)
  console.log('Sprites A: ', spritesA)
  console.log('Sprites B: ', spritesB)

  // For each sprite in A, find matching sprite in B by id and interpolate position, size, rotation
  Object.entries(spritesA).forEach(([id, spriteA]) => {
    console.log(`Processing sprite ${id}`)
    if (id in spritesB) {
      const spriteB = spritesB[id]

      const interpPos = {
        x: Math.floor(spriteA.pos.x + t * (spriteB.pos.x - spriteA.pos.x)),
        y: Math.floor(spriteA.pos.y + t * (spriteB.pos.y - spriteA.pos.y))
      }
      const interpSize = Math.floor(spriteA.size + t * (spriteB.size - spriteA.size))

      // Interpolate rotation to take shortest path
      let deltaRot = spriteB.rot - spriteA.rot
      if (deltaRot > 180) deltaRot -= 360
      if (deltaRot < -180) deltaRot += 360
      const interpRot = spriteA.rot + t * (deltaRot)

      console.log(`Interpolated sprite at pos (${interpPos.x}, ${interpPos.y}) with size ${interpSize} and rotation ${interpRot}`)

      // Render the interpolated sprite
      const spriteCanvas = document.createElement('canvas')
      spriteCanvas.width = spriteA.img.width
      spriteCanvas.height = spriteA.img.height
      const spriteCtx = spriteCanvas.getContext('2d')

      spriteCtx.putImageData(spriteA.img, 0, 0)

      // ctx.drawImage(spriteCanvas, interpPos.x, interpPos.y, interpSize, interpSize)

      ctx.save()
      ctx.translate(interpPos.x + interpSize / 2, interpPos.y + interpSize / 2)
      ctx.rotate(interpRot * Math.PI / 180)
      ctx.translate(- (interpPos.x + interpSize / 2), - (interpPos.y + interpSize / 2))
      ctx.drawImage(spriteCanvas, interpPos.x, interpPos.y, interpSize, interpSize)
      ctx.restore()
    }
  })
}

export const playAnimation = (ctx, state, frameCount) => {
  if (state.numScenes === 0) return

  // Iterate through the scenes to find the active scene at this frame
  for (const scene of state.scenes) {
    if (scene.startTimestamp <= frameCount && frameCount < scene.currTimestamp) {
      console.log(`Playing scene ${scene.id} at frame ${frameCount}`)
      
      // Active scene found, render it 
      ctx.putImageData(scene.background, 0, 0)

      // Add sprites from keyframes according to frameCount
      for (let i = 0; i < scene.numKeyframes - 1; i++) {
        // If current frame count is at kf i, render directly
        if (frameCount === scene.keyframes[i].timestamp) {
          renderKeyframeSprites(ctx, scene.keyframes[i].sprites)
        }
        // If current frame count is between kf i and i+1, interpolate
        else if (scene.keyframes[i].timestamp < frameCount && frameCount < scene.keyframes[i+1].timestamp) {
          // Convert the currTime to normalized t between the two keyframes
          const t = (frameCount - scene.keyframes[i].timestamp) / (scene.keyframes[i+1].timestamp - scene.keyframes[i].timestamp)
          // const interpolatedSprites = interpolateSprites(scene.keyframes[i].sprites, scene.keyframes[i+1].sprites, t)
          renderInterframeSprites(ctx, scene.keyframes[i].sprites, scene.keyframes[i+1].sprites, t)
          // renderKeyframeSprites(ctx, interpolatedSprites)
        }
      }
      // If current frame count is at last kf, render directly
      if (frameCount === scene.keyframes[scene.numKeyframes - 1].timestamp) {
        renderSpritesonBg(ctx, scene.keyframes[scene.numKeyframes - 1].sprites)
      }

      break
    }
  }

  // If frameCount exceeds total animation length, render the last scene's last keyframe
  if (frameCount >= state.scenes[state.numScenes - 1].currTimestamp) {
    const lastScene = state.scenes[state.numScenes - 1]
    ctx.putImageData(lastScene.background, 0, 0)
    renderKeyframeSprites(ctx, lastScene.keyframes[lastScene.numKeyframes - 1].sprites)
  }
}