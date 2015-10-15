'use strict';

// CANNON.Body extensions

CANNON.Body.prototype.predictPosition = function (delta) {
    return this.position.vadd(this.velocity.mult(delta));
};

CANNON.Body.prototype.predictRotation = function (delta) {
    var euler = new CANNON.Vec3(0, 0, 0);
    this.quaternion.toEuler(euler);

    return euler.vadd(this.angularVelocity.mult(delta));
};

// World object

var World = function (onsimulate) {
    // time management

    this.timeStep = 100;
    this.timeSim = new Date().getTime();
    this.timeNow = new Date().getTime();

    // handlers

    this.onsimulate = onsimulate;
};

World.prototype = new CANNON.World();

World.prototype.simulate = function () {
    this.timeNow = new Date().getTime();

    if (this.timeSim < this.timeNow - this.timeStep) {
        this.timeSim += this.timeStep;

        if (this.timeSim < this.timeNow - this.timeStep) {
            this.timeSim = this.timeNow - this.timeStep;
        }

        this.onsimulate();
        this.step(0.001 * this.timeStep);
    }
};
