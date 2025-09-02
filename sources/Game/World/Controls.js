import { Game } from '../Game.js'
import { Inputs } from '../Inputs/Inputs.js'
import { InteractiveAreas } from '../InteractiveAreas.js'
import { Modals } from '../Modals.js'

export class Controls
{
    constructor(references)
    {
        this.game = Game.getInstance()
        
        this.references = references

        this.setModal()
        this.setInteractiveArea()
    }

    setModal()
    {
        this.modal = {}
        this.modal.instance = this.game.modals.items.get('controls')

        this.modal.instance.events.on('close', () =>
        {
            this.interactiveArea.reveal()
        })

        this.game.inputs.events.on('modeChange', () =>
        {
            // Modal 
            if(this.game.modals.state !== Modals.CLOSED)
                return
            
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
                this.modal.instance.tabs.goTo('gamepad')
            else if(this.game.inputs.mode === Inputs.MODE_MOUSEKEYBOARD)
                this.modal.instance.tabs.goTo('mouse-keyboard')
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
                this.modal.instance.tabs.goTo('touch')
        })
    }

    setInteractiveArea()
    {
        this.interactiveArea = this.game.interactiveAreas.create(
            this.references.get('interactiveArea')[0].position,
            'Controls',
            InteractiveAreas.ALIGN_RIGHT,
            () =>
            {
                this.game.inputs.touchButtons.clearItems()
                this.game.modals.open('controls')
                this.interactiveArea.hide()
            },
            () =>
            {
                this.game.inputs.touchButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.touchButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.touchButtons.removeItems(['interact'])
            }
        )
    }
}