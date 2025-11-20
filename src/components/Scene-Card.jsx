import { useEffect, useRef, useState, useCallback } from 'react'

import { useAnimation } from '../store/Animation-Context'
import { renderKeyframeSprites } from '../process/Animation-Utils'

import KeyframeCarousel from './Keyframe-Carousel'

import expandBtn from '../assets/buttons/next-arrow.svg'
import collapseBtn from '../assets/buttons/down-arrow.svg'
import captureBgBtn from '../assets/buttons/capture-bg-btn.svg'
import cameraBtn from '../assets/buttons/camera-btn.svg'
import addKfBtn from '../assets/buttons/add-kf-btn.svg'

function SceneCard({ sceneIndex, activeSceneIdx, setActiveSceneIdx, setPageState }) {
  const { state, dispatch } = useAnimation()
  const scene = state.scenes[sceneIndex]

  const latestKf = (scene.numKeyframes === 0) ? null : scene.keyframes[scene.numKeyframes - 1]

  const [expanded, setExpanded] = useState((sceneIndex === activeSceneIdx))

  const sceneBgCanvasRef = useRef(null)
  const sceneBg = scene.background 

  useEffect(() => {
    if (sceneBg && sceneBgCanvasRef.current) {
      const canvas = sceneBgCanvasRef.current
      const ctx = canvas.getContext('2d')

      canvas.width = sceneBg.width
      canvas.height = sceneBg.height

      ctx.putImageData(sceneBg, 0, 0)

      // Put latest keyframe sprites on top if exists
      if (latestKf !== null) {
        renderKeyframeSprites(ctx, latestKf.sprites)

        // Object.values(latestKf.sprites).forEach(sprite => {
        //   // Draw each sprite image at its position with rotation
        //   // console.log('Drawing sprite: ')
        //   // console.log(sprite)
        //   ctx.putImageData(sprite.img, sprite.pos.x, sprite.pos.y)
        // })
      }
    }
  }, [sceneBg, latestKf])

  const handleExpand = (action) => {    
    dispatch({
      type: 'SET_ACTIVE_SCENE',
      payload: action ? sceneIndex : -1
    })

    // setActiveSceneIdx(sceneIndex)
    setExpanded(action)
    setActiveSceneIdx(sceneIndex)
  }

  const captureSceneBg = useCallback(() => {
    // Set CaptureId to the scene and move to capture page
    dispatch({
      type: 'SET_CAPTURE_ID',
      payload: state.scenes[sceneIndex].id
    })

    setPageState('capture')
  }, [state, sceneIndex])

  const addKeyframe = useCallback(() => {
    let kfId = `${state.scenes[sceneIndex].id}-kf${state.scenes[sceneIndex].numKeyframes}`

    dispatch({
      type: 'ADD_KEYFRAME',
      payload: kfId,
    })

    dispatch({
      type: 'SET_CAPTURE_ID',
      payload: kfId,
    })

    setPageState('capture')
  }, [state, sceneIndex])

  return (
    <div className='scene-card'>
      {expanded ? 
        <img src={collapseBtn} className='expand-scene-btn' alt='expand button' onClick={() => {handleExpand(false)}}/> :
        <img src={expandBtn} className='expand-scene-btn' alt='expand button' onClick={() => {handleExpand(true)}}/>  
      }
      <span className='scene-title'>Scene #{sceneIndex + 1}</span>

      {state.scenes[sceneIndex].id === 's0' && state.scenes[sceneIndex].background == null && !expanded &&
        <span className='scene-instr'>Create your first scene!</span>}

      {expanded && sceneBg == null && 
        <img src={captureBgBtn} className='capture-bg-btn btn-img' alt='capture background' onClick={captureSceneBg}/>
      }

      {sceneBg !== null &&
        <div className='scene-preview'>
          {/* <img src={sceneBg} alt='scene' className='scene-preview-img'/> */}
          <canvas ref={sceneBgCanvasRef} className='scene-preview-img' />

          {expanded && 
            <div className='retake-bg-btn' onClick={captureSceneBg}>
              Retake Background
              <img src={cameraBtn} alt='camera button' className='retake-bg-btn-icon' />
            </div>
          }
        </div>
      }

      {state.scenes[sceneIndex].background !== null && expanded &&
        <div className='keyframe-title'>
          <span>Keyframes</span>
          <img src={addKfBtn} alt='add keyframe' className='add-kf-btn' onClick={addKeyframe} />
        </div>
      }

      {state.scenes[sceneIndex].background !== null && expanded && 
        <KeyframeCarousel sceneIdx={sceneIndex} setPageState={setPageState}/>
      }
      
    </div>
  )
}

export default SceneCard