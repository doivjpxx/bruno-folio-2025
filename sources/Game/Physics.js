import { Game } from './Game.js'

export class Physics
{
    constructor()
    {
        this.game = new Game()

        this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 })

        this.setExample()
        this.game.time.events.on('tick', () =>
        {
            this.update()
        })
    }

    setExample()
    {
        // Create the ground
        const groundCollider = RAPIER.ColliderDesc.cuboid(10.0, 1, 10.0).setTranslation(0.0, - 1.01, 0.0)
        this.world.createCollider(groundCollider)

        // // Create a dynamic rigid-body with collider
        // const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        //     .setTranslation(0.0, 1.0, 0.0);
        // this.rigidBody = this.world.createRigidBody(rigidBodyDesc);
        // this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), this.rigidBody);
    }

    update()
    {
        this.world.step()

        // const position = this.rigidBody.translation()

        // console.log(position)

        this.world.vehicleControllers.forEach((_vehicleController) =>
        {
            _vehicleController.updateVehicle(this.world.timestep)
        })
    }
}