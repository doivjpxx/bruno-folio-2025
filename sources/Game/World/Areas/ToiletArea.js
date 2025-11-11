import * as THREE from 'three/webgpu'
import { Game } from '../../Game.js'
import { Area } from './Area.js'

export class ToiletArea extends Area
{
    constructor(references)
    {
        super(references)

        this.setCabin()
        this.setCandleFlames()
        this.setAchievement()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 3)
    }

    setCabin()
    {
        this.cabin = {}
        this.cabin.body = this.references.get('cabin')[0].userData.object.physical.body
        this.cabin.isSleeping = true
        this.cabin.down = false
    }

    setCandleFlames()
    {
        const mesh = this.references.get('moon')[0]
        mesh.visible = this.game.dayCycles.intervalEvents.get('night').inInterval

        this.game.dayCycles.events.on('night', (inInterval) =>
        {
            mesh.visible = inInterval
        })
    }

    setAchievement()
    {
        this.events.on('enter', () =>
        {
            this.game.achievements.setProgress('areas', 'toilet')
        })
    }

    update()
    {
        if(!this.cabin.down && !this.cabin.body.isSleeping())
        {
            const cabinUp = new THREE.Vector3(0, 1, 0)
            cabinUp.applyQuaternion(this.cabin.body.rotation())
            if(cabinUp.y < 0.4)
            {
                this.cabin.down = true
                this.game.achievements.setProgress('toiletDown', 1)
            }
        }
    }
}