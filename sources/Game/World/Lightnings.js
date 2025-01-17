import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { attribute, cameraPosition, cameraProjectionMatrix, cameraViewMatrix, color, cross, float, floor, Fn, instancedArray, min, modelWorldMatrix, mul, positionGeometry, step, uniform, vec4, vertexIndex } from 'three/tsl'
import { LineGeometry } from '../Geometries/LineGeometry.js'
import gsap from 'gsap'

export class Lightnings
{
    constructor()
    {
        this.game = Game.getInstance()

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '⚡️ Lightnings',
                expanded: true,
            })
            this.tweaksToRefresh = []
        }

        this.materialReference = this.game.materials.createEmissive('lightnings', '#4c8bff', 4, this.debugPanel)

        this.setAnticipationParticles()
        this.setArc()
        this.setExplosionParticles()

        gsap.delayedCall(1, () => { this.create(new THREE.Vector3(3, 0, 2)) })
        gsap.delayedCall(4, () => { this.create(new THREE.Vector3(-3, 0, 2)) })
    }

    setAnticipationParticles()
    {
        this.anticipationParticles = {}
        this.anticipationParticles.count = 32
        this.anticipationParticles.duration = 5

        // Uniforms
        const scaleUniform = uniform(0.07)

        // Buffers
        const positionArray = new Float32Array(this.anticipationParticles.count * 3)
        const scaleArray = new Float32Array(this.anticipationParticles.count)

        for(let i = 0; i < this.anticipationParticles.count; i++)
        {
            const i3 = i * 3
            const angle = Math.PI * 2 * Math.random()
            const radius = Math.random() * 3
            positionArray[i3 + 0] = Math.sin(angle) * radius
            positionArray[i3 + 1] = - Math.random() * 0.5
            positionArray[i3 + 2] = Math.cos(angle) * radius

            scaleArray[i] = Math.random() * 0.75 + 0.25
        }

        this.anticipationParticles.positionAttribute = instancedArray(positionArray, 'vec3').toAttribute()
        this.anticipationParticles.scaleAttribute = instancedArray(scaleArray, 'float').toAttribute()

        this.anticipationParticles.geometry = new THREE.PlaneGeometry()
        this.anticipationParticles.geometry.rotateZ(Math.PI * 0.25)
        this.anticipationParticles.geometry.rotateZ(Math.PI * 0.25)

        // Position node
        this.anticipationParticles.positionNode = Fn(([_startTime]) =>
        {
            const localTime = this.game.time.elapsedScaledUniform.sub(_startTime)
            const finalPosition = this.anticipationParticles.positionAttribute.toVar()
            const timeProgress = min(localTime.div(this.anticipationParticles.duration), 1)
            
            finalPosition.y.addAssign(timeProgress.mul(1.5))

            return finalPosition
        })

        // Scale node
        this.anticipationParticles.scaleNode = Fn(([_startTime]) =>
        {
            const localTime = this.game.time.elapsedScaledUniform.sub(_startTime)
            const duration = float(this.anticipationParticles.duration)
            const timeScale = localTime.remapClamp(duration.mul(0.5), duration, 1, 0)
            const finalScale = this.anticipationParticles.scaleAttribute.mul(scaleUniform).mul(timeScale)
            return finalScale
        })

        // Create
        this.anticipationParticles.create = (coordinates) =>
        {
            // Uniforms
            const startTime = uniform(this.game.time.elapsedScaled)
            
            // Material
            const material = new THREE.SpriteNodeMaterial()
            material.color = this.materialReference.color
            material.positionNode = this.anticipationParticles.positionNode(startTime)
            material.scaleNode = this.anticipationParticles.scaleNode(startTime)
            
            const mesh = new THREE.Mesh(this.anticipationParticles.geometry, material)
            mesh.position.copy(coordinates)
            mesh.rotation.y = Math.random() * 2
            mesh.count = this.anticipationParticles.count
            this.game.scene.add(mesh)

            return material
        }
    }

    setArc()
    {
        this.arc = {}
        this.arc.duration = 3

        // Uniforms
        const thickness = uniform(0.1)

        // Geometry
        const points = []
        const pointsCount = 15
        const height = 15
        const interY = height / (pointsCount - 1)

        for(let i = 0; i < pointsCount; i++)
        {
            const point = new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                i * interY,
                (Math.random() - 0.5) * 1
            )
            points.push(point)
        }

        this.arc.geometry = new LineGeometry(points)

        // Vertex Node
        this.arc.vertexNode = Fn(([_startTime]) =>
        {
            const ratio = attribute('ratio')
            const tipness = ratio.step(0.01)
            const localTime = this.game.time.elapsedScaledUniform.sub(_startTime)
            const timeProgress = min(localTime.div(this.arc.duration), 1)
            
            const newPosition = positionGeometry.toVar()
            newPosition.xz.mulAssign(timeProgress.oneMinus().pow(5).oneMinus().mul(tipness.oneMinus()).add(1))

            const worldPosition = modelWorldMatrix.mul(vec4(newPosition, 1))
            const toCamera = worldPosition.xyz.sub(cameraPosition).normalize()

            const nextPosition = positionGeometry.add(attribute('direction'))
            const nextWorldPosition = modelWorldMatrix.mul(vec4(nextPosition, 1))
            const nextDelta = nextWorldPosition.xyz.sub(worldPosition.xyz).normalize()
            const tangent = cross(nextDelta, toCamera).normalize()
            
            const ratioThickness = ratio.mul(10).min(1)
            const timeThickness = timeProgress.oneMinus()
            const finalThickness = mul(thickness, ratioThickness, timeThickness)

            const sideStep = floor(vertexIndex.toFloat().mul(3).sub(2).div(3).mod(2)).sub(0.5)
            const sideOffset = tangent.mul(sideStep.mul(finalThickness))
            
            worldPosition.addAssign(vec4(sideOffset, 0))

            const viewPosition = cameraViewMatrix.mul(worldPosition)
            return cameraProjectionMatrix.mul(viewPosition)
        })

        // Create
        this.arc.create = (coordinates) =>
        {
            // Uniforms
            const startTime = uniform(this.game.time.elapsedScaled)

            // Material
            const material = new THREE.MeshBasicNodeMaterial({ wireframe: false })
            material.color = this.materialReference.color
            material.vertexNode = this.arc.vertexNode(startTime)

            const mesh = new THREE.Mesh(this.arc.geometry, material)
            mesh.position.copy(coordinates)
            mesh.rotation.y = Math.random() * 2
            this.game.scene.add(mesh)
            
            return material
        }
    }

    setExplosionParticles()
    {
        this.explosionParticles = {}
        this.explosionParticles.count = 128
        this.explosionParticles.duration = 4

        // Uniforms
        const scaleUniform = uniform(0.1)
        
        // Buffers
        const positionArray = new Float32Array(this.explosionParticles.count * 3)
        const scaleArray = new Float32Array(this.explosionParticles.count)

        for(let i = 0; i < this.explosionParticles.count; i++)
        {
            const i3 = i * 3
            const spherical = new THREE.Spherical(
                Math.random() + 2,
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            )
            const position = new THREE.Vector3().setFromSpherical(spherical)
            positionArray[i3 + 0] = position.x
            positionArray[i3 + 1] = position.y
            positionArray[i3 + 2] = position.z

            scaleArray[i] = Math.random() * 0.75 + 0.25
        }

        this.explosionParticles.positionAttribute = instancedArray(positionArray, 'vec3').toAttribute()
        this.explosionParticles.scaleAttribute = instancedArray(scaleArray, 'float').toAttribute()

        // Geometry
        this.explosionParticles.geometry = new THREE.PlaneGeometry()
        this.explosionParticles.geometry.rotateZ(Math.PI * 0.25)

        // Position node
        this.explosionParticles.positionNode = Fn(([_startTime]) =>
        {
            const localTime = this.game.time.elapsedScaledUniform.sub(_startTime)
            const timeProgress = min(localTime.div(float(this.explosionParticles.duration).mul(0.75)), 1)
            
            const newPosition = this.explosionParticles.positionAttribute.toVar()
            newPosition.mulAssign(timeProgress.oneMinus().pow(8).oneMinus())

            return newPosition
        })

        // Scale node
        this.explosionParticles.scaleNode = Fn(([_startTime]) =>
        {
            const localTime = this.game.time.elapsedScaledUniform.sub(_startTime)
            const timeScale = localTime.div(this.explosionParticles.duration).oneMinus().max(0)
            const finalScale = this.explosionParticles.scaleAttribute.mul(scaleUniform).mul(timeScale)
            return finalScale
        })

        // Create
        this.explosionParticles.create = (coordinates) =>
        {
            const startTime = uniform(this.game.time.elapsedScaled)
        
            const material = new THREE.SpriteNodeMaterial()
            material.color = this.materialReference.color
            material.positionNode = this.explosionParticles.positionNode(startTime)
            material.scaleNode = this.explosionParticles.scaleNode(startTime)
            
            const mesh = new THREE.Mesh(this.explosionParticles.geometry, material)
            mesh.position.copy(coordinates)
            mesh.count = this.explosionParticles.count
            mesh.rotation.y = Math.random() * 2
            this.game.scene.add(mesh)
            
            return material
        }
    }

    create(coordinates)
    {
        const disposables = []
        
        disposables.push(this.anticipationParticles.create(coordinates))

        gsap.delayedCall(this.anticipationParticles.duration, () =>
        {
            disposables.push(this.arc.create(coordinates))
            disposables.push(this.explosionParticles.create(coordinates))

            const duration = Math.max(this.arc.duration, this.explosionParticles.duration)
            gsap.delayedCall(duration, () =>
            {
                for(const disposable of disposables)
                {
                    disposable.dispose()
                }
            })
        })
    }
}