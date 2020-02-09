function main(){
    const app = new PIXI.Application({width: 768, height: 768});
    const x = document.querySelector('#canvas')
    x.appendChild(app.view);
    const container = new PIXI.Container();
    app.stage.addChild(container);
    

    let boids = [];
    const BOID_COUNT = 10;
    const texture = PIXI.Texture.from('boid2.png');
    for(let i = 0; i < BOID_COUNT; i++){
        const boid = new PIXI.Sprite(texture);
        boid.anchor.set(0.5);
        boid.x = (i % 5) * 40;
        boid.y = Math.floor(i / 5) * 40;
        container.addChild(boid);
    }


}

class BOID{
    constructor(){
        this.x = 1;
    }
}

document.addEventListener("DOMContentLoaded", main);
