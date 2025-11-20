import Webcam from 'react-webcam'
import { useState, useRef, useCallback, useEffect } from 'react'

import { useAnimation } from '../store/Animation-Context'
import { checkMarkers, highlightBg, highlightObjects, captureBg, addSprites } from '../process/Animation-Utils'

import captureBtn from '../assets/buttons/capture-btn.svg'
import backBtn from '../assets/buttons/back-btn.svg'
import checkImg from '../assets/buttons/check-img.svg'

const CAPTURE_VALID_REFRESH = 10000

function CameraView({ selectedCamId, setSelectedCamId, cameraDevices, setPageState }) {
  const { state, dispatch } = useAnimation()
  const captureState = (state.captureId.indexOf('-') === -1) ? 'scene' : 'keyframe'
  const captureRes = state.settings.resolution
  
  const webcamRef = useRef(null)
  const captureCanvasRef = useRef(null)
  const previewCanvasRef = useRef(null)

  // const [validFrame, setValidFrame] = useState(false)
  const [validMarkers, setValidMarkers] = useState(null)
  let lastValidTime = -1 * CAPTURE_VALID_REFRESH

  let markerMap = new Map()

  const processFrame = useCallback(() => {
    if (webcamRef == null) {
      console.log('No selected camera.')
      return
    }

    const video = webcamRef.current.video 
    const canvas = captureCanvasRef.current
    const preview = previewCanvasRef.current

    if (video && canvas) {
      console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`)
      // Return if no video feed yet
      if (video.videoWidth === 0 || video.videoHeight === 0) return

      // Resize canvas to video size
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      preview.width = video.videoWidth
      preview.height = video.videoHeight

      console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`)


      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let markersFound = checkMarkers(frame, markerMap)

      if (markersFound) {
        lastValidTime = performance.now()

        // setValidCorners({
        //   tl : markerMap.get(10).tl,
        //   tr : markerMap.get(11).tl,
        //   br : markerMap.get(12).tl,
        //   bl : markerMap.get(13).tl
        // })
        // console.log('Updating markers')
        // console.log(markerMap)

        setValidMarkers(markerMap)

      } else {
        if (performance.now() - lastValidTime > CAPTURE_VALID_REFRESH) {
          console.log('Markers not seen for x time')
          setValidMarkers(null)
        }
      }

      const ctxPrev = preview.getContext('2d')
      ctxPrev.clearRect(0, 0, preview.width, preview.height)
      // if (captureState === 'scene') highlightBg(ctxPrev, validMarkers)
      
      if (captureState === 'keyframe') {
        ctxPrev.clearRect(0, 0, preview.width, preview.height)
        highlightObjects(ctxPrev, markerMap)
      }
      // ctxPrev.putImageData(frame, 0, 0)
    }

    // console.log('Valid Markers: ')
    // console.log(validMarkers)
  }, [validMarkers])

  useEffect(() => {
    const interval = setInterval(processFrame, 30)
    return () => clearInterval(interval)
  }, [processFrame])

  const captureFrame = useCallback(() => {
    console.log(`Capturing frame ${state.captureId}`)
    
    console.log('Corners: ')
    console.log(validMarkers)

    if (webcamRef == null) {
      console.log('No selected camera.')
      return
    }
    if (validMarkers == null || validMarkers.size < 4) {
      console.log('Not a valid frame.')
      return
    }

    const video = webcamRef.current.video 
    const canvas = captureCanvasRef.current

    if (video && canvas) {
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
      // const img = cv.matFromImageData(frame)

      // Check what is being captured
      let cId = state.captureId
      if (captureState === 'scene') {
        // Capturing a scene 
        console.log('Capturing scene bg: ', cId)
        dispatch({
          type: 'ADD_SCENE_BG',
          payload: {
            sceneIdx: parseInt(cId.substring(1)),
            sceneBg: captureBg(frame, validMarkers, captureRes.width, captureRes.height)
          }
        })
      } else {
        console.log('Capturing keyframe: ', cId)
        let sceneIdx = parseInt(cId.substring(1, cId.indexOf('-')))
        let kfIdx = parseInt(cId.substring(cId.indexOf('f') + 1))

        // Construct the map for detected objects
        // let sprites = new Map()
        let sprites = addSprites(frame, validMarkers, captureRes.width, captureRes.height)
        console.log('Detected sprites: ')
        console.log(sprites)

        console.log(`Scene Index: ${sceneIdx}, Keyframe Index: ${kfIdx}`)
        dispatch({ 
          type: 'UPDATE_KEYFRAME_IMG',
          payload: {
            sceneIdx,
            kfIdx,
            sprites
          }
        })
      }
    }

    setPageState('main')
  }, [dispatch, validMarkers])

  const abandonCapture = useCallback(() => {
    if (captureState === 'keyframe') {
      let sceneIdx = parseInt(state.captureId.substring(1, state.captureId.indexOf('-')))
      let kfIdx = parseInt(state.captureId.substring(state.captureId.indexOf('f') + 1))

      dispatch({ 
        type: 'REMOVE_KEYFRAME',
        payload: { sceneIdx, kfIdx }
      })
    }

    setPageState('main')
  }, [state])

  return (
    <div className='camera-view'>
      <Webcam
        className='webcam'
        audio={false}
        screenshotFormat='image/jpeg'
        videoConstraints={{
          width: 1080,
          height: 720,
          deviceId: selectedCamId
        }}
        ref={webcamRef}
      />
      <canvas
        className='webcam-preview'
        ref={previewCanvasRef}
        width={1080}
        height={720}
      />
      <canvas
        ref={captureCanvasRef}
        width={1080}
        height={720}
        style={{display: 'none'}}
      />
      <CameraCheck check={validMarkers !== null} />
      <select 
        className='camera-select'
        value={selectedCamId}
        onChange={(e) => { 
          setSelectedCamId(e.target.value)
          console.log('Selected camera: ', e.target.value)
        }}
      >
        {cameraDevices.length > 0 ?
          cameraDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          )):
          <option value='camera-loading'>Loading...</option>
        }
      </select>

      <div className='bottombar'>
        <button className='back-btn bottom-btn' onClick={abandonCapture}>
          <img src={backBtn} alt='Back Button' className='back-btn-img btn-img'></img>
        </button>
        <button className='capture-btn bottom-btn' onClick={captureFrame}>
          <img src={captureBtn} alt='Capture Button' className='capture-btn-img btn-img'></img>
        </button>
      </div>
    </div>
  )
}

export default CameraView

function CameraCheck({check}) {
  return (
    <>
      {check ? <img 
        className="capture-check"
        src={checkImg}
        alt="Checkmark"
      /> : null } 
    </>
  )
}