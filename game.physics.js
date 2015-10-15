'use strict';

CANNON.Body.prototype.predictPosition = function (delta) {
    return this.position.vadd(this.velocity.mult(delta));
};

CANNON.Body.prototype.predictRotation = function (delta) {
    var euler = new CANNON.Vec3(0, 0, 0);
    this.quaternion.toEuler(euler);

    return euler.vadd(this.angularVelocity.mult(delta));
};

var World = function (onsimulate) {
    // cannon.js world

    var world = new CANNON.World();

    // simulation loop

    world.timeStep = 100;
    world.timeSim = new Date().getTime();
    world.timeNow = new Date().getTime();

    world.onsimulate = onsimulate;

    world.simulate = function () {
        world.timeNow = new Date().getTime();

        if (world.timeSim < world.timeNow - world.timeStep) {
            world.timeSim += world.timeStep;

            if (world.timeSim < world.timeNow - world.timeStep) {
                world.timeSim = world.timeNow - world.timeStep;
            }

            world.onsimulate();
            world.step(0.001 * world.timeStep);
        }
    };

    return world;
};
