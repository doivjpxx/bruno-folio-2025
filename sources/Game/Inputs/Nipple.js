export class Nipple
{
    constructor(container, eventsTarget)
    {
        this.container = container
        this.eventsTarget = eventsTarget

        this.edgeRadius = 90
        this.thumbRadius = 30
        this.maxRadius = this.edgeRadius

        this.active = false
        this.anchorX = 0
        this.anchorY = 0
        this.x = 0
        this.y = 0
        this.angle = 0
        this.strength = 0
        this.thick = false

        this.setElements()
        this.setForward()
        this.setEvents()
    }

    setElements()
    {
        // Main element
        this.element = document.createElement('div')
        this.element.classList.add('nipple')
        this.element.style.setProperty('--edgeRadius', `${this.edgeRadius}px`)
        this.element.style.setProperty('--thumbRadius', `${this.thumbRadius}px`)

        // Outer edge
        this.edge = document.createElement('div')
        this.edge.classList.add('edge')
        this.element.append(this.edge)

        // Thumb
        this.thumb = document.createElement('div')
        this.thumb.classList.add('thumb')
        this.element.append(this.thumb)

        // Add to container
        this.container.append(this.element)
    }

    setForward()
    {
        this.forward = {}
        this.forward.amplitude = 0
        this.forward.angle = 0

        // Element
        this.forward.element = document.createElement('div')
        this.forward.element.classList.add('forward')
        this.edge.append(this.forward.element)

        // Strokes
        this.forward.strokeLeft = document.createElement('div')
        this.forward.strokeLeft.classList.add('stroke')
        this.forward.element.append(this.forward.strokeLeft)
        
        this.forward.strokeRight = document.createElement('div')
        this.forward.strokeRight.classList.add('stroke')
        this.forward.element.append(this.forward.strokeRight)

        // Canvas
        this.forward.canvas = document.createElement('canvas')
        this.forward.canvas.classList.add('forward-canvas')
        this.forward.canvas.width = this.edgeRadius * 2
        this.forward.canvas.height = this.edgeRadius * 2
        this.forward.element.append(this.forward.canvas)

        // Context
        this.forward.context = this.forward.canvas.getContext('2d')

        this.forward.setAmplitude = (amplitude) =>
        {
            // Same amplitude
            if(amplitude === this.forward.amplitude)
                return

            // Update canvas
            this.forward.context.beginPath()
            this.forward.context.moveTo(this.edgeRadius, this.edgeRadius)
            this.forward.context.arc(this.edgeRadius, this.edgeRadius, this.edgeRadius - 1, - amplitude * 0.5, amplitude * 0.5)

            const gradient = this.forward.context.createRadialGradient(
                this.edgeRadius, this.edgeRadius, 0,
                this.edgeRadius, this.edgeRadius, this.edgeRadius
            )
            gradient.addColorStop(0, '#ffffff33')
            gradient.addColorStop(1, '#ffffff00')
            this.forward.context.fillStyle = gradient
            this.forward.context.fill()

            // Strokes
            this.forward.strokeLeft.style.transform = `rotate(${-amplitude * 0.5}rad)`
            this.forward.strokeRight.style.transform = `rotate(${amplitude * 0.5}rad)`
            
            // Save
            this.forward.amplitude = amplitude
        }

        this.forward.setAngle = (angle) =>
        {
            // Same angle
            if(angle === this.forward.angle)
                return

            this.forward.element.style.transform = `rotate(${angle}rad)`
            
            // Save
            this.forward.angle = angle
        }
    }

    setThick(thick)
    {
        // Same thickness
        if(thick === this.thick)
            return

        if(thick)
            this.element.classList.add('is-thick')
        else
            this.element.classList.remove('is-thick')
        
        // Save
        this.thick = thick
    }

    setEvents()
    {
        const start = (_event) =>
        {
            if(_event.touches.length === 1)
                this.start(_event.touches[0].clientX, _event.touches[0].clientY)
            else
                this.end()

            this.eventsTarget.addEventListener('touchmove', move, { passive: true })
            this.eventsTarget.addEventListener('touchend', end, { passive: true })
        }

        const move = (_event) =>
        {
            if(_event.touches.length === 1)
                this.move(_event.touches[0].clientX, _event.touches[0].clientY)
        }

        const end = () =>
        {
            this.end()

            this.eventsTarget.removeEventListener('touchmove', move)
            this.eventsTarget.addEventListener('touchend', end, { passive: true })
        }

        this.eventsTarget.addEventListener('touchstart', start, { passive: true })
    }

    start(x, y)
    {
        this.active = true
        this.anchorX = x
        this.anchorY = y
        this.x = 0
        this.y = 0
        this.angle = 0
        this.strength = 0

        this.edge.style.transform = 'translate(0, 0)'
        this.thumb.style.transform = 'translate(0, 0)'

        this.element.style.left = `${this.anchorX}px`
        this.element.style.top = `${this.anchorY}px`
        this.element.classList.add('is-visible')
    }

    move(x, y)
    {
        this.x = x - this.anchorX
        this.y = y - this.anchorY
        this.angle = Math.atan2(this.y, this.x)

        this.radius = Math.hypot(this.x, this.y)

        if(this.radius > this.maxRadius)
        {
            const overflow = this.radius - this.maxRadius
            const dampedOverflow = Math.sqrt(1 + overflow)

            const edgeX = Math.cos(this.angle) * dampedOverflow * 2
            const edgeY = Math.sin(this.angle) * dampedOverflow * 2

            this.edge.style.transform = `translate(${edgeX}px, ${edgeY}px)`

            this.x = Math.cos(this.angle) * (this.maxRadius + dampedOverflow * 3)
            this.y = Math.sin(this.angle) * (this.maxRadius + dampedOverflow * 3)
        }

        this.strength = Math.min(this.radius / this.maxRadius, 1)

        this.thumb.style.transform = `translate(${this.x}px, ${this.y}px)`
    }

    end()
    {
        this.active = false
        this.x = 0
        this.y = 0
        this.angle = 0
        this.strength = 0

        this.element.classList.remove('is-visible')
    }
}