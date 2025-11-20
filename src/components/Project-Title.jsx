import { useState, useRef, useEffect } from 'react'

import { useAnimation } from '../store/Animation-Context'

import editBtn from '../assets/buttons/edit-btn.svg'

function ProjectTitle() {
    const { state, dispatch } = useAnimation()
    const [editingName, setEditingName] = useState(false)

    const setProjName = (name) => {
        dispatch({
            type: 'SET_PROJECT_NAME',
            payload: name
        })
    }

    const handleEditClick = () => {
        setEditingName(true);
    }

    const handleNameChange = (e) => {
        setProjName(e.target.value)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            setEditingName(false)
        }
    }

    const handleBlur = (e) => {
        setEditingName(false)
    }

    const debugCanvasRef = useRef(null)
    useEffect(() => {
        if (debugCanvasRef.current) {
            const canvas = debugCanvasRef.current
            const ctx = canvas.getContext('2d')

            // canvas.width = sceneBg.width
            // canvas.height = sceneBg.height

            // Draw scene background first
            ctx.fillStyle = '#CCCCCC'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            let testKf = state.scenes[0].keyframes[0]?.sprites?.sp100?.img
            if (testKf) {
                ctx.putImageData(testKf, 0, 0)
            }
        }
  }, [state.scenes])

    return (
        <div className='project-title'>
            {editingName ? (<input 
                type='text'
                value={state.projectName}
                onChange={handleNameChange}
                onKeyDown={handleKeyPress}
                onBlur={handleBlur}
                autoFocus
                placeholder='_'
                className='project-name-input'
            ></input>) : (<>
                {state.projectName === '' ? <span className='translucent-text'>Animation Name</span> : state.projectName}
            </>)}
            <img src={editBtn} className='edit-name-btn' alt='edit button' onClick={handleEditClick}></img>

            {/* <canvas ref={debugCanvasRef} width={720} height={720} style={{display: 'block', width: '100%'}} /> */}

      </div>
    )
}

export default ProjectTitle