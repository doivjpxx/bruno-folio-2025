import * as THREE from 'three'
import { Game } from '../Game.js'
import { lerp, remap, smoothstep } from '../utilities/maths.js'
import { Events } from '../Events.js'

export class Cycles
{
    constructor(name = 'Cycles', duration = 10, forcedProgress = null, manual = false)
    {
        this.game = Game.getInstance()

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: name,
                expanded: false,
            })
        }

        this.name = name
        this.duration = duration
        this.absoluteProgress = forcedProgress !== null ? forcedProgress : ((new Date()).getTime() / 1000 / this.duration)
        this.newAbsoluteProgress = this.absoluteProgress
        this.progress = this.absoluteProgress % 1
        this.progressDelta = 1
        this.keyframesList = []
        this.properties = []
        this.punctualEvents = []
        this.intervalEvents = []
        this.events = new Events()

        // Debug
        this.newAbsoluteProgressBinding = this.game.debug.addManualBinding(
            this.debugPanel,
            this,
            'newAbsoluteProgress',
            {
                view: 'cameraring',
                series: 0,
                unit: {
                    pixels: 100,
                    ticks: 4,
                    value: 1,
                    step: 0.001
                },
            },
            () =>
            {
                return forcedProgress !== null ? forcedProgress : ((new Date()).getTime() / 1000 / this.duration)
            },
            manual
        )

        this.setKeyframes()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
        this.update(true)
    }

    getKeyframesDescriptions()
    {
        return [
            [
                { properties: { test: 0 }, stop: 0.0 },
                { properties: { test: 1 }, stop: 0.5 },
                { properties: { test: 0 }, stop: 1 },
            ]
        ]
    }

    setKeyframes()
    {
        const keyframesDescriptions = this.getKeyframesDescriptions()

        for(const keyframesDescription of keyframesDescriptions)
        {
            this.values = this.createKeyframes(keyframesDescription)
        }
    }

    createKeyframes(steps)
    {
        const keyframes = {}
        keyframes.steps = steps

        for(const key in steps[0].properties)
        {
            if(key !== 'stop')
            {
                const property = {}
                property.value = steps[0].properties[key]

                if(property.value instanceof THREE.Color)
                {
                    property.type = 'color'
                    property.value = property.value.clone()
                }
                else if(typeof property.value === 'number')
                {
                    property.type = 'number'
                    property.value = property.value
                }

                this.properties[key] = property
            }
        }

        // Add fake steps to fix non 0-1 stops
        const firstStep = steps[0]
        const lastStep = steps[steps.length - 1]

        if(lastStep.stop < 1)
        {
            const newStep = { ...firstStep }
            newStep.stop = 1 + newStep.stop
            steps.push(newStep)
        }

        if(firstStep.stop > 0)
        {
            const newStep = { ...lastStep }
            newStep.stop = - (1 - newStep.stop)
            steps.unshift(newStep)
        }

        this.keyframesList.push(keyframes)

        return keyframes
    }

    update(firstFrame = false)
    {
        // New absolute progress
        this.newAbsoluteProgressBinding.update()
        this.progressDelta = this.newAbsoluteProgress - this.absoluteProgress // Delta
        this.absoluteProgress = this.newAbsoluteProgress

        // New progress
        const newProgress = this.absoluteProgress % 1

        // Test punctual events
        for(const punctualEvent of this.punctualEvents)
        {
            if(newProgress >= punctualEvent.progress && this.progress < punctualEvent.progress)
            {
                if(firstFrame)
                    requestAnimationFrame(() =>
                    {
                        this.events.trigger(punctualEvent.name)
                    })
                else
                    this.events.trigger(punctualEvent.name)
            }
        }

        // Test interval events
        for(const intervalEvent of this.intervalEvents)
        {
            const inInterval = newProgress > intervalEvent.startProgress && newProgress < intervalEvent.endProgress

            if(inInterval && !intervalEvent.inInverval)
            {
                intervalEvent.inInverval = true
                if(firstFrame)
                    requestAnimationFrame(() =>
                    {
                        this.events.trigger(intervalEvent.name, [ intervalEvent.inInverval ])
                    })
                else
                    this.events.trigger(intervalEvent.name, [ intervalEvent.inInverval ])
            }
            if(!inInterval && intervalEvent.inInverval)
            {
                intervalEvent.inInverval = false
                if(firstFrame)
                    requestAnimationFrame(() =>
                    {
                        this.events.trigger(intervalEvent.name, [ intervalEvent.inInverval ])
                    })
                else
                    this.events.trigger(intervalEvent.name, [ intervalEvent.inInverval ])
            }
        }

        // Progress
        this.progress = newProgress % 1

        for(const keyframe of this.keyframesList)
        {
            // Indices
            let indexPrev = -1
            let index = 0

            for(const step of keyframe.steps)
            {
                if(step.stop <= this.progress)
                    indexPrev = index

                index++
            }

            const indexNext = (indexPrev + 1) % keyframe.steps.length

            // Steps
            const stepPrevious = keyframe.steps[indexPrev]
            const stepNext = keyframe.steps[indexNext]

            // Mix ratio
            let mixRatio = 0
            // if(keyframe.interpolation === 'linear')
            //     mixRatio = remap(this.progress, stepPrevious.stop, stepNext.stop, 0, 1)
            // else if(keyframe.interpolation === 'smoothstep')
                mixRatio = smoothstep(this.progress, stepPrevious.stop, stepNext.stop)

            // Interpolate properties
            for(const key in this.properties)
            {
                const property = this.properties[key]

                if(property.type === 'color')
                    property.value.lerpColors(stepPrevious.properties[key], stepNext.properties[key], mixRatio)
                else if(property.type === 'number')
                    property.value = lerp(stepPrevious.properties[key], stepNext.properties[key], mixRatio)
            }
        }
    }

    addPunctualEvent(name, progress)
    {
        this.punctualEvents.push({ name, progress })
    }

    addIntervalEvent(name, startProgress, endProgress)
    {
        this.intervalEvents.push({ name, startProgress, endProgress, inInverval: false })
    }
}