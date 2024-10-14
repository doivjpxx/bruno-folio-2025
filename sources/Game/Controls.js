export class Controls
{
    constructor()
    {
        this.map = [
            { name: 'up', keys: [ 'ArrowUp', 'KeyW' ] },
            { name: 'right', keys: [ 'ArrowRight', 'KeyD' ] },
            { name: 'down', keys: [ 'ArrowDown', 'KeyS' ] },
            { name: 'left', keys: [ 'ArrowLeft', 'KeyA' ] },
        ]

        this.keys = {}

        for(const _map of this.map)
        {
            this.keys[_map.name] = false
        }

        addEventListener('keydown', (_event) =>
        {
            this.down(_event.code)
        })

        addEventListener('keyup', (_event) =>
        {
            this.up(_event.code)
        })
    }

    down(key)
    {
        const map = this.map.find((_map) => _map.keys.indexOf(key) !== - 1 )

        if(map)
            this.keys[map.name] = true
    }

    up(key)
    {
        const map = this.map.find((_map) => _map.keys.indexOf(key) !== - 1 )

        if(map)
            this.keys[map.name] = false
    }
}