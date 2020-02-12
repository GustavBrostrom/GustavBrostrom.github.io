"use strict";

function main(){
    const app = new PIXI.Application({width: 768, height: 768});
    const x = document.querySelector('#canvas')
    x.appendChild(app.view);
    const container = new PIXI.Container();
    app.stage.addChild(container);
    
    const boids = [];
    const BOID_COUNT = 200;
    const SPEED = 1;
    const TURN_RATE =  Math.PI / 100;
    let angle = Math.PI/2;

    let texture = PIXI.Texture.from('boid2.png'); //Testing boid
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
                let boidVector = boids[i].vectorTo(boids[j]);
                if(boidVector.scalar < Boid.DETECTION_RADIUS && Math.abs(boidVector.angle) < Boid.DETECTION_ANGLE){ // Should take from each boid
                    if(boidVector.scalar < Boid.AVOIDANCE_RADIUS){
                        newAngle = (Math.sign(-boidVector.angle) * Boid.MAX_TURN_ANGLE) + boids[i].getVect().angle;
                        tooCloseBoids.push(boids[j]);
                    }

                    closeBoids.push(boids[j]);

                    flockAngle += (boidVector.angle * Boid.MAX_TURN_ANGLE) + boids[i].getVect().angle; // Gonna need some work here
                }
            }

            if(closeBoids.length != 0){
                flockAngle /= closeBoids.length;
            }

            // alignVect

            // avoidVect

            let cohereVect = cohere(boids[i], closeBoids);

            let separateVect = separate(boids[i], tooCloseBoids);

            let adjustedVect = vectorAddition(new Vector(angle, SPEED), cohereVect, separateVect); //Gotta use the turn limiter

            boids[i].update(adjustedVect); //Change apply force func
        }
    });
}

function separate(boid, vect, weight = .5){ //Could scale based on distance
    let tooCloseVect = new Vector(0, 0);
    for(let k = 0; k < vect.length; k++){
        tooCloseVect = vectorAddition(tooCloseVect, boid.vectorTo(vect[k]));
    }
    tooCloseVect.inverse().scale(weight);
    return tooCloseVect;
}

function cohere(boid, vect, weight = .0001){
    let closeVect = new Vector(0, 0);
    for(let k = 0; k < vect.length; k++){
        closeVect = vectorAddition(closeVect, boid.vectorTo(vect[k]));
    }
    closeVect.scale(weight);
    return closeVect;
}

function align(boid, vect, weight = 1){ //Gotta figure this out
    let alignVect = new Vector(0, 0);
    for(let k = 0; k < vect.length; k++){
        closeVect = vectorAddition(alignVect, boid.vectorTo(vect[k]));
    }
    alignVect.scale(weight);
    return alignVect;
}

function avoid(boid, vect, weight = 1){ //Gotta figure this out
    let avoidVect = new Vector(0, 0);
    for(let k = 0; k < vect.length; k++){
        closeVect = vectorAddition(avoidVect, boid.vectorTo(vect[k]));
    }
    avoidVect.scale(weight);
    return avoidVect;
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

function vectorAddition(){ // There might be precision loss due to float math?
    let result = new Cartesian(0, 0)
    for(let i = 0; i < arguments.length; i++){ //Could write recursive, might look cool
        let {x: x1, y: y1} = result;
        let {x: x2, y: y2} = arguments[i].toCart();
        result.x = x1 + x2;
        result.y = y1 + y2;
    }
    return result.toVect();
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
        return this;
    }

    scale(scale){
        this.scalar *= scale;
        return this;
    }

    inverse(){
        this.angle = -this.angle;
        return this;
    }

    toDeg(){return this.angle * 180 / Math.PI;}

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

function radToDeg(rad){return rad * 180 / Math.PI;}

function degToRad(deg){return deg * Math.PI / 180;}

// Keep clear view, get v-shape formation?

// Do we want acceleration
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
        return this;

        function mod(n, m){ //JS % is remainder, not mod
            return ((n % m) + m) % m;
        }
    }

    getCart(){return new Cartesian(this.boid.x, this.boid.y);} // Never though I'd write getters and setters out of my own free will

    setCart(cart){
        this.boid.position.set(cart.x, cart.y);
        return this;
    }

    getVect(){return this.getCart().toVect();}

    setVect(vect){
        let cart = vect.toCart();
        this.boid.position.set(cart.x, cart.y);
        return this;
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
        if(z > Math.PI){
            z -= 2 * Math.PI;
        }
        return z;
    }
}

document.addEventListener("DOMContentLoaded", main);
