class Car {
    constructor(x, y, width, height, controlType, maxSpeed = 3) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;

        this.useBrain = controlType == 'AI';

        if(controlType != 'DUMMY') {
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount, 6, 4]
            );
        }
        this.controls = new Controls(controlType);
    }

    update(roadBorders, traffic) {
        if(!this.damaged) {
            //calls the move method
            this.#move();

            this.polygon = this.#createPolygon();

            this.damaged = this.#assesDamage(roadBorders, traffic)
        }
        if(this.sensor) {
            //calls the update method for sensor
            this.sensor.update(roadBorders, traffic);
            const offsets=this.sensor.readings.map(
                s=>s==null?0:1-s.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            //console.log(outputs)

            if(this.useBrain) {
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }

    #assesDamage(roadBorders, traffic) {
        for(let i = 0; i < roadBorders.length; i++) {
            if(polysIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
        }
        for(let i = 0; i < traffic.length; i++) {
            if(polysIntersect(this.polygon, traffic[i].polygon)) {
                return true;
            }
        }
        return false;
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x:this.x - Math.sin(this.angle - alpha) * rad, 
            y:this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x:this.x - Math.sin(this.angle + alpha) * rad, 
            y:this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x:this.x - Math.sin(Math.PI + this.angle - alpha) * rad, 
            y:this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x:this.x - Math.sin(Math.PI + this.angle + alpha) * rad, 
            y:this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    //makes a private method for all the move mechanics
    #move() {
         //making the car move forward
         if(this.controls.forward){
            this.speed += this.acceleration;
        }
        //making the car move backwards
        if(this.controls.reverse){
            this.speed -= this.acceleration;
        }

        //capping speed
        if(this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed
        }
        //capping reverse speed (maxSpeed not as fast)
        if(this.speed <- this.maxSpeed/2) {
            this.speed=-this.maxSpeed/2;
        }

        //slowing the car down before it stops
        if(this.speed > 0) {
            this.speed -= this.friction;
        }
        if(this.speed < 0) {
            this.speed += this.friction;
        }
        //making the car stop if the speed is less than the friction (bug)
        if(Math.abs(this.speed)<this.friction) {
            this.speed = 0;
        }

        //flips the increase/decrease of the angle when the car is flipped (so it moves properly when reversing)
        if(this.speed != 0) {
            const flip = this.speed > 0 ? 1 : -1;

            if(this.controls.left) {
                this.angle += 0.03 * flip;
            }
            if(this.controls.right) {
                this.angle -= 0.03 * flip;
            }

        }

        this.x -= Math.sin(this.angle)*this.speed;
        this.y -= Math.cos(this.angle)*this.speed;
    }

    draw(ctx, color, drawSensor=false) {
        if(this.damaged) {
            ctx.fillStyle = 'gray';
        } else {
            ctx.fillStyle = color;
        }
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for(let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y)
        };
        ctx.fill();

        if(this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }
}
