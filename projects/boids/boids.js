function main(){
    const app = new PIXI.Application({width: 768, height: 768});
    const x = document.querySelector('#canvas')
    x.appendChild(app.view);
    const container = new PIXI.Container();
    app.stage.addChild(container);
    

    let boids = [];
    const BOID_COUNT = 10;
    const SPEED = 1;
    let angle = Math.PI/2;
    //limit turning angle
    //limit seeing angle
    let texture = PIXI.Texture.from('boid2.png');

    boids.push(new Boid(new PIXI.Sprite(texture)));
    boids[boids.length - 1].boid.anchor.set(0.5);
    let pos = [Math.floor(Math.random() * 768), Math.floor(Math.random() * 768)];
    boids[boids.length - 1].boid.position.set(pos[0], pos[1]);
    container.addChild(boids[boids.length - 1].boid);

    texture = PIXI.Texture.from('boid.png');

    for(let i = 0; i < BOID_COUNT; i++){
        boids.push(new Boid(new PIXI.Sprite(texture)));
        boids[boids.length - 1].boid.anchor.set(0.5);
        let pos = [Math.floor(Math.random() * 768), Math.floor(Math.random() * 768)];
        boids[boids.length - 1].boid.position.set(pos[0], pos[1]);
        container.addChild(boids[boids.length - 1].boid);
    }

    app.ticker.add((delta) => {
        angle = periodic(angle + Math.PI / 100);
        for(let i = 0; i < boids.length; i++){
            boids[i].update(SPEED, angle);
            for(let j = 0; j < boids.length; j++){
                if(i == j){continue;}
                if(boids[i].distanceTo(boids[j]) < Boid.DETECTION_RADIUS && Math.abs(boids[i].angleTo(boids[j])) < Boid.DETECTION_ANGLE){
                    boids[i].update(SPEED * 1, angle);
                    continue;
                }
            }
        }
    });
}

function mod(n, m){ //JS % is remainder, not mod
        return ((n % m) + m) % m;
}

function periodic(angle){
    if(angle > Math.PI){
        return angle - 2 * Math.PI;
    }else if(angle < -Math.PI){
        return angle + 2 * Math.PI;
    }else{
        return angle;
    }
}

class Boid{
    static DETECTION_RADIUS = 3000;
    static DETECTION_ANGLE = 3 * Math.PI / 4;
    constructor(boid){
        this.boid = boid;
    }

    update(speed, angle){
        this.boid.rotation = angle;
        this.boid.x += Math.sin(angle) * speed;
        if(this.boid.x >= 768 || this.boid.x < 0){
            this.boid.x = mod(this.boid.x, 768);
        }
        this.boid.y -= Math.cos(angle) * speed;
        if(this.boid.y >= 768 || this.boid.y < 0){
            this.boid.y = mod(this.boid.y, 768);
        }
    }

    distanceTo(other){
        return Math.sqrt(((this.boid.x - other.boid.x) ** 2) + ((this.boid.y - other.boid.y) ** 2));
    }

    angleTo(other){
        let z = (-(Math.atan2((this.boid.y - other.boid.y), (other.boid.x - this.boid.x)) - Math.PI / 2)) - this.boid.rotation;
        if(z > Math.PI){ //Works, but ugly
            z -= 2 * Math.PI;
        }
        return z;
    }
}

document.addEventListener("DOMContentLoaded", main);
