import { Game } from './Game.js'
import { Modals } from './Modals.js'
import { Lab } from './World/Lab.js'
import { Projects } from './World/Projects.js'

export class ClosingManager
{
    constructor()
    {
        this.game = Game.getInstance()

        this.game.inputs.addActions([
            { name: 'close', categories: [ 'modal', 'cinematic', 'playing' ], keys: [ 'Keyboard.Escape', 'Gamepad.cross' ] },
            { name: 'pause', categories: [ 'modal', 'cinematic', 'playing' ], keys: [ 'Keyboard.KeyP', 'Gamepad.start' ] }
        ])
        
        this.game.inputs.events.on('close', (action) =>
        {
            if(action.active)
            {
                // Whispers flag select => Close
                if(this.game.world.whispers?.modal.flagsSelectOpen)
                    this.game.world.whispers.modal.closeFlagSelect()
                
                // Modal open => Close
                else if(this.game.modals.state === Modals.OPEN)
                {
                    this.game.modals.close()
                }

                // Projects => Close
                else if(this.game.world.areas?.projects?.state === Projects.STATE_OPEN)
                    this.game.world.areas.projects.close()

                // Lab => Close
                else if(this.game.world.areas?.lab?.state === Lab.STATE_OPEN)
                    this.game.world.areas.lab.close()

                // Nothing opened and used the keyboard Escape key => Open default modal
                else if(action.activeKeys.has('Keyboard.Escape'))
                    this.game.modals.open('intro')
            }
        })
        
        this.game.inputs.events.on('pause', (action) =>
        {
            if(action.active)
            {
                if((this.game.modals.state === Modals.OPEN || this.game.modals.state === Modals.OPENING))
                {
                    this.game.modals.close()
                }
                else
                {
                    this.game.modals.open('intro')
                }
            }
        })
    }
}