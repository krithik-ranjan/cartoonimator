import { useState, useCallback } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

import { useAnimation } from '../store/Animation-Context'
import { auth, db } from '../cloud/firebase'

import SceneCard from './Scene-Card'

import addSceneBtn from '../assets/buttons/add-scene-btn.svg'
import playBtn from '../assets/buttons/play-btn.svg'
import helpBtn from '../assets/buttons/help-btn.svg'
import sendBtn from '../assets/buttons/send-btn.svg'

function SceneStack({ activeScene, setActiveScene, setPageState }) {
  const { state, dispatch } = useAnimation()

  const playAnimation = async () => {
    try {
      const userCred = await signInAnonymously(auth)
      const user = userCred.user 

      // Save animation metadata to Firestore
      const docRef = await addDoc(collection(db, 'fullAnimData'), {
        ...state,
        uploadedAt: serverTimestamp(),
        userId: user.uid
      })

      console.log('Animation Data uploaded')
    } catch (err) {
      console.log('Error: ', err)
    }
  }

  const testFirebase = async () => {
    try {
      const userCred = await signInAnonymously(auth)
      const user = userCred.user 

      console.log('Signed in')
      console.log(user)

      await addDoc(collection(db, 'testCollect'), {
        userId: user.uid,
        message: 'Yolo'
      })

      console.log('Sent message')
    } catch (err) {
      console.error('Error: ', err)
    }
  }

  const addScene = useCallback(() => {
      dispatch({
        type: 'ADD_SCENE',
      })
      setActiveScene(-1)
    }, [state])

  return (
    <div className='scene-stack'>
      {state.scenes.map((scene, idx) => (
        <SceneCard key={scene.id} sceneIndex={idx} activeSceneIdx={activeScene} setActiveSceneIdx={setActiveScene} setPageState={setPageState} />
      ))}

      {/* <button className='add-scene-btn bottom-btn' onClick={addScene} disabled={!state.animationValid} >
        <img src={addSceneBtn} alt='add scene button' className='add-scene-btn' />      
      </button> */}
      <div className='bottombar'>
        <button className='help-btn bottom-btn'>
          <img src={helpBtn} alt='Help Button' className='help-btn-img btn-img'></img>
        </button>
        {/* <button className='send-btn bottom-btn' onClick={testFirebase}>
          <img src={sendBtn} alt='Send Button' className='send-btn-img btn-img'></img>
        </button> */}
        <button className='play-btn bottom-btn' onClick={() => {
            // playAnimation()
            setPageState('play')}
          } disabled={!state.animationValid}>
          <img src={playBtn} alt='Play Button' className='play-btn-img btn-img'></img>
        </button>
      </div>
    </div>
  )
}

export default SceneStack