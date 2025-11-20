import { useCallback, useEffect, useRef, useState } from "react"
import { signInAnonymously, setPersistence, browserLocalPersistence, inMemoryPersistence } from "firebase/auth"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

import { useAnimation } from "../store/Animation-Context"
import { playAnimation } from "../process/Animation-Utils"
import { auth, db, storage } from '../cloud/firebase'

import backBtn from '../assets/buttons/back-btn.svg'
import replayBtn from '../assets/buttons/replay-btn.svg'
import downloadBtn from '../assets/buttons/download-btn.svg'

function PlayView({ setPageState }) {
  const { state, dispatch } = useAnimation()

  const playCanvasRef = useRef(null)
  const [playCanvas, setPlayCanvas] = useState(null)

  const [replayTrigger, setReplayTrigger] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastFrameTime = 0
    const frameDelay = 1000 / state.settings.fps 

    let animationFrameId; 

    console.log('Playing animation at ', frameCount)

    if (playCanvas) {
      const render = (currTime) => {
        const delTime = currTime - lastFrameTime

        if (delTime >= frameDelay) {
          frameCount++
          // playAnimation(frameCount)
          const ctx = playCanvas.getContext('2d')
          playAnimation(ctx, state, frameCount)
          lastFrameTime = currTime - (delTime % frameDelay)
        }

        animationFrameId = window.requestAnimationFrame(render)
      }
      render(performance.now())
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [playCanvas, replayTrigger])

  useEffect(() => {
    if (playCanvasRef) {
      setPlayCanvas(playCanvasRef.current)
    }
  }, [playCanvasRef])

  // Variables for recording and downloading
  const mediaRecorderRef = useRef(null)
  const recordedChunks = useRef([])
  const [isRecording, setIsRecording] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')

  // Setup mimetype 
  const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm'
  const videoExtn = mimeType === 'video/mp4' ? 'mp4' : 'webm'

  const uploadAnimation = useCallback(async (videoBlob) => {
    try {
      // Force persistance for Firebase -- needed for Safari 
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (persistanceError) {
        console.warn('Browser local persistence not supported, falling back to in-memory.')
        await setPersistence(auth, inMemoryPersistence)
      }

      const userCred = await signInAnonymously(auth)
      const user = userCred.user 

      // Set metadata
      const metadata = {
        contentType: videoBlob.type || 'video/mp4',
        customMetadata: {
          uploadedBy: user.uid
        }
      }

      // Upload the video file
      const videoRef = ref(storage, `animations/${user.uid}/${Date.now()}_${state.projectName}.${videoExtn}`)
      const videoSnapshot = await uploadBytes(videoRef, videoBlob, metadata)
      const videoURL = await getDownloadURL(videoSnapshot.ref)

      console.log('Video uploaded successfully: ', videoURL)

      // Save metadata with video URL
      const docRef = await addDoc(collection(db, 'downloadAnimInfo'), {
        projectName: state.projectName,
        videoURL,
        fileSize: videoBlob.size,
        mimeType: videoBlob.type,
        uploadedAt: serverTimestamp(),
        userId: user.uid
      })

      console.log('Animation metadata uploaded successfully at ', videoURL)
      console.log('Size: ', videoBlob.size)
    } catch (err) {
      console.error('Upload failed: ', err)
      console.error('Error details: ', {
        message: err.message, 
        code: err.code, 
        blobSize: videoBlob.size, 
        blobType: videoBlob.type
      })
      throw err 
    }
  }, [state])

  const downloadAnimation = useCallback(async () => {
    console.log('Preparing to record animation...')
    if (isRecording) return  // Prevent multiple recordings at the same time
    setIsRecording(true)

    const stream = playCanvas.captureStream(state.settings.fps)
    const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType })
    mediaRecorderRef.current = mediaRecorder
    recordedChunks.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      console.log('Recording stopped, preparing download...')
      const blob = new Blob(recordedChunks.current, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setIsRecording(false)
      recordedChunks.current = []

      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = (state.projectName === '') ? 'animation.mp4' : `${state.projectName}.mp4`
      a.click()
      window.URL.revokeObjectURL(url)

      // Trigger upload to Firebase
      uploadAnimation(blob)

      setIsRecording(false)
    }

    // Start recording 
    mediaRecorder.start()
    console.log('Recording started...')
    setReplayTrigger(!replayTrigger)  // Restart the animation for recording

    // Stop recording after the total animation duration
    const totalFrames = state.scenes.length > 0 ? state.scenes[state.scenes.length - 1].currTimestamp : 0
    const totalDuration = (totalFrames / state.settings.fps) * 1000  // in ms
    console.log(`Total animation duration: ${totalDuration} ms`)
    setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
    }, totalDuration + 500)  // Extra 0.5s to ensure complete capture
  }, [isRecording, playCanvas])

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        window.URL.revokeObjectURL(downloadUrl)
      }
    }
  }, [downloadUrl])

  return (
    <div className='play-view'>
      <canvas
        className='play-canvas'
        ref={playCanvasRef}
        width={1080}
        height={720}
      />

      <div className='bottombar'>
        <div className='bottombar-left'>
          <button className='back-btn bottom-btn' onClick={() => {setPageState('main')}}>
            <img src={backBtn} alt='Back Button' className='back-btn-img btn-img'></img>
          </button>
        </div>
        <div className='bottombar-right'>
          <button className='replay-btn bottom-btn' onClick={() => {setReplayTrigger(!replayTrigger)}} disabled={isRecording}>
            <img src={replayBtn} alt='Replay Button' className='replay-btn-img btn-img'></img>
          </button>
          <button className='download-btn bottom-btn' onClick={(e) => {e.preventDefault(); downloadAnimation();}} disabled={isRecording}>
            <img src={downloadBtn} alt='Download Button' className='download-btn-img btn-img'></img>
          </button>
        </div>
      </div>
    </div>
  )
}
export default PlayView