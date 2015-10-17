'use strict';

// CANNON.Body extensions

CANNON.Body.prototype.predictPosition = function (delta) {
    return this.position.vadd(this.velocity.mult(delta));
};

CANNON.Body.prototype.getRotation = function () {
    var euler = new CANNON.Vec3(0, 0, 0);
    this.quaternion.toEuler(euler);

    return euler;
};

CANNON.Body.prototype.predictRotation = function (delta) {
    return this.getRotation().vadd(this.angularVelocity.mult(delta));
};

// basic physics engine object

var World = function (oninit, onsimulate) {
    // time management

    this.timeStep = 1000 / 60;
    this.timeSim = new Date().getTime();
    this.timeNow = new Date().getTime();

    // handlers

    this.oninit = oninit;
    this.onsimulate = onsimulate;

    // init

    this.oninit();
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

// game world

var GameWorld = function (settings, oninit, onsimulate) {
    World.call(this, function () {
        // objects

        for (var i in settings.players) {
            this.addObject(settings, 'player', settings.players[i]);
        }

        for (var i in settings.goals) {
            this.addObject(settings, 'goal', settings.goals[i]);
        }

        for (var i in settings.balls) {
            this.addObject(settings, 'ball', settings.balls[i]);
        }

        // the handler

        oninit.call(this);
    }, function () {
        // forces

        var gravity = settings.zone.gravity / settings.zone.size;
        var limiting1 = -settings.zone.limiting1 / Math.pow(
            settings.zone.size - settings.zone.inner, 2
        );
        var limiting2 = -settings.zone.limiting2 / Math.pow(
            settings.zone.size - settings.zone.inner, 2
        );

        for (var i in this.bodies) {
            var body = this.bodies[i];

            if (!body.game) {
                continue;
            }

            body.force = body.force.vadd(
                body.position.mult(
                    gravity * body.mass
                )
            );

            var distance = body.position.length();
            if (distance > settings.zone.inner) {
                body.force = body.force.vadd(
                    body.position.mult(
                        (
                            body.position.dot(body.velocity) > 0 ?
                            limiting1 : limiting2
                        )
                        * (distance - settings.zone.inner)
                        * body.mass
                    )
                );
            }
        }

        // the handler

        onsimulate.call(this);
    });
};

GameWorld.prototype = Object.create(World.prototype);

GameWorld.prototype.addObject = function (settings, mode, instance) {
    var body = new CANNON.Body({
        shape: new CANNON.Sphere(1),
    });

    body.game = instance;

    // apply mode

    switch (mode) {
        case 'player':
            break;

        case 'goal':
            body.collisionResponse = false;
            break;

        case 'ball':
            body.wanderDirection = {
                x: Math.random(),
                y: Math.random(),
                z: Math.random(),
            };
            body.wanderTime = 0;
            break;

        default:
            throw new Error();
    }

    // set up properties

    var world = this;
    var lastType = undefined;
    Object.defineProperty(body.game, 'type', {
        enumerable: true,
        get: function () {return lastType;},
        set: function (value) {
            var physics = settings.physics[value];

            body.shapes[0].radius = physics.size; // TODO
            body.mass = physics.mass;

            lastType = value;
        }
    });
    Object.defineProperty(body.game, 'position', {
        enumerable: true,
        get: function () {return body.position;},
        set: function (value) {body.position.copy(value);},
    });
    Object.defineProperty(body.game, 'quaternion', {
        enumerable: true,
        get: function () {return body.quaternion;},
        set: function (value) {body.quaternion.copy(value);},
    });
    // Object.defineProperty(body.game, 'rotation', {
    //     enumerable: true,
    //     get: function () {return body.getRotation();},
    // });
    Object.defineProperty(body.game, 'velocity', {
        enumerable: true,
        get: function () {return body.velocity;},
        set: function (value) {body.velocity.copy(value);},
    });
    Object.defineProperty(body.game, 'angularVelocity', {
        enumerable: true,
        get: function () {return body.angularVelocity;},
        set: function (value) {body.angularVelocity.copy(value);},
    });
    Object.defineProperty(body.game, 'predictedPosition', {
        enumerable: true,
        get: function () {
            return body.predictPosition(world.timeNow - world.timeSim);
        },
    });
    Object.defineProperty(body.game, 'predictedRotation', {
        enumerable: true,
        get: function () {
            return body.predictRotation(world.timeNow - world.timeSim);
        },
    });

    body.game.getBody = function () {
        return body;
    };

    // apply

    body.game.type = body.game.initType;
    body.game.position = body.game.initPosition;
    body.game.quaternion = body.game.initQuaternion;

    this.addBody(body);
};
