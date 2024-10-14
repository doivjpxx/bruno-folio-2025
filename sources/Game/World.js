import * as THREE from 'three/webgpu'
import { uniform, color, rangeFog } from 'three/webgpu'
import { Game } from './Game.js'
import MeshGridMaterial, { MeshGridMaterialLine } from './Materials/MeshGridMaterial.js'

export class World
{
    constructor()
    {
        this.game = new Game()

        this.scene = new THREE.Scene()
        this.scene.fogNode = rangeFog(color('#1b191f'), 50, 100)

        this.setGrid()

        // this.dummy = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshNormalMaterial()
        // )
        // this.dummy.position.x = 1
        // this.scene.add(this.dummy)

        // const axesHelper = new THREE.AxesHelper()
        // this.scene.add(axesHelper)

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 999)
    }

    setGrid()
    {
        const lines = [
            // new MeshGridMaterialLine('#444444', 0.1, 0.04),
            new MeshGridMaterialLine('#744134', 1, 0.02),
            new MeshGridMaterialLine('#ffffff', 10, 0.002),
        ]

        const uvGridMaterial = new MeshGridMaterial({
            color: '#1f1919',
            scale: 0.001,
            antialiased: true,
            reference: 'uv', // uv | world
            side: THREE.DoubleSide,
            lines
        })

        const grid = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000),
            uvGridMaterial
        )
        grid.rotation.x = - Math.PI * 0.5
        this.scene.add(grid)
    }

    update()
    {
    }
}