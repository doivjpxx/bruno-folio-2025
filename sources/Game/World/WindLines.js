import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { Line2 } from 'three/addons/lines/webgpu/Line2.js'
import { attribute, cameraPosition, cameraProjectionMatrix, cross, float, floor, Fn, If, modelViewMatrix, normalLocal, normalWorld, positionGeometry, positionLocal, uniform, vec2, vec3, vec4, vertexIndex, viewport } from 'three/tsl'
// import { Line2NodeMaterial } from 'three/webgpu'

export class WindLines
{
    constructor()
    {
        this.game = Game.getInstance()

        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-5, 2, 0),
            new THREE.Vector3(0, 4, 0),
            new THREE.Vector3(5, 2, 0),
        ])

        const count = 50
        
        const points = curve.getPoints(count)
        
        const positions = new Float32Array(count * 3 * 3 * 2)
        const directions = new Float32Array(count * 3 * 3 * 2)
        const indices = new Float32Array((count - 1) * 2 * 3)

        console.log((count - 1) * 2 * 3)
        
        for(let i = 0; i < count; i++)
        {
            const i18 = i * 18
            const i6 = i * 6

            const point = points[i]
            const nextPoint = points[Math.min(i + 1, count - 1)]
            const nextPoint2 = points[Math.min(i + 2, count - 1)]




            positions[i18 + 0] = nextPoint.x
            positions[i18 + 1] = nextPoint.y
            positions[i18 + 2] = nextPoint.z

            positions[i18 + 3] = point.x
            positions[i18 + 4] = point.y
            positions[i18 + 5] = point.z

            positions[i18 + 6] = point.x
            positions[i18 + 7] = point.y
            positions[i18 + 8] = point.z




            positions[i18 + 9]  = point.x
            positions[i18 + 10] = point.y
            positions[i18 + 11] = point.z

            positions[i18 + 12] = nextPoint.x
            positions[i18 + 13] = nextPoint.y
            positions[i18 + 14] = nextPoint.z

            positions[i18 + 15] = nextPoint.x
            positions[i18 + 16] = nextPoint.y
            positions[i18 + 17] = nextPoint.z




            const direction = nextPoint.clone().sub(point).normalize()
            const direction2 = nextPoint2.clone().sub(nextPoint).normalize()
            
            directions[i18 + 0] = direction2.x
            directions[i18 + 1] = direction2.y
            directions[i18 + 2] = direction2.z

            directions[i18 + 3] = direction.x
            directions[i18 + 4] = direction.y
            directions[i18 + 5] = direction.z

            directions[i18 + 6] = direction.x
            directions[i18 + 7] = direction.y
            directions[i18 + 8] = direction.z

            directions[i18 + 9]  = direction.x
            directions[i18 + 10] = direction.y
            directions[i18 + 11] = direction.z

            directions[i18 + 12] = direction2.x
            directions[i18 + 13] = direction2.y
            directions[i18 + 14] = direction2.z

            directions[i18 + 15] = direction2.x
            directions[i18 + 16] = direction2.y
            directions[i18 + 17] = direction2.z

            // indices[i6 + 0] = i + 1
            // indices[i6 + 1] = i
            // indices[i6 + 2] = i
            // indices[i6 + 3] = i
            // indices[i6 + 4] = i + 1
            // indices[i6 + 5] = i + 1
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        geometry.setAttribute('direction', new THREE.Float32BufferAttribute(directions, 3))
        // geometry.setIndex(new THREE.Float32BufferAttribute(indices))

        const material = new THREE.MeshBasicNodeMaterial({ wireframe: true })

        material.positionNode = Fn(() =>
        {

            const toCamera = positionLocal.sub(cameraPosition).normalize()

            const sideDirection = cross(attribute('direction'), toCamera).normalize()
            const newPosition = positionLocal

            const vertexIndexFloat = vertexIndex.toFloat()
            const sideStep = floor(vertexIndexFloat.sub(2).div(3).mod(2)).sub(0.5)
            
            return newPosition.add(sideDirection.mul(sideStep))
        })()

        const line = new THREE.Mesh(geometry, material)
        this.game.scene.add(line)
    }
}