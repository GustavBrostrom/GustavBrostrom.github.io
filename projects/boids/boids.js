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

    console.log(vectorAddition(new Vector(degToRad(90), 1), new Vector(degToRad(0), 1)));

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
                let boidVector = boids[i].vectorTo(boids[j]);
                if(boidVector.scalar < Boid.DETECTION_RADIUS && Math.abs(boidVector.angle) < Boid.DETECTION_ANGLE){ // Should take from each boid
                    if(boidVector.scalar < Boid.AVOIDANCE_RADIUS){
                        newAngle = (Math.sign(-boidVector.angle) * Boid.MAX_TURN_ANGLE) + boids[i].getVect().angle;
                        tooCloseBoids.push(boids[j]);
                    }

                    closeBoids.push(boids[j]);

                    flockAngle += (boidVector.angle * Boid.MAX_TURN_ANGLE) + boids[i].getVect().angle;

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

            boids[i].update(new Vector(adjustedSpeed, adjustedAngle));
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

function vectorAddition(vect1, vect2){ // There might be precision loss due to float math?
    let {x: x1, y: y1} = vect1.toCart();
    let {x: x2, y: y2} = vect2.toCart();
    let x = x1 + x2;
    let y = y1 + y2;
    return new Cartesian(x, y).toVect();
}

class Vector{
    constructor(angle, scalar){
        this.angle = angle;
        this.scalar = scalar;
    }

    toCart(){
        let x = this.scalar * Math.cos(this.angle);
        let y = this.scalar * Math.sin(this.angle);
        return new Cartesian(x, y);
    }

    limit(limit){
        this.scalar = Math.min(this.scalar, limit);
    }

    toDeg(){
        return this.angle * 180 / Math.PI;
    }

    periodic(){ // Might need it
        if(this.angle > Math.PI){
            return this.angle - 2 * Math.PI;
        }else if(this.angle < -Math.PI){
            return this.angle + 2 * Math.PI;
        }else{
            return this.angle;
        }
    }
}

class Cartesian{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    toVect(){
         let scalar = Math.sqrt(this.x ** 2 + this.y ** 2)
         let angle = Math.atan2(this.y, this.x);
         return new Vector(angle, scalar);
    }
}

function radToDeg(rad){
    return rad * 180 / Math.PI;
}

function degToRad(deg){
    return deg * Math.PI / 180;
}

// Keep clear view, get v-shape formation?

class Boid{ //Prob gonna rewrite
    static DETECTION_RADIUS = 200;
    static DETECTION_ANGLE = 3 * Math.PI / 4; // 135 deg
    static AVOIDANCE_RADIUS = 10;
    static MAX_TURN_ANGLE = Math.PI / 12000;

    constructor(boid){
        this.boid = boid;
    }

    update(vector){
        this.boid.rotation = vector.angle;
        this.boid.x += Math.sin(vector.angle) * vector.scalar;
        if(this.boid.x >= 768 || this.boid.x < 0){
            this.boid.x = mod(this.boid.x, 768);
        }
        this.boid.y -= Math.cos(vector.angle) * vector.scalar;
        if(this.boid.y >= 768 || this.boid.y < 0){
            this.boid.y = mod(this.boid.y, 768);
        }

        function mod(n, m){ //JS % is remainder, not mod
            return ((n % m) + m) % m;
        }
    }

    getCart(){return new Cartesian(this.boid.x, this.boid.y);} // Never though I'd write getters and setters out of my own free will

    setCart(cart){this.boid.position.set(cart.x, cart.y);}

    getVect(){return this.getCart().toVect();}

    setVect(vect){
        let cart = vect.toCart();
        this.boid.position.set(cart.x, cart.y);
    }

    distanceToWall(){
        let boidCart = this.getCart();
        let x1 = boidCart.x;
        let x2 = 768 - x1;
        let y1 = boidCart.y;
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
        let thisBoid = this.getCart();
        let otherBoid = other.getCart();
        return Math.sqrt(((thisBoid.x - otherBoid.x) ** 2) + ((thisBoid.y - otherBoid.y) ** 2));
    }

    distanceToPoint(cart){
        let thisBoid = this.getCart();
        return Math.sqrt(((thisBoid.x - cart.x) ** 2) + ((thisBoid.y - cart.y) ** 2));
    }

    vectorTo(other){
        let thisBoid = this.getCart();
        let otherBoid = other.getCart();
        let z = (-(Math.atan2((thisBoid.y - otherBoid.y), (otherBoid.x - thisBoid.x)) - Math.PI / 2)) - this.boid.rotation; // Maybe rewrite
        if(z > Math.PI){ //Works, but ugly
            z -= 2 * Math.PI;
        }
        return new Vector(z, this.distanceTo(other));
    }

    angleToPoint(cart){
        let z = (-(Math.atan2((this.boid.y - cart.y), (cart.x - this.boid.x)) - Math.PI / 2)) - this.boid.rotation;
        if(z > Math.PI){ //Works, but ugly
            z -= 2 * Math.PI;
        }
        return z;
    }
}

document.addEventListener("DOMContentLoaded", main);
