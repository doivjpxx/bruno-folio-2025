import * as THREE from 'three/webgpu'
import { Game } from './Game.js'
import { attribute, cross, dot, float, Fn, mat3, materialNormal, modelViewMatrix, normalGeometry, normalView, positionGeometry, texture, vec2, vec3, vec4 } from 'three/tsl'

const getRotationMatrix = Fn(([u, v]) =>
{
    const cosTheta = dot(u, v).toVar()
    const axis = cross(u, v).toVar()
    const sinTheta = axis.length().toVar()

    axis.assign(axis.normalize())

    const c = cosTheta.toVar()
    const s = sinTheta.toVar()
    const t = c.oneMinus().toVar()

    return mat3(
        t.mul(axis.x).mul(axis.x).add(c), t.mul(axis.x).mul(axis.y).sub(s.mul(axis.z)), t.mul(axis.x).mul(axis.z).add(s.mul(axis.y)),
        t.mul(axis.x).mul(axis.y).add(s.mul(axis.z)), t.mul(axis.y).mul(axis.y).add(c), t.mul(axis.y).mul(axis.z).sub(s.mul(axis.x)),
        t.mul(axis.x).mul(axis.z).sub(s.mul(axis.y)), t.mul(axis.y).mul(axis.z).add(s.mul(axis.x)), t.mul(axis.z).mul(axis.z).add(c)
    ).toVar();
})

export class Trail
{
    constructor()
    {
        this.game = Game.getInstance()

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🌈 Trails',
                expanded: true,
            })
        }

        this.position = new THREE.Vector3()
        this.alpha = 0
        
        this.subdivisions = 32
        this.texel = 1 / this.subdivisions
        this.distanceThrottle = 0.4
        this.lastPosition = new THREE.Vector3(Infinity, Infinity, Infinity)

        // this.setReferenceHelper()
        this.setGradient()
        this.setDataTexture()
        this.setGeometry()
        this.setMaterial()
        this.setMesh()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 9)
    }

    setReferenceHelper()
    {
        this.referenceHelper = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 32, 12, 12),
            new THREE.MeshNormalNodeMaterial({ wireframe: true }),
        )
        this.reference.add(this.referenceHelper)
    }

    setGradient()
    {
        const height = 16

        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = height

        this.gradientTexture = new THREE.Texture(canvas)
        this.gradientTexture.colorSpace = THREE.SRGBColorSpace

        const context = canvas.getContext('2d')

        const colors = [
            { stop: 0, value: '#ffb646' },
            { stop: 0.5, value: '#ff347e' },
            { stop: 1, value: '#0300ff' },
        ]

        const update = () =>
        {
            const gradient = context.createLinearGradient(0, 0, 0, height)
            for(const color of colors)
                gradient.addColorStop(color.stop, color.value)

            context.fillStyle = gradient
            context.fillRect(0, 0, 1, height)
            this.gradientTexture.needsUpdate = true
        }

        update()

        // // Debug
        // canvas.style.position = 'fixed'
        // canvas.style.zIndex = 999
        // canvas.style.top = 0
        // canvas.style.left = 0
        // canvas.style.width = '128px'
        // canvas.style.height = `256px`
        // document.body.append(canvas)
        
        if(this.game.debug.active)
        {
            for(const color of colors)
            {
                this.debugPanel.addBinding(color, 'stop', { min: 0, max: 1, step: 0.001 }).on('change', update)
                this.debugPanel.addBinding(color, 'value', { view: 'color' }).on('change', update)
            }
        }
    }

    setDataTexture()
    {
        this.dataTexture = new THREE.DataTexture(
            new Float32Array(this.subdivisions * 4),
            this.subdivisions,
            1,
            THREE.RGBAFormat,
            THREE.FloatType
        )
    }

    setGeometry()
    {
        this.geometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 4, this.subdivisions, true)
        this.geometry.rotateY(Math.PI * 0.25)
        this.geometry.rotateX(- Math.PI * 0.5)
        this.geometry.translate(0, 0, 0.5)
        
        this.geometry.deleteAttribute('uv')
    }

    setMaterial()
    {
        this.material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })

        const customNormal = vec3().varying()
        const ratio = float(0).varying()
        const alpha = float(0).varying()

        this.material.positionNode = Fn(() =>
        {
            // Ratio
            ratio.assign(positionGeometry.z.oneMinus())

            // Trail data
            const trailData = texture(this.dataTexture, vec2(ratio, 0.5)).toVar()
            const trailPosition = trailData.xyz

            // Direction
            const nextPosition = texture(this.dataTexture, vec2(ratio.add(this.texel), 0.5)).xyz
            const direction = nextPosition.sub(trailPosition).normalize().toVar()

            // Rotation matrix
            const rotationMatrix = getRotationMatrix(direction, vec3(0, 0, -1))

            // Rotated position
            const basePosition = vec3(positionGeometry.x, positionGeometry.y, 0)
            const rotatedPoint = rotationMatrix.mul(basePosition)

            // Normal
            customNormal.assign(modelViewMatrix.mul(vec4(rotationMatrix.mul(attribute('normal')), 0)))

            // Alpha
            alpha.assign(trailData.w)
            
            return trailPosition.add(rotatedPoint)
        })()

        this.material.outputNode = Fn(() =>
        {
            const fresnel = customNormal.dot(vec3(0, 0, 1)).abs().oneMinus()

            const gradientUv = vec2(
                0.5,
                ratio.oneMinus().sub(fresnel.oneMinus().mul(0.25))
            )
            const baseColor = texture(this.gradientTexture, gradientUv).rgb.mul(5)
            
            return vec4(vec3(baseColor), ratio.oneMinus().mul(alpha))
        })()
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.frustumCulled = false
        this.game.scene.add(this.mesh)
    }

    update()
    {
        const data = this.dataTexture.source.data.data

        // Throttle by distance
        const positionDelta = this.lastPosition.clone().sub(this.position)
        const distance = positionDelta.length()
        
        if(distance > this.distanceThrottle)
        {
            // Move data one "pixel"
            for(let i = this.subdivisions - 1; i >= 0; i--)
            {
                const i4 = i * 4
                data[i4    ] = data[i4 - 4]
                data[i4 + 1] = data[i4 - 3]
                data[i4 + 2] = data[i4 - 2]
                data[i4 + 3] = data[i4 - 1]
            }

            // Save time and position
            this.lastTime = this.game.ticker.elapsed
            this.lastPosition.copy(this.position)
        }

        // Fade out
        for(let i = this.subdivisions - 1; i >= 0; i--)
        {
            const i4 = i * 4
            data[i4 + 3] = Math.max(data[i4 + 3] - this.game.ticker.deltaScaled * 0.2, 0)
        }


        // Draw new position
        data[0] = this.position.x
        data[1] = this.position.y
        data[2] = this.position.z
        data[3] = this.alpha

        this.dataTexture.needsUpdate = true
    }
}