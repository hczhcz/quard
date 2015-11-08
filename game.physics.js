'use strict';

var doPrediction = true;
var defaultStep = 1000 / 60;

// CANNON.Body extensions

CANNON.Body.prototype.predictPosition = function (delta) {
    if (doPrediction) {
        return this.position.vadd(this.velocity.mult(delta));
    } else {
        return this.position;
    }
};

CANNON.Body.prototype.getRotation = function () {
    var euler = new CANNON.Vec3(0, 0, 0);
    this.quaternion.toEuler(euler);

    return euler;
};

CANNON.Body.prototype.predictRotation = function (delta) {
    if (doPrediction) {
        return this.getRotation().vadd(this.angularVelocity.mult(delta));
    } else {
        return this.getRotation();
    }
};

// basic physics engine object

var World = function (oninit, onsimulate, aftersimulate) {
    // time management

    this.timeStep = defaultStep;
    this.timeSim = new Date().getTime();
    this.timeNow = new Date().getTime();

    // handlers

    this.oninit = oninit;
    this.onsimulate = onsimulate;
    this.aftersimulate = aftersimulate;

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
        this.aftersimulate();
    }
};

// game world

var GameWorld = function (settings, oninit, onsimulate, aftersimulate, oncontrol) {
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

        // handler

        this.oncontrol = oncontrol;

        // call handler

        oninit.call(this);
    }, function () {
        // controlling

        this.controlPlayers(settings);
        this.controlBalls(settings);

        // forces

        var gravity = settings.zone.gravity / settings.zone.size;
        var limiting1 = settings.zone.limiting1 / Math.pow(
            settings.zone.size - settings.zone.inner, 2
        );
        var limiting2 = settings.zone.limiting2 / Math.pow(
            settings.zone.size - settings.zone.inner, 2
        );

        for (var i in this.bodies) {
            var body = this.bodies[i];

            if (!body.game) {
                continue;
            }

            var physics = settings.physics[body.game.type];

            // gravity

            body.applyForce(
                body.position.mult(
                    gravity * (physics.gravity || 1) * physics.mass
                ),
                body.position.vadd(
                    body.quaternion.vmult({
                        x: 0,
                        y: settings.zone.gOffset * physics.size,
                        z: 0,
                    })
                )
            );

            // limiting

            var distance = body.position.length();
            if (distance > settings.zone.inner) {
                body.applyForce(
                    body.position.mult(
                        (
                            body.position.dot(body.velocity) > 0 ?
                            limiting1 : limiting2
                        )
                        * (settings.zone.inner - distance)
                        * physics.mass
                    ),
                    body.position.vadd(
                        body.quaternion.vmult({
                            x: 0,
                            y: settings.zone.lOffset * physics.size,
                            z: 0,
                        })
                    )
                );
            }

            // stiction

            if (physics.fStiction) {
                body.force = body.force.vsub(
                    body.velocity.mult(physics.fStiction)
                );
            }
            if (physics.tStiction) {
                body.torque = body.torque.vsub(
                    body.angularVelocity.mult(physics.tStiction)
                );
            }

            // interaction

            if (physics.interaction) {
                for (var j in this.bodies) {
                    if (i == j) {
                        continue;
                    }

                    var body2 = this.bodies[j];

                    if (!body2.game) {
                        continue;
                    }

                    if (physics.interaction[body.game.type]) {
                        var physics2 = settings.physics[body2.game.type];
                        var vDistance = body.position.vsub(body2.position);

                        body.force = body.force.vadd(
                            vDistance.mult(
                                physics.interaction[body.game.type]
                                * Math.pow(physics.size + physics2.size, 2)
                                * Math.pow(vDistance.length(), -3)
                            )
                        );
                    }
                }
            }
        }

        // call handler

        onsimulate.call(this);
    }, function () {
        // check goals

        this.checkGoals(settings, settings.balls);
        this.checkGoals(settings, settings.players);

        // call handler

        aftersimulate.call(this);
    });
};

GameWorld.prototype = Object.create(World.prototype);

GameWorld.prototype.addObject = function (settings, mode, instance) {
    var body = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Sphere(1),
    });

    // apply mode

    switch (mode) {
        case 'player':
            break;

        case 'goal':
            body.collisionResponse = false;
            break;

        case 'ball':
            instance.wanderTime = 0;
            break;

        default:
            throw new Error();
    }

    // set up properties

    var world = this;
    var lastType = undefined;
    Object.defineProperty(instance, 'type', {
        enumerable: true,
        get: function () {return lastType;},
        set: function (value) {
            var physics = settings.physics[value];

            body.shapes[0].radius = physics.size;
            body.mass = physics.mass;

            if (!physics.getPhysicsMat) {
                var material = new CANNON.Material();

                material.friction = physics.friction || 0.5;
                material.restitution = physics.restitution || 1;

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
    Object.defineProperty(instance, 'position', {
        enumerable: true,
        get: function () {return body.position;},
        set: function (value) {body.position.copy(value);},
    });
    Object.defineProperty(instance, 'quaternion', {
        enumerable: true,
        get: function () {return body.quaternion;},
        set: function (value) {body.quaternion.copy(value);},
    });
    Object.defineProperty(instance, 'velocity', {
        enumerable: true,
        get: function () {return body.velocity;},
        set: function (value) {body.velocity.copy(value);},
    });
    Object.defineProperty(instance, 'angularVelocity', {
        enumerable: true,
        get: function () {return body.angularVelocity;},
        set: function (value) {body.angularVelocity.copy(value);},
    });
    Object.defineProperty(instance, 'predictedPosition', {
        enumerable: true,
        get: function () {
            return body.predictPosition(
                0.001 * (world.timeNow - world.timeSim)
            );
        },
    });
    Object.defineProperty(instance, 'predictedRotation', {
        enumerable: true,
        get: function () {
            return body.predictRotation(
                0.001 * (world.timeNow - world.timeSim)
            );
        },
    });

    // apply

    instance.getBody = function () {
        return body;
    };

    instance.type = instance.initType;
    instance.position = instance.initPosition;
    instance.quaternion = instance.initQuaternion;

    body.game = instance;

    this.addBody(body);
};

GameWorld.prototype.controlPlayer = function (input, physics, magic, instance) {
    var body = instance.getBody();

    // normalize

    input.yz = Math.min(Math.max(input.yz, -1), 1);
    input.zx = Math.min(Math.max(input.zx, -1), 1);
    input.xy = Math.min(Math.max(input.xy, -1), 1);
    input.force = Math.min(Math.max(input.force, 0), 1);
    input.break = Math.min(Math.max(input.break, 0), 1);

    // apply

    body.force = body.force.vadd(
        body.quaternion.vmult({
            x: 0,
            y: 0,
            z: -physics.force * input.force,
        })
    ).vsub(
        body.velocity.mult(
            physics.force * input.break / body.velocity.length()
        )
    );

    var ang = new CANNON.Vec3(input.yz, input.zx, input.xy);
    var angLength = ang.length();
    body.torque = body.torque.vadd(
        body.quaternion.vmult(ang).mult(
            (angLength > 1 ? 1 / angLength : 1) * physics.torque
        )
    ).vsub(
        body.angularVelocity.mult(
            physics.torque * input.break / body.angularVelocity.length()
        )
    );

    var startMagic = function () {
        switch (instance.magic) {
            case 'stroke':
                // window.xxx=body
                body.applyLocalImpulse(
                    new CANNON.Vec3(
                        0, 0, -magic.impulse
                    ),
                    new CANNON.Vec3(
                        0, 0, 0
                    )
                );
                break;

            default:
                throw new Error();
        }
    };

    var playMagic = function () {
        switch (instance.magic) {
            case 'stroke':
                // nothing
                break;

            default:
                throw new Error();
        }
    };

    // magics

    if (instance.magicTime < 0) {
        // happening

        playMagic();
        instance.magicTime += this.timeStep;

        if (instance.magicTime > 0) {
            instance.magicTime = 0;
        }

        instance.magicStatus = 0.001 * instance.magicTime / magic.duration;
    } else {
        if (input.btn1) {
            instance.magicTime += this.timeStep;

            if (instance.magicTime > 1000 * magic.time) {
                // started

                startMagic();
                instance.magicTime = -1000 * magic.duration;
            }
        } else {
            // cancelled

            instance.magicTime = 0;
        }

        instance.magicStatus = 0.001 * instance.magicTime / magic.time;
    }
};

GameWorld.prototype.controlPlayers = function (settings) {
    var inputs = this.oncontrol();

    for (var i in inputs) {
        var instance = settings.players[i];

        this.controlPlayer(
            inputs[i],
            settings.physics[instance.type],
            settings.magics[instance.magic],
            instance
        );
    }
};

GameWorld.prototype.controlBall = function (physics, instance) {
    var body = instance.getBody();

    // TODO: seed-based random?
    if (instance.wanderTime <= 0) {
        instance.wanderTime += 2500 + 5000 * Math.random();

        body.quaternion.setFromEuler(
            2 * Math.PI * Math.random(),
            2 * Math.PI * Math.random(),
            2 * Math.PI * Math.random(),
            'YZX'
        );
    }

    // apply

    body.force = body.force.vadd(
        body.quaternion.vmult({
            x: 0,
            y: 0,
            z: -physics.force,
        })
    );

    instance.wanderTime -= this.timeStep;
};

GameWorld.prototype.controlBalls = function (settings) {
    for (var i in settings.balls) {
        var instance = settings.balls[i];

        this.controlBall(
            settings.physics[instance.type],
            instance
        );
    }
};

GameWorld.prototype.checkGoal = function (size, goalPhysics, goal, physics, instance) {
    var goalBody = goal.getBody();
    var body = instance.getBody();

    var vDistance = body.position.vsub(goalBody.position);
    var distance = vDistance.length();

    if (distance <= goalPhysics.size - physics.size) {
        body.position = vDistance.mult(size / distance);
        body.velocity = body.velocity.mult(goalPhysics.restitution);
    }
};

GameWorld.prototype.checkGoals = function (settings, instances) {
    for (var i in settings.goals) {
        for (var j in instances) {
            var goal = settings.goals[i];
            var instance = instances[j];

            this.checkGoal(
                settings.zone.inner,
                settings.physics[goal.type],
                goal,
                settings.physics[instance.type],
                instance
            );
        }
    }
};
