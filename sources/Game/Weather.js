import { Game } from './Game.js'
import { remapClamp } from './utilities/maths.js'

export class Weather
{
    constructor()
    {
        this.game = Game.getInstance()

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🌦️ Weather',
                expanded: false,
            })
        }

        this.properties = []

        // Temperature
        this.addProperty(
            'temperature',
            -15,
            40,
            () =>
            {
                const yearValue = this.game.yearCycles.properties.temperature.value
                const dayValue = this.game.dayCycles.properties.temperature.value

                const frequency = 0.4
                const amplitude = 7.5
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * amplitude

                return yearValue + dayValue + variation
            }
        )

        // Humidity
        this.addProperty(
            'humidity',
            0,
            1,
            () =>
            {
                const yearValue = this.game.yearCycles.properties.humidity.value

                const frequency = 0.36
                const amplitude = 0.2
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * amplitude

                return yearValue + variation
            }
        )

        // Electric field
        this.addProperty(
            'electricField',
            -1,
            1,
            () =>
            {
                const dayValue = this.game.dayCycles.properties.electricField.value
                
                const frequency = 0.53
                const amplitude = 1
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * amplitude

                return dayValue * variation
            }
        )

        // Clouds
        this.addProperty(
            'clouds',
            -1,
            1,
            () =>
            {
                const frequency = 0.44
                const amplitude = 1
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * amplitude
                return variation
            }
        )

        // Wind
        this.addProperty(
            'wind',
            0,
            1,
            () =>
            {
                const frequency = 1
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * 0.5 + 0.5
                return variation
            }
        )

        // Rain
        this.addProperty(
            'rain',
            0,
            1,
            () =>
            {
                return remapClamp(this.humidity.value, 0.5, 1, 0, 1) * remapClamp(this.clouds.value, 0, 1, 0, 1)
            }
        )
        
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    noise(x)
    {
        return Math.sin(x) * Math.sin(x * 1.678) * Math.sin(x * 2.345)
    }

    addProperty(name, min, max, get)
    {
        const property = {}
        property.manual = false
        property.min = min
        property.max = max

        property.value = get()
        property.manualValue = property.value

        // Debug
        property.binding = this.game.debug.addManualBinding(
            this.debugPanel,
            property,
            'value',
            { label: name, min: property.min, max: property.max, step: 0.001 },
            () =>
            {
                return get()
            }
        )

        if(this.game.debug.active)
        {
            this.debugPanel.addBinding(property, 'value', { readonly: true })
            this.debugPanel.addBinding(
                property,
                'value',
                {
                    label: `${property.min} -> ${property.max}`,
                    readonly: true,
                    view: 'graph',
                    min: property.min,
                    max: property.max,
                }
            )
            this.debugPanel.addBlade({ view: 'separator' })
        }

        this[name] = property
        this.properties.push(property)
    }

    update()
    {
        for(const property of this.properties)
            property.binding.update()
    }
}