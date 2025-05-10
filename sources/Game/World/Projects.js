import * as THREE from 'three/webgpu'
import { Fn, normalWorld, texture } from 'three/tsl'
import { Game } from '../Game.js'

export class Projects
{
    constructor(carpet)
    {
        this.game = Game.getInstance()
        this.carpet = carpet
    }
}