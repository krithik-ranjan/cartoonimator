export const initialState = {
  projectName: '',
  scenes: [
    {
      id: 's0',
      background: null,
      numKeyframes: 0,
      activeKfIdx: -1,
      startTimestamp: 0,
      currTimestamp: -1,
      keyframes: [],
    },
  ],
  images: {
    scenes: {},
    keyframes: {},
    sprites: {},
  },
  numScenes: 1,
  activeSceneIdx: -1,
  captureId: '',
  animationValid: false,
  settings: {
    resolution: { width: 1080, height: 720 },
    fps: 30,
    frameInc: 30,
  }
}

// Example state structure
// {
//   activeSceneIdx: 0,
//   captureId: 's0',
//   images: {
//     scenes: {},
//     keyframes: {},
//     sprites: {},
//   },
//   numScenes: 1,
//   projectName: 'XYZ',
//   scenes: [
//     0: {
//       id: 's0',
//       numKeyframes: 3,
//       startTimestamp: 0,
//       currTimestamp: 90,
//       background: ImageData{},
//       keyframes: [
//         0: {
//          id: 's0-kf0',
//          img: 's0-kf0',
//          timestamp: 0,
//          sprites: {
//           sp100: {
//             center: {x: 100, y: 100},
//             img: ImageData{},
//             pos: {x: 50, y: 50},
//             rot: 0,
//             size: 150
//           }
//          } 
//         },
//         1: {
//           id: 's0-kf1',
//           img: 's0-kf1',
//           timestamp: 15,
//           sprites: {
//             sp100: {
//               center: {x: 100, y: 100},
//               img: ImageData{},
//               pos: {x: 50, y: 50},
//               rot: 25,
//               size: 150
//             }
//           }
//         },
//         2: {
//           id: 's0-kf2',
//           img: 's0-kf2',
//           timestamp: 30,
//           sprites: {
//             sp100: {
//               center: {x: 100, y: 100},
//               img: ImageData{},
//               pos: {x: 50, y: 50},
//               rot: 50,
//               size: 150
//             }
//           }
//         }
//       ]
//     },
//   ]
// }