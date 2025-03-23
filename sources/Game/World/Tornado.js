import * as THREE from 'three/webgpu'
import { luminance, cos, float, min, time, atan, uniform, pass, PI, PI2, color, positionLocal, oneMinus, sin, texture, Fn, uv, vec2, vec3, vec4, mix, step, max, smoothstep, remap } from 'three/tsl'
import { Game } from '../Game.js'

const skewedUv = Fn(([ uv, skew ]) =>
{
    return vec2(
        uv.x.add(uv.y.mul(skew.x)),
        uv.y.add(uv.x.mul(skew.y))
 )
})

const twistedCylinder = Fn(([ position, parabolStrength, parabolOffset, parabolAmplitude, time ]) =>
{
    const angle = atan(position.z, position.x).toVar()
    const elevation = position.y

    // parabol
    const radius = parabolStrength.mul(position.y.sub(parabolOffset)).pow(2).add(parabolAmplitude).toVar()

    // turbulences
    radius.addAssign(sin(elevation.sub(time).mul(20).add(angle.mul(2))).mul(0.05))

    const twistedPosition = vec3(
        cos(angle).mul(radius),
        elevation,
        sin(angle).mul(radius)
 )

    return twistedPosition
})

export class Tornado
{
    constructor()
    {
        this.game = Game.getInstance()

        this.group = new THREE.Group()
        this.group.position.x = 30
        this.group.position.z = - 13
        this.game.scene.add(this.group)

        // Uniforms
        const baseColor = uniform(color('#ff544d'))
        const emissive = uniform(8)
        const timeScale = uniform(0.05)
        const parabolStrength = uniform(1.4)
        const parabolOffset = uniform(0.4)
        const parabolAmplitude = uniform(0.25)

        // Geometry
        const geometry = new THREE.CylinderGeometry(1, 1, 1, 32, 16, true)
        geometry.translate(0, 0.5, 0)

        // Material
        const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide, wireframe: false, depthWrite: true, depthTest: true })

        material.positionNode = twistedCylinder(positionLocal, parabolStrength, parabolOffset, parabolAmplitude.sub(0.05), time.mul(timeScale).mul(2))

        material.outputNode = Fn(() =>
        {
            const scaledTime = this.game.ticker.elapsedScaledUniform.mul(timeScale)

            /**
             * Outer fade
             */
            const y = uv().y.sub(1).pow(2).oneMinus()
            const heightModifier = cos(y.mul(2).add(1).mul(PI))
            heightModifier.assign(remap(heightModifier, -1, 1, -1, 1))

            /**
             * Emissive
             */
            // Noise 1
            const emissiveNoise1Uv = uv().add(vec2(scaledTime, scaledTime.negate())).toVar()
            emissiveNoise1Uv.assign(skewedUv(emissiveNoise1Uv, vec2(- 1, 0)).mul(vec2(4, 0.5)))
            const emissiveNoise1 = texture(this.game.noises.others, emissiveNoise1Uv, 1).r.remap(0.45, 0.7)

            // Noise 2
            const emissiveNoise2Uv = uv().add(vec2(scaledTime.mul(0.5), scaledTime.negate())).toVar()
            emissiveNoise2Uv.assign(skewedUv(emissiveNoise2Uv, vec2(- 1, 0)).mul(vec2(10, 2)))
            const emissiveNoise2 = texture(this.game.noises.others, emissiveNoise2Uv, 1).r.remap(0.45, 0.7)

            // Final noise
            const emissiveNoise = emissiveNoise1.mul(emissiveNoise2).add(heightModifier)
            emissiveNoise.assign(smoothstep(0, 0.4, emissiveNoise))

            // Color
            const emissiveColor = baseColor.mul(emissive)

            /**
             * Goo
             */
            // Noise 1
            const gooNoise1Uv = uv().add(vec2(scaledTime.mul(0.88), scaledTime.mul(0.88).negate())).add(vec2(0.5)).toVar();
            gooNoise1Uv.assign(skewedUv(gooNoise1Uv, vec2(- 1, 0)).mul(vec2(3, 0.4)));
            const gooNoise1 = texture(this.game.noises.others, gooNoise1Uv, 1).r.remap(0.45, 0.7);

            // Noise 2
            const gooNoise2Uv = uv().add(vec2(scaledTime.mul(0.66), scaledTime.mul(0.66).negate())).add(vec2(0.5)).toVar();
            gooNoise2Uv.assign(skewedUv(gooNoise2Uv,vec2(- 1, 0)).mul(vec2(8, 2)));
            const gooNoise2 = texture(this.game.noises.others, gooNoise2Uv, 1).r.remap(0.45, 0.7);

            // Final noise
            const gooNoise = gooNoise1.mul(gooNoise2).add(heightModifier);
            const gooMix = step(0.2, gooNoise)

            // Color
            const gooColor = this.game.fog.strength.mix(vec3(0), this.game.fog.color) // Fog

            /**
             * Alpha
             */
            const alpha = max(emissiveNoise, gooMix)

            // Discard
            alpha.lessThan(0.001).discard()

            /**
             * Output
             */
            const finalColor = mix(emissiveColor, gooColor, gooMix)
            return vec4(vec3(finalColor), alpha)
        })()

        // Mesh
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = 0.5
        mesh.scale.set(8, 8, 8)
        this.group.add(mesh)

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '🌪️ Tornado',
                expanded: true
            })

            debugPanel.addBinding(parabolStrength, 'value', { label: 'parabolStrength', min: 0, max: 2, step: 0.001 })
            debugPanel.addBinding(parabolOffset, 'value', { label: 'parabolOffset', min: 0, max: 2, step: 0.001 })
            debugPanel.addBinding(parabolAmplitude, 'value', { label: 'parabolAmplitude', min: 0, max: 2, step: 0.001 })
        }
    }
}
