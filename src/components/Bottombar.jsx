import playBtn from '../assets/buttons/play-btn.svg'
import helpBtn from '../assets/buttons/help-btn.svg'
import captureBtn from '../assets/buttons/capture-btn.svg'
import backBtn from '../assets/buttons/back-btn.svg'

function Bottombar({pageState, setPageState}) {

    return (
        <div className='bottombar'>
            {pageState === 'main' &&
                <button className='help-btn bottom-btn'>
                    <img src={helpBtn} alt='Help Button' className='help-btn-img btn-img'></img>
                </button>
            }
            
            {pageState === 'main' && 
                <button className='play-btn bottom-btn'>
                    <img src={playBtn} alt='Play Button' className='play-btn-img btn-img'></img>
                </button>
            }

            {pageState === 'capture' &&
                <button className='back-btn bottom-btn'>
                    <img src={backBtn} alt='Back Button' className='back-btn-img btn-img'></img>
                </button>
            }

            {pageState === 'capture' &&
                <button className='capture-btn bottom-btn'>
                    <img src={captureBtn} alt='Capture Button' className='capture-btn-img btn-img'></img>
                </button>
            }

        </div>
    )
}

export default Bottombar