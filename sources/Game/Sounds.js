import { Howl, Howler } from 'howler'
import { Game } from './Game.js'
import { remap, remapClamp } from './utilities/maths.js'

export class Sounds
{
    constructor()
    {
        this.game = new Game()

        this.setMusic()
        this.setFragments()

        // // Debug
        // if(this.debug)
        // {
        //     this.debugFolder = this.debug.addFolder('sounds')
        //     // this.debugFolder.open()
        // }

        // // Set up
        // this.items = []

        // this.setSettings()
        // this.setMasterVolume()
        // this.setMute()
        // this.setEngine()

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 12)
    }

    start()
    {
        this.music.play()
        this.fragments.ambiance.play()
    }

    setMusic()
    {
        this.music = new Howl({
            src: ['sounds/Mystical.mp3'],
            pool: 1,
            autoplay: false,
            loop: true,
            volume: 0.25
        })
    }

    setFragments()
    {
        this.fragments = {}
        this.fragments.ding = new Howl({
            src: ['sounds/Bell-with-a-Boom_TTX022103.mp3'],
            pool: 1,
            autoplay: false,
            loop: false,
            volume: 0.5
        })
        this.fragments.swoosh = new Howl({
            src: ['sounds/Magic Game Pack a Punch 3.mp3'],
            pool: 1,
            autoplay: false,
            loop: false,
            volume: 1
        })
        this.fragments.ambiance = new Howl({
            src: ['sounds/Mountain Audio - Small Chimes - Loop.mp3'],
            pool: 1,
            autoplay: false,
            loop: true,
            volume: 0.25
        })

        this.fragments.catch = () =>
        {
            this.fragments.ding.play()
            setTimeout(() =>
            {
                this.fragments.swoosh.play()
            }, 1350)
        }
    }

    update()
    {
        // Fragments
        const closestFragment = this.game.blackFriday.fragments.closest
        let volume = 0

        if(closestFragment)
            volume = remapClamp(closestFragment.distance, 2, 50, 0.25, 0)

        this.fragments.ambiance.volume(volume)
    }
}
