import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

export class Cursor
{
    constructor()
    {
        this.game = Game.getInstance()

        this.intersects = []
        this.isGlobalIntersecting = false

        this.raycaster = new THREE.Raycaster()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 1)
    }

    addIntersects(description)
    {
        const intersect = { ...description }
        intersect.isIntersecting = false
        intersect.isDown = false
        
        this.intersects.push(intersect)

        return intersect
    }

    update()
    {
        const intersects = this.intersects.filter(intersect => intersect.active)
        let isGlobalIntersecting = false

        if(intersects.length)
        {
            const ndcPointer = new THREE.Vector2(
                (this.game.inputs.pointer.current.x / this.game.viewport.width) * 2 - 1,
                - ((this.game.inputs.pointer.current.y / this.game.viewport.height) * 2 - 1),
            )
            this.raycaster.setFromCamera(ndcPointer, this.game.view.camera)

            for(const intersect of intersects)
            {
                if(intersect.active)
                {
                    let isIntersecting = false
                    let shapeIndex = 0

                    while(!isIntersecting && shapeIndex <= intersect.shapes.length - 1)
                    {
                        const shape = intersect.shapes[shapeIndex]

                        if(shape instanceof THREE.Sphere)
                            isIntersecting = this.raycaster.ray.intersectsSphere(shape)
                        if(shape instanceof THREE.Box3)
                            isIntersecting = this.raycaster.ray.intersectsBox(shape)
                        if(shape instanceof THREE.Plane)
                            isIntersecting = this.raycaster.ray.intersectsPlane(shape)
                        if(shape instanceof THREE.Mesh)
                            isIntersecting = this.raycaster.intersectObject(shape).length
                        
                        shapeIndex++
                    }

                    if(isIntersecting !== intersect.isIntersecting)
                    {
                        intersect.isIntersecting = isIntersecting

                        if(intersect.isIntersecting)
                        {
                            if(typeof intersect.onEnter === 'function')
                                intersect.onEnter()
                        }

                        else
                        {
                            if(typeof intersect.onLeave === 'function')
                                intersect.onLeave()
                        }
                    }

                    if(this.game.inputs.pointer.hasClicked && intersect.isIntersecting)
                    {
                        intersect.isDown = true

                        if(typeof intersect.onDown === 'function')
                        {
                            intersect.onDown()
                        }
                    }
                    if(this.game.inputs.pointer.hasReleased)
                    {
                        if(!intersect.isIntersecting)
                        {
                            if(intersect.isDown)
                            {
                                intersect.isDown = false

                                if(typeof intersect.onUp === 'function')
                                {
                                    intersect.onUp()
                                }
                            }
                        }
                        else
                        {
                            if(typeof intersect.onUp === 'function')
                            {
                                intersect.onUp()
                            }
                            
                            if(intersect.isDown)
                            {
                                intersect.isDown = false

                                if(typeof intersect.onClick === 'function')
                                {
                                    intersect.onClick()
                                }
                            }
                        }
                    }

                    if(isIntersecting)
                    {
                        isGlobalIntersecting = true
                    }
                }
            }

            if(isGlobalIntersecting !== this.isGlobalIntersecting)
            {
                this.isGlobalIntersecting = isGlobalIntersecting
                
                this.game.domElement.style.cursor = this.isGlobalIntersecting ? 'pointer' : 'default'
            }
        }
    }
}