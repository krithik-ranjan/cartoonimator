export const animationReducer = (state, action) => {
  let updatedState = null
  let updatedScenes = null
  let updatedKeyframes = null
  let sceneIdx = 0
  let kfIdx = 0

  switch (action.type) {
    case 'SET_PROJECT_NAME':
      updatedState = { ...state, projectName: action.payload }
      break

    // Sets activeSceneIdx to configure the expanded scene
    case 'SET_ACTIVE_SCENE':
      updatedState = {...state, activeSceneIdx: action.payload }
      break

    // Sets captureId to select the thing to be captured
    case 'SET_CAPTURE_ID':
      updatedState = {...state, captureId: action.payload }
      break

    case 'ADD_SCENE':
      updatedScenes = [...state.scenes]

      let lastTime = updatedScenes[updatedScenes.length - 1].currTimestamp

      updatedScenes.push({
        id: `s${updatedScenes.length}`,
        keyframes: [],
        numKeyframes: 0,
        startTimestamp: lastTime,
        currTimestamp: -1,
        background: null
      })
      updatedState = {
        ...state,
        scenes: updatedScenes,
        numScenes: updatedScenes.length,
        activeSceneIdx: -1
      }
      break

    case 'ADD_SCENE_BG':
      const sceneImgId = state.captureId
      updatedScenes = [...state.scenes]
      updatedScenes[action.payload.sceneIdx].background = action.payload.sceneBg

      // console.log(`Updating scene image to: ${sceneImgId}`)

      updatedState = {
        ...state,
        scenes: updatedScenes
      }
      break

    case 'ADD_KEYFRAME':
      updatedScenes = [...state.scenes]

      let timestamp = updatedScenes[state.activeSceneIdx].currTimestamp === -1 
        ? 0 
        : updatedScenes[state.activeSceneIdx].currTimestamp + state.settings.frameInc

      updatedScenes[state.activeSceneIdx].keyframes.push({
        id: action.payload,
        img: action.payload,
        timestamp: timestamp,
        sprites: {}
      })

      updatedScenes[state.activeSceneIdx].numKeyframes++
      updatedScenes[state.activeSceneIdx].currTimestamp = timestamp

      updatedState = {
        ...state,
        scenes: updatedScenes
      }
      break

    case 'REMOVE_KEYFRAME':
      kfIdx = action.payload.kfIdx
      sceneIdx = action.payload.sceneIdx

      updatedScenes = [...state.scenes]
      updatedKeyframes = [...updatedScenes[sceneIdx].keyframes]

      // If not the last keyframe, change the id and timestamp of all keyframes
      if (kfIdx < updatedScenes[sceneIdx].numKeyframes - 1) {
        let timestampOffset = updatedKeyframes[kfIdx + 1].timestamp - updatedKeyframes[kfIdx].timestamp
        for (let i = kfIdx + 1; i < updatedKeyframes.length; i++) {
          updatedKeyframes[i].id = `s${sceneIdx}-kf${i - 1}`
          updatedKeyframes[i].timestamp = updatedKeyframes[i].timestamp - timestampOffset
        }
      }

      updatedKeyframes.splice(kfIdx, 1)

      updatedScenes[sceneIdx].keyframes = updatedKeyframes
      updatedScenes[sceneIdx].numKeyframes--

      updatedScenes[state.activeSceneIdx].currTimestamp =
        (updatedScenes[state.activeSceneIdx].numKeyframes === 0) ? -1 
        : updatedScenes[state.activeSceneIdx].keyframes[updatedScenes[state.activeSceneIdx].numKeyframes - 1].timestamp

      // FOR FUTURE: If not the last keyframe, need to adjust timestamps of subsequent keyframes

      updatedState = {
        ...state,
        scenes: updatedScenes
      }
      break

    case 'UPDATE_KEYFRAME_IMG':
      const kfImgId = state.captureId

      sceneIdx = action.payload.sceneIdx 
      kfIdx = action.payload.kfIdx

      console.log(`Adding keyframe image ${kfImgId}`)

      // Add sprite map to keyframe object
      updatedScenes = [...state.scenes]
      updatedScenes[sceneIdx].keyframes[kfIdx] = {
        ...updatedScenes[sceneIdx].keyframes[kfIdx],
        sprites: action.payload.sprites
      }


      // updatedKeyframes = [...state.scenes[sceneIdx].keyframes]
      
      // // If current keyframe index is equal to number of kfs, we add a keyframe
      // if (kfIdx === updatedScenes[sceneIdx].numKeyframes) {
      //   updatedKeyframes.push({
      //     id: kfImgId,
      //     img: kfImgId, 
      //     sprites: [],
      //     timestamp: 0,
      //   })
      // } else {
      //   updatedKeyframes[kfIdx] = { ...updatedKeyframes[kfIdx], img: kfImgId, sprites: [] }        
      // }

      // updatedScenes[sceneIdx].keyframes = updatedKeyframes

      updatedState = {
        ...state,
        scenes: updatedScenes
      }
      break

    default: 
      updatedState = state
  }

  // For each command, do the following based on how the state has changed
  updatedState.animationValid = (updatedState.scenes.length > 0) && updatedState.scenes.every(scene => scene.numKeyframes > 1)

  console.log(`Updated State (after ${action.type}): `)
  console.log(updatedState)
  return updatedState
}