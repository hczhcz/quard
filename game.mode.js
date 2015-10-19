'use strict';

// TODO: dummy
var testGameMode = function () {
    var settings = {
        zone: {
            size: 100, // L
            inner: 95, // L

            gravity: 5, // L * T^-2
            limiting1: 40, // L * T^-2 * (size / border)
            limiting2: 20, // L * T^-2 * (size / border)
        },

        me: 0,

        // inspired by Quidditch in HP :)
        physics: {
            // schema: {
            //     size, mass,
            //     force?, fStiction?,
            //     torque?, tStiction?,
            //     friction?, restitution?,
            //     interaction?: {<type>?, ...},
            // }

            player: {
                size: 2, // L
                mass: 2, // M

                force: 20, // M * L * T^-2
                fStiction: 0.5, // T^-1
                torque: 20, // M * L^2 * T^-2
                tStiction: 10, // T^-1

                restitution: 3, // ratio
            },

            hole: {
                size: 4, // L
                mass: 0, // M, not movable
            },

            quaffle: {
                size: 2, // L
                mass: 0.5, // M

                force: 0, // M * L * T^-2
                fStiction: 0.25, // T^-1
            },
            bludger: {
                size: 1, // L
                mass: 3, // M

                force: 30, // M * L * T^-2
                fStiction: 2, // T^-1

                friction: 0.6, // ratio
                restitution: 3, // ratio

                interaction: {
                    hole: 30, // M * L * T^-2
                    quaffle: 30, // M * L * T^-2
                    bludger: 30, // M * L * T^-2
                    snitch: 5, // M * L * T^-2
                },
            },
            snitch: {
                size: 0.5, // L
                mass: 0.2, // M

                force: 1, // M * L * T^-2
                fStiction: 0.25, // T^-1

                interaction: {
                    hole: 5, // M * L * T^-2
                    quaffle: 5, // M * L * T^-2
                    bludger: 5, // M * L * T^-2
                    snitch: 2, // M * L * T^-2
                },
            },
        },

        // instances

        players: [],
        goals: [],
        balls: [],
    };

    var randomQuat = function () {
        // TODO: not uniform random
        var result = new CANNON.Quaternion(
            Math.random() - 0.5, Math.random() - 0.5,
            Math.random() - 0.5, Math.random() - 0.5
        );
        result.normalize();
        return result;
    };

    var basePosition = {
        x: 0,
        y: -settings.zone.inner,
        z: 0,
    };

    for (var i = 0; i < 6; ++i) {
        settings.goals.push({
            initType: 'hole',
            initPosition: randomQuat().vmult(basePosition),
            initQuaternion: randomQuat(),
        });

        settings.balls.push({
            initType: 'quaffle',
            initPosition: randomQuat().vmult(basePosition),
            initQuaternion: randomQuat(),
        });

        settings.balls.push({
            initType: 'bludger',
            initPosition: randomQuat().vmult(basePosition),
            initQuaternion: randomQuat(),
        });
    }

    var playerQuat = randomQuat();
    settings.players.push({
        initType: 'player',
        initPosition: playerQuat.vmult(basePosition),
        initQuaternion: playerQuat,
    });

    settings.goals.push({
        initType: 'hole',
        initPosition: {x: 0, y: 0, z: 0},
        initQuaternion: randomQuat(),
    });

    settings.balls.push({
        initType: 'snitch',
        initPosition: randomQuat().vmult(basePosition),
        initQuaternion: randomQuat(),
    });

    return settings;
};
