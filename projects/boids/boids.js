"use strict";

function main(){
    const app = new PIXI.Application({width: 768, height: 768});
    const x = document.querySelector('#canvas')
    x.appendChild(app.view);
    const container = new PIXI.Container();
    app.stage.addChild(container);
    
    let boids = [];
    const BOID_COUNT = 200;
    const SPEED = 1;
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
        boids[boids.length - 1].boid.position.set(pos[0], pos[1]); //Not working?
        container.addChild(boids[boids.length - 1].boid);
        boids[boids.length - 1].boid.rotation = (Math.random() * 2 * Math.PI) - Math.PI;
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
            let tooCloseBoids = [];
            let flockAngle = 0;
            for(let j = 0; j < BOID_COUNT; j++){ // Currently it will follow the boid with highest ID
                if(i == j){continue;}
                let boidAngle = boids[i].angleTo(boids[j]);
                if(boids[i].distanceTo(boids[j]) < Boid.DETECTION_RADIUS && Math.abs(boidAngle) < Boid.DETECTION_ANGLE){ // Should take from each boid
                    if(boids[i].distanceTo(boids[j]) < Boid.AVOIDANCE_RADIUS){
                        newAngle = (Math.sign(-boidAngle) * Boid.MAX_TURN_ANGLE) + boids[i].boid.rotation;
                        tooCloseBoids.push(boids[j]);
                    }

                    closeBoids.push(boids[j]);

                    flockAngle += (boidAngle * Boid.MAX_TURN_ANGLE) + boids[i].boid.rotation;

                    //newAngle = boidAngle / 2;
                    //if(Math.abs(newAngle - boids[i].boid.rotation) > Boid.MAX_TURN_ANGLE){ // Wanna make it less fixed, maybe
                    //    newAngle = (boidAngle * 0.01) + boids[i].boid.rotation;
                    //}
                    //boids[i].update(SPEED * .1, newAngle);
                }
            }
            let closeDist = 0
            let closeAngle = 0
            if(closeBoids.length != 0){
                
                flockAngle /= closeBoids.length;
                //console.log(flockAngle)

                let combX = 0;
                let combY = 0;

                for(let k = 0; k < closeBoids.length; k++){
                   combX += closeBoids[k].boid.x;
                   combY += closeBoids[k].boid.y;
                }
                combX /= closeBoids.length;
                combY /= closeBoids.length;


                closeDist = boids[i].distanceToPoint(combX, combY);
                closeAngle = boids[i].angleToPoint(combX, combY) / 10;
                if(closeAngle > Math.PI / 2 || closeAngle < -Math.PI / 2){ // Maybe change logic for this
                    closeDist = -closeDist;
                }

                //boids[i].update(closeDist + SPEED, closeAngle);
            }

            let tooCloseDist = 0
            let tooCloseAngle = 0
            if(tooCloseBoids.length != 0){
                let combX = 0;
                let combY = 0;

                for(let k = 0; k < tooCloseBoids.length; k++){
                   combX += tooCloseBoids[k].boid.x;
                   combY += tooCloseBoids[k].boid.y;
                }
                combX /= tooCloseBoids.length;
                combY /= tooCloseBoids.length;

                tooCloseDist = boids[i].distanceToPoint(combX, combY);
                tooCloseAngle = periodic((boids[i].angleToPoint(combX, combY) / 10) + Math.PI);
            }

            let adjustedSpeed = SPEED + ((closeDist + tooCloseDist) / 100);
            let adjustedAngle = flockAngle + ((closeAngle + tooCloseAngle) / 500);

            boids[i].update(adjustedSpeed, adjustedAngle);
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

function vectorAddition(){
    //pass
}

// Keep clear view, get v-shape formation?

class Boid{ //Prob gonna rewrite
    static DETECTION_RADIUS = 200;
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

    distanceToPoint(x, y){
        return Math.sqrt(((this.boid.x - x) ** 2) + ((this.boid.y - y) ** 2));
    }

    angleTo(other){
        let z = (-(Math.atan2((this.boid.y - other.boid.y), (other.boid.x - this.boid.x)) - Math.PI / 2)) - this.boid.rotation;
        if(z > Math.PI){ //Works, but ugly
            z -= 2 * Math.PI;
        }
        return z;
    }

    angleToPoint(x, y){
        let z = (-(Math.atan2((this.boid.y - y), (x - this.boid.x)) - Math.PI / 2)) - this.boid.rotation;
        if(z > Math.PI){ //Works, but ugly
            z -= 2 * Math.PI;
        }
        return z;
    }
}

document.addEventListener("DOMContentLoaded", main);
