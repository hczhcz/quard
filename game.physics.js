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

var GameWorld = function (settingGetter, oninit, onsimulate) {
    return new World(function () {
        var settings = settingGetter();

        // objects

        var world = this;
        var addObject = function (mode, instance) {
            var physics = settings.physics[instance.type];

            var body = new CANNON.Body({
                shape: new CANNON.Sphere(physics.size),
                mass: physics.mass,
            });

            body.game = {
                mode: mode,
                type: instance.type,
                force: physics.force,
                stiction: physics.stiction,
                interaction: physics.interaction,
            };

            switch (body.game.mode) {
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

            world.addBody(body);
        };

        for (var i in settings.players) {
            addObject('player', settings.players[i]);
        }

        for (var i in settings.goals) {
            addObject('goal', settings.goals[i]);
        }

        for (var i in settings.balls) {
            addObject('ball', settings.balls[i]);
        }

        // the handler

        oninit.call(this);
    }, function () {
        var settings = settingGetter();

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

            if (body.collisionFilterGroup == 1) {
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
        }

        // the handler

        onsimulate.call(this);
    });
};
