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

var GameWorld = function (settings, oninit, onsimulate, oncontrol) {
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
        // controlling

        var control = oncontrol.call(this);

        for (var i in control) {
            var body = settings.players[i].getBody();

            var physics = settings.physics[body.game.type];

            // normalize

            for (var j in control[i]) {
                control[i][j] = Math.min(Math.max(control[i][j], -1), 1);
            }

            // apply

            body.force = body.force.vadd(
                body.quaternion.vmult({
                    x: 0,
                    y: 0,
                    z: -physics.force * (0.5 * control[i].force + 0.5),
                })
            );

            body.torque = body.quaternion.vmult({ // vadd?
                x: physics.torque * control[i].yz,
                y: physics.torque * control[i].zx,
                z: physics.torque * control[i].xy,
            });
        }

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

            var physics = settings.physics[body.game.type];

            // gravity

            body.force = body.force.vadd(
                body.position.mult(
                    gravity * body.mass
                )
            );

            // limiting

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

            // stiction

            if (physics.fStiction) {
                body.force = body.force.vadd(
                    body.velocity.mult(-physics.fStiction)
                );
            }
            if (physics.tStiction) {
                body.torque = body.torque.vadd(
                    body.angularVelocity.mult(-physics.tStiction)
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
        mass: 1,
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

            body.shapes[0].radius = physics.size;
            body.mass = physics.mass;

            if (!physics.getPhysicsMat) {
                var material = new CANNON.Material();

                material.friction = physics.friction || 0.3;
                material.restitution = physics.restitution || 1.5;

                physics.getPhysicsMat = function () {
                    return material;
                };
            }
            body.material = physics.getPhysicsMat();

            lastType = value;

            // TODO
            // body.aabbNeedsUpdate = true;
            // body.computeAABB();
            body.updateBoundingRadius();
            // body.updateInertiaWorld();
            body.updateMassProperties();
            // body.updateSolveMassProperties();
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
            return body.predictPosition(
                0.001 * (world.timeNow - world.timeSim)
            );
        },
    });
    Object.defineProperty(body.game, 'predictedRotation', {
        enumerable: true,
        get: function () {
            return body.predictRotation(
                0.001 * (world.timeNow - world.timeSim)
            );
        },
    });

    // apply

    body.game.getBody = function () {
        return body;
    };

    body.game.type = body.game.initType;
    body.game.position = body.game.initPosition;
    body.game.quaternion = body.game.initQuaternion;

    this.addBody(body);
};
