'use strict';

// TODO: dummy
var testGameMode = function () {
    var settings = {
        zone: {
            size: 100, // L
            inner: 95, // L

            gravity: 5, // L * T^-2
            gOffset: 0, // ratio
            limiting1: 40, // L * T^-2 * (size / border)
            limiting2: 20, // L * T^-2 * (size / border)
            lOffset: 0.2, // ratio
        },

        me: 0,

        // inspired by Quidditch in HP :)
        physics: {
            // schema: {
            //     size, mass, gravity?,
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

                restitution: 2, // ratio
            },

            hole: {
                size: 4, // L
                mass: 0, // M, not movable

                restitution: 3, // ratio // notice: special case
            },

            quaffle: {
                size: 2, // L
                mass: 0.5, // M

                fStiction: 0.25, // T^-1
            },
            bludger: {
                size: 1.5, // L
                mass: 3, // M
                gravity: 0.5, // ratio

                force: 15, // M * L * T^-2
                fStiction: 1, // T^-1

                friction: 1, // ratio
                restitution: 3, // ratio

                interaction: {
                    hole: 15, // M * L * T^-2
                    quaffle: 15, // M * L * T^-2
                    bludger: 15, // M * L * T^-2
                    snitch: 1, // M * L * T^-2
                },
            },
            snitch: {
                size: 0.5, // L
                mass: 0.2, // M
                gravity: -2.5, // ratio

                force: 1, // M * L * T^-2
                fStiction: 0.25, // T^-1

                interaction: {
                    hole: 1.5, // M * L * T^-2
                    quaffle: 1, // M * L * T^-2
                    bludger: 1, // M * L * T^-2
                    snitch: 1, // M * L * T^-2
                },
            },
        },

        magics: {
            stroke: {
                time: 2, // T
                duration: 2, // T

                // effects
                impulse: 80, // M * L * T^-1
            },
        },

        // instances

        players: [],
        goals: [],
        balls: [],
    };

    var randomQuat = function () {
        return new CANNON.Quaternion().setFromEuler(
            2 * Math.PI * Math.random(),
            2 * Math.PI * Math.random(),
            2 * Math.PI * Math.random(),
            'YZX'
        );
    };

    var basePosition = {
        x: 0,
        y: -settings.zone.inner,
        z: 0,
    };

    var playerQuat = randomQuat();
    settings.players.push({
        initType: 'player',
        initPosition: playerQuat.vmult(basePosition),
        initQuaternion: playerQuat,

        magic: 'stroke',
        magicTime: 0,
    });

    settings.goals.push({
        initType: 'hole',
        initPosition: {x: 0, y: 0, z: 0},
        initQuaternion: randomQuat(),
    });

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

    settings.balls.push({
        initType: 'snitch',
        initPosition: randomQuat().vmult(basePosition).mult(0.25 + 0.5 * Math.random()),
        initQuaternion: randomQuat(),
    });

    return settings;
};
