import { useRef, useEffect, useCallback, use } from "react"

import { useAnimation } from "../store/Animation-Context"
import { renderKeyframeSprites } from "../process/Animation-Utils"

import deleteBtn from "../assets/buttons/delete-cross-btn.svg"
import cameraBtn from "../assets/buttons/camera-btn.svg"
import clockBtn from '../assets/buttons/clock-btn.svg'

function KeyframeCarousel({ sceneIdx, setPageState }) {
  const { state, dispatch } = useAnimation()
  if (state.activeSceneIdx === -1) return

  return (
    <div className='keyframe-carousel-wrapper'>
      {state.scenes[state.activeSceneIdx].numKeyframes === 0 ?
      <div className='keyframe-placeholder'>Place your objects on the background and capture keyframes!</div>
      : <div className='keyframe-carousel'>
        {state.scenes[state.activeSceneIdx].keyframes.map((kf, idx) => (
          <KeyframeCard key={kf.id} sceneIdx={sceneIdx} kfIdx={idx} setPageState={setPageState} />
        ))}
      </div>}
    </div>
  )
}

export default KeyframeCarousel

function KeyframeCard({ sceneIdx, kfIdx, setPageState }) {
  const { state, dispatch } = useAnimation()
  const keyframe = state.scenes[sceneIdx].keyframes[kfIdx]
  const kfTimestamp = keyframe.timestamp

  const sceneBg = state.scenes[sceneIdx].background 

  const deleteKeyframe = useCallback(() => {
    console.log(`Deleting keyframe ${keyframe.id}`)
    dispatch({
      type: 'REMOVE_KEYFRAME',
      payload: { sceneIdx, kfIdx }
    })
  }, [state])

  const retakeKeyframe = useCallback(() => {
    console.log(`Retaking keyframe ${keyframe.id}`)
    // Set CaptureId to the keyframe and move to capture page
    dispatch({
      type: 'SET_CAPTURE_ID',
      payload: keyframe.id
    })  
    setPageState('capture')
  }, [state, keyframe])

  // const kfImg = state.images.keyframes[keyframe.img]
  const kfImgCanvasRef = useRef(null)

  useEffect(() => {
    if (sceneBg && kfImgCanvasRef.current) {
      const canvas = kfImgCanvasRef.current
      const ctx = canvas.getContext('2d')

      canvas.width = sceneBg.width
      canvas.height = sceneBg.height

      // Draw scene background first
      ctx.putImageData(sceneBg, 0, 0)
      // Draw keyframe sprites on top
      renderKeyframeSprites(ctx, keyframe.sprites)
    }
  }, [keyframe])

  return (
    <div className='keyframe-card'>
      {/* <img src={testPreview} alt='test preview' /> */}
      <img src={deleteBtn} alt='delete keyframe button' className='delete-kf-btn' onClick={deleteKeyframe} />
      <canvas ref={kfImgCanvasRef} className='kf-preview-img' />
      <div className='edit-kf-buttons'>
        <div className='kf-btn-text' style={{display: "none"}}>
          0:00
          <img src={clockBtn} alt='camera button' className='kf-btn-icon' />
        </div>
        <div className='kf-btn-text' onClick={retakeKeyframe}>
          Retake
          <img src={cameraBtn} alt='camera button' className='kf-btn-icon' />
        </div>
      </div>
      
    </div>
  )
}