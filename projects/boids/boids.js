"use strict";

function main(){
    const app = new PIXI.Application({width: 768, height: 768});
    const x = document.querySelector('#canvas')
    x.appendChild(app.view);
    const container = new PIXI.Container();
    app.stage.addChild(container);
    
    let boids = [];
    const BOID_COUNT = 20;
    const SPEED = 3;
    const TURN_RATE =  Math.PI / 100;
    let angle = Math.PI/2;
    let texture = PIXI.Texture.from('boid2.png');

    boids.push(new Boid(new PIXI.Sprite(texture)));
    boids[boids.length - 1].boid.anchor.set(0.5);
    let pos = [Math.floor(Math.random() * 768), Math.floor(Math.random() * 768)];
    boids[boids.length - 1].boid.position.set(pos[0], pos[1]);
    container.addChild(boids[boids.length - 1].boid);

    texture = PIXI.Texture.from('boid.png');

    for(let i = 1; i < BOID_COUNT; i++){
        boids.push(new Boid(new PIXI.Sprite(texture)));
        boids[boids.length - 1].boid.anchor.set(0.5);
        let pos = [Math.floor(Math.random() * 768), Math.floor(Math.random() * 768)];
        boids[boids.length - 1].boid.position.set(pos[0], pos[1]);
        container.addChild(boids[boids.length - 1].boid);
    }

    app.ticker.add((delta) => { // 3rd rule: direct towards center of other boids
        for(let i = 0; i < BOID_COUNT; i++){
            angle = periodic(boids[i].boid.rotation + TURN_RATE);
            let newAngle = angle;
            let {dist, wall} = boids[i].distanceToWall();
            if(dist <= Boid.AVOIDANCE_RADIUS){
                //TODO Wall avoidance
                
            }

            let closeBoids = [];
            for(let j = 0; j < BOID_COUNT; j++){ // Currently it will follow the boid with highest ID
                if(i == j){continue;}
                let boidAngle = boids[i].angleTo(boids[j]);
                if(boids[i].distanceTo(boids[j]) < Boid.DETECTION_RADIUS && Math.abs(boidAngle) < Boid.DETECTION_ANGLE){ // Should take from each boid
                    if(boids[i].distanceTo(boids[j]) < Boid.AVOIDANCE_RADIUS || false){
                        newAngle = (Math.sign(-boidAngle) * Boid.MAX_TURN_ANGLE) + boids[i].boid.rotation;
                        break;
                    }

                    closeBoids.push(boids[j]);

                    newAngle = boidAngle / 2;
                    if(Math.abs(newAngle - boids[i].boid.rotation) > Boid.MAX_TURN_ANGLE){ // Wanna make it less fixed, maybe
                        newAngle = (boidAngle * 0.01) + boids[i].boid.rotation;
                    }
                    //boids[i].update(SPEED * .1, newAngle);
                }
            }
            let combAngle = 0;

            for(let k = 0; k < closeBoids.length; k++){
                console.log(combAngle)
                combAngle += boids[i].angleTo(closeBoids[k]);
            }
            combAngle = (combAngle / closeBoids.length) / 2;
            //console.log(closeBoids.length)
            boids[i].update(SPEED, combAngle);
        }
    });
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

class Boid{ //Prob gonna rewrite
    static DETECTION_RADIUS = 400;
    static DETECTION_ANGLE = 3 * Math.PI / 4;
    static AVOIDANCE_RADIUS = 10;
    static MAX_TURN_ANGLE = Math.PI / 12000;

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

        function mod(n, m){ //JS % is remainder, not mod
            return ((n % m) + m) % m;
        }
    }

    distanceToWall(){
        let x1 = this.boid.x;
        let x2 = 768 - x1;
        let y1 = this.boid.y;
        let y2 = 768 - y1;
        let min = Math.min(x1, x2, y1, y2);
        let wall = "";
        switch(min){
            case x1:
                 wall = "left";
                break;
            case x2:
                 wall = "right";
                break;
            case y1:
                 wall = "top";
                break;
            case y2:
                 wall = "bottom";
        }

        return {
            dist: min,
            wall: wall
        };
    }

    distanceTo(other){ // Could be used for obstacle avoidance
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
