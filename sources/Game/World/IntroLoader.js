import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { atan, Fn, PI, PI2, positionGeometry, texture, uniform, vec3, vec4 } from 'three/tsl'
import gsap from 'gsap'
import { Inputs } from '../Inputs/Inputs.js'

export class IntroLoader
{
    constructor()
    {
        this.game = Game.getInstance()

        const respawn = this.game.respawns.getDefault()
        this.center = respawn.position.clone()

        this.setCircle()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    setCircle()
    {
        this.circle = {}
        
        const radius = 3.5
        const thickness = 0.05
        this.circle.progress = 0
        this.circle.smoothedProgress = uniform(0)

        // Geometry
        const geometry = new THREE.RingGeometry(radius - thickness, radius, 64, 1)

        // Material
        const material = new THREE.MeshBasicNodeMaterial()
        material.outputNode = Fn(() =>
        {
            const angle = atan(positionGeometry.y, positionGeometry.x)
            const angleProgress = angle.div(PI2).add(0.5).oneMinus()

            this.circle.smoothedProgress.lessThan(angleProgress).discard()

            return vec4(this.game.reveal.color.mul(this.game.reveal.intensity), 1)
        })()

        // Mesh
        const mesh = new THREE.Mesh(geometry, material)
        
        mesh.position.copy(this.center)
        mesh.position.y = 0.001
        mesh.rotation.x = - Math.PI * 0.5
        mesh.rotation.z = Math.PI * 0.5
        
        this.game.scene.add(mesh)

        this.circle.mesh = mesh

        // Hide
        this.circle.hide = (callback = null) =>
        {
            const dummy = { scale: 1 }
            const speedMultiplier = this.game.debug.active ? 4 : 1
            gsap.to(
                dummy,
                {
                    scale: 0,
                    duration: 1.5 / speedMultiplier,
                    // ease: 'back.in(1.7)',
                    ease: 'power4.in',
                    overwrite: true,
                    onUpdate: () =>
                    {
                        mesh.scale.setScalar(dummy.scale)
                    },
                    onComplete: () =>
                    {
                        if(typeof callback === 'function')
                            callback()

                        mesh.removeFromParent()
                    }
                }
            )
        }
    }

    setLabel()
    {
        // Geometry
        const scale = 1.3
        const geometry = new THREE.PlaneGeometry(2 * scale, 1 * scale)

        // Texture
        const textures = new Map()
        const updateTexture = async () =>
        {
            // Define name
            let name = 'mouseKeyboard'
            
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
            {
                if(this.game.inputs.gamepad.type === 'xbox')
                {
                    name = 'gamepadXbox'
                }
                else
                {
                    name = 'gamepadPlaystation'
                }
            }
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
            {
                name = 'touch'
            }

            // Load, set and save texture
            let texture = textures.get(name)
            if(!texture)
            {
                const resourceName = `introLabel${name}`
                const resourcePath = `intro/${name}Label.png`
                const resources = await this.game.resourcesLoader.load([
                    [ resourceName, resourcePath, 'texture' ],
                ])
                texture = resources[resourceName]
                textures.set(name, texture)
            }

            // Update material and mesh
            material.alphaMap = texture
            material.needsUpdate = true
            mesh.visible = true
        }

        updateTexture()

        // Material
        const material = new THREE.MeshBasicNodeMaterial({
            alphaTest: 0.5,
            transparent: true
        })

        this.game.inputs.gamepad.events.on('typeChange', () =>
        {
            updateTexture()
        })

        this.game.inputs.events.on('modeChange', () =>
        {
            updateTexture()
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.visible = false
        mesh.position.copy(this.center)
        mesh.position.x += 3.5
        mesh.position.z -= 1
        mesh.position.y = 3.3
        mesh.rotation.y = 0.4

        mesh.scale.setScalar(0.01)
        this.game.scene.add(mesh)

        this.game.ticker.wait(1, () =>
        {
            const dummy = { scale: 0 }
            const speedMultiplier = this.game.debug.active ? 4 : 1
            gsap.to(
                dummy,
                {
                    scale: 1,
                    duration: 2 / speedMultiplier,
                    delay: 1 / speedMultiplier,
                    ease: 'elastic.out(0.5)',
                    overwrite: true,
                    onUpdate: () =>
                    {
                        mesh.scale.setScalar(dummy.scale)
                    }
                }
            )
        })

        this.label = mesh
    }

    hideLabel()
    {
        const speedMultiplier = this.game.debug.active ? 4 : 1
        const dummy = { scale: 1 }
        gsap.to(
            dummy,
            {
                scale: 0,
                duration: 0.3 / speedMultiplier,
                ease: 'power2.in',
                overwrite: true,
                onUpdate: () =>
                {
                    this.label.scale.setScalar(dummy.scale)
                },
                onComplete: () =>
                {
                    this.label.removeFromParent()
                }
            }
        )
    }

    updateProgress(progress)
    {
        this.circle.progress = progress
    }

    update()
    {
        this.circle.smoothedProgress.value += (this.circle.progress - this.circle.smoothedProgress.value) * this.game.ticker.delta * 10
    }
}