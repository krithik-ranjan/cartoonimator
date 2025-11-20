import React from 'react'
import {Link, Element} from "react-scroll"

import './styles/Webpage.css'

import LogoImg from './assets/logo-full.png'
import BgVideo from './assets/bg-video.gif'
import QrCode from './assets/qr-code.svg'
import TemplateImg from './assets/template.png'
import InstrDesktop from './assets/instr-desktop.jpg'
import InstrMobile from './assets/instr-mobile.png'

import SkierGif from './assets/gallery/skier.gif'
import SkaterGif from './assets/gallery/skater.gif'
import BounceGif from './assets/gallery/bounce.gif'
import FishcarGif from './assets/gallery/fishcar.gif'
import HomunculusGif from './assets/gallery/homunculus.gif'
import MitosisGif from './assets/gallery/mitosis.gif'
import SpideyGif from './assets/gallery/spidey.gif'
import HikerGif from './assets/gallery/hiker.gif'
const GalleryGifs = [
    FishcarGif,
    HomunculusGif,
    SkierGif,
    SkaterGif,
    BounceGif,
    SpideyGif,
    MitosisGif,
    HikerGif,
]

export default function Webpage() {
    return (
        <div className="Webpage">
            <div className="Bg">
                <img
                    className="BgVideo"
                    src={BgVideo}
                    alt="Example video"
                />
            </div>
            <div className="Titlebar">
                <Link to="Intro" smooth={true} duration={500} className="Navlink">
                    <img 
                        className="Logo"
                        src={LogoImg}
                        alt="Cartoonimator Logo"
                    />
                </Link>
                <nav className="Navbar">
                    <Link to="Instr" smooth={true} duration={500} className="Navlink">INSTRUCTIONS</Link>
                    <Link to="Gallery" smooth={true} duration={500} className="Navlink">GALLERY</Link>
                    <Link to="About" smooth={true} duration={500} className="Navlink">ABOUT</Link>
                </nav>
            </div>
            <Element className="Content Intro">
                <h1>Bring your drawings<br/>on paper to life!</h1>
                <div className="AppLinks">
                    <div className='AppLinkCol'>
                        <a href="https://cartoonimator-9e131.web.app/">
                            <img 
                                className="AppLinkImg"
                                src={QrCode}
                                alt="QR Code and button for Cartoonimator App"
                            />
                            <button className='AppLinkBtn'>Launch App</button>
                        </a>
                    </div>
                    <div className='AppLinkCol'>
                        <a href="https://cdn.glitch.global/8919fafc-0c81-42fa-8e0a-8a55331ff6b7/Cartoonimator%20Print%20Template%20-%204-14.pdf?v=1725498869921">
                            <img 
                                className="AppLinkImg"
                                src={TemplateImg}
                                alt="Template and button for Cartoonimator App"
                            />
                            <button className='AppLinkBtn'>Download Template</button>
                        </a>
                    </div>
                </div>
            </Element>
            <Element className="Content Instr">
                <h2>How?</h2>
                <img 
                    className='InstrImg-Desktop'
                    src={InstrDesktop}
                    alt="Cartoonimator instructions: (1) Draw scene and characters, (2) Capture using app, (3) Play your animation"
                /><img 
                    className='InstrImg-Mobile'
                    src={InstrMobile}
                    alt="Cartoonimator instructions: (1) Draw scene and characters, (2) Capture using app, (3) Play your animation"
                />
                <div className='InstrVideo'>
                <iframe src="https://www.youtube.com/embed/nwF2i81Sguw?si=FZCUSXyDz6fWSA3K" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                </div>
                
            </Element>
            <Element className="Content Gallery">
                <h2>Need Inspiration?</h2>
                <div className='GalleryGrid'>
                    {GalleryGifs.map((src, index) => (
                        <div key={index} className='GalleryItem'>
                            <img src={src} alt={`Animation ${index + 1}`} />
                        </div>
                    ))}
                </div>
            </Element>
            <Element className="Content About">
                <h2>What is Cartoonimator?</h2>
                <p>Cartoonimator is a research project at the ATLAS Institute, University of Colorado Boulder, led by Krithik Ranjan. With this tool, we want to enable creators of all ages explore the art of animation using a low-barrier, tangible interface.</p>
                <p><strong>Have questions or feedback? Please reach out to krithik.ranjan@colorado.edu</strong></p>

                <h2>Read our Papers</h2>
                <p className="PaperList">Krithik Ranjan, Peter Gyory, Seneca Howell, Therese Stewart, Michael L. Rivera, and Ellen Yi-Luen Do. 2025. <strong>Cartoonimator: A Paper-based Tangible Kit for Keyframe Animation.</strong> In <em>Nineteenth International Conference on Tangible, Embedded, and Embodied Interaction (TEI '25), March 04-07, 2025, Bordeaux / Talence, France.</em> ACM, New York, NY, USA, 16 pages. <a href="https://doi.org/10.1145/3689050.3704955">https://doi.org/10.1145/3689050.3704955</a></p>
                <p className="PaperList">Krithik Ranjan, Peter Gyory, Michael L. Rivera, and Ellen Yi-Luen Do. 2023. <strong>Cartoonimator: A Low-cost, Paper-based Animation Kit for Computational Thinking.</strong> In <em>Interaction Design and Children (IDC ’23), June 19–23, 2023, Chicago, IL, USA.</em> ACM, New York, NY, USA, 5 pages. <a href='https://doi.org/10.1145/3585088.3593886'>https://doi.org/10.1145/3585088.3593886</a></p>
            </Element>
            
        </div>
    )
}