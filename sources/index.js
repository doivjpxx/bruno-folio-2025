import './threejs-override.js'
import { Game } from './Game/Game.js'
import * as THREE from 'three/webgpu'

console.log(THREE.REVISION)
window.game = new Game()
