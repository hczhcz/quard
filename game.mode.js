'use strict';

// TODO: dummy
var testGameMode = function () {
    return {
        zone: {
            size: 60, // L
            inner: 55, // L

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

        players: [
            {
                initType: 'player',
                initPosition: {x: 0, y: -40, z: 0},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
        ],

        goals: [
            {
                initType: 'hole',
                initPosition: {x: -10, y: -30, z: -30},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
        ],

        balls: [
            {
                initType: 'quaffle',
                initPosition: {x: 0, y: -30, z: -30},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
            {
                initType: 'bludger',
                initPosition: {x: 10, y: -30, z: -30},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
            {
                initType: 'snitch',
                initPosition: {x: 0, y: -20, z: -40},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
        ],
    };
};
