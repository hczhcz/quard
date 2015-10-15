'use strict';

var World = function (onsimulate) {
    // cannon.js world

    var world = new CANNON.World();

    // simulation loop

    world.timeStep = 100;
    world.timeLast = new Date().getTime();

    world.onsimulate = onsimulate;

    world.simulate = function () {
        var time = new Date().getTime();

        if (world.timeLast + world.timeStep < time) {
            world.onsimulate();

            world.step(0.001 * world.timeStep);
            world.timeLast += world.timeStep;
        }

        return time - world.timeLast;
    };

    return world;
};
