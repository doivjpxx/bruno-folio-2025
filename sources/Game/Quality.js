import { Events } from './Events.js'
import { Game } from './Game.js'

export class Quality
{
    constructor()
    {
        this.game = Game.getInstance()

        this.events = new Events()

        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        this.level = isMobile ? 1 : 0 // 0 = highest quality

        this.setToggle()

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '⚙️ Quality',
                expanded: true,
            })

            this.game.debug.addButtons(
                debugPanel,
                {
                    low: () =>
                    {
                        this.changeLevel(1)
                    },
                    high: () =>
                    {
                        this.changeLevel(0)
                    },
                },
                'change'
            )
        }
    }

    setToggle()
    {
        this.toggle = {}
        this.toggle.buttonElement = this.game.domElement.querySelector('.js-quality-toggle')
        this.toggle.buttonElement.textContent = this.level === 0 ? 'High' : 'Low'

        this.toggle.activate = () =>
        {
            this.changeLevel(this.level === 0 ? 1 : 0)
        }

        this.toggle.buttonElement.addEventListener('click', this.toggle.activate)
    }

    changeLevel(level = 0)
    {
        // Same
        if(level === this.level)
            return
            
        this.level = level
        this.toggle.buttonElement.textContent = this.level === 0 ? 'High' : 'Low'
        this.events.trigger('change', [ this.level ])
    }
}