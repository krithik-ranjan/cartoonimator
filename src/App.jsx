import { useState, useEffect, useRef } from 'react'

import logo from './assets/logo-full.svg'

import './App-Portrait.css'
import './App-Landscape.css'

import Bottombar from './components/Bottombar'
import ProjectTitle from './components/Project-Title'
import SceneStack from './components/Scene-Stack'
import CameraView from './components/Camera-View'
import PlayView from './components/Play-View'
import InfoDialog from './components/Info-Dialog'

import { AnimationProvider, useAnimation } from './store/Animation-Context'
import { AuthProvider } from './store/Authentication-Context'
import { auth, db } from './cloud/firebase'

function App() {
  const [showInfo, setShowInfo] = useState(false)
  const [pageState, setPageState] = useState('main')  // 'main', 'play', 'capture'

  // Camera device selection 
  const [selectedCamId, setSelectedCamId] = useState('')
  const [devices, setDevices] = useState([])

  // Active scene
  const [ activeScene, setActiveScene ] = useState(-1)

  useEffect(() => {
    const setupDevices = setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true})
        stream.getTracks().forEach(track => track.stop())

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setDevices(videoDevices)

        // console.log(videoDevices)

        if (videoDevices.length > 0) {
          const currentDeviceStillExists = videoDevices.some(
            device => device.deviceId === selectedCamId
          )
          if (selectedCamId && currentDeviceStillExists) {
            setSelectedCamId(selectedCamId)
          } else {
            setSelectedCamId(videoDevices[0].deviceId)
          }
        }

        console.log('Setting up devices...')
        console.log(devices)

      } catch (err) {
        console.error('Error accessing devices: ', err)
      }
    }, 1000)

    return () => clearTimeout(setupDevices)
  }, [])

  return (
    <AuthProvider>
      <AnimationProvider>
        <div className='app'>
          <div className='header'>
            <img src={logo} className='header-logo' alt='App logo'></img>
          </div>

          {showInfo && 
            <div className='dialog-overlay'>
              <InfoDialog />
            </div>
          }
          
          <ProjectTitle />

          {pageState === 'main' && <SceneStack activeScene={activeScene} setActiveScene={setActiveScene} setPageState={setPageState} />}
          {pageState === 'capture' && <CameraView selectedCamId={selectedCamId} setSelectedCamId={setSelectedCamId} cameraDevices={devices} setPageState={setPageState}/>}
          {pageState === 'play' && <PlayView setPageState={setPageState} />}

          <div className='app-bottom-overlay'></div>

          {/* <Bottombar pageState={pageState} setPageState={setPageState} /> */}
        </div>
      </AnimationProvider>
    </AuthProvider>
  )
}

export default App

