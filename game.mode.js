'use strict';

// TODO: dummy
var testGameMode = function () {
    return {
        zone: {
            size: 100, // L
            inner: 95, // L

            gravity: 5, // L * T^-2
            limiting1: 10, // L * T^-2 * (size / border)
            limiting2: 5, // L * T^-2 * (size / border)
        },

        me: 0,

        // inspired by Quidditch in HP :)
        physics: {
            // schema: {
            //     size, mass,
            //     force?, stiction?,
            //     interaction?: {<type>?, ...},
            // }

            player: {
                size: 1, // L
                mass: 1, // M

                force: 10, // M * L * T^-2
                stiction: 0.5, // T^-1
            },

            hole: {
                size: 1, // L
                mass: 0, // M, not movable
            },

            quaffle: {
                size: 1, // L
                mass: 0.5, // M

                force: 0, // M * L * T^-2
                stiction: 1, // T^-1
            },
            bludger: {
                size: 0.5, // L
                mass: 2, // M

                force: 20, // M * L * T^-2
                stiction: 2, // T^-1

                interaction: {
                    hole: 30, // M * L * T^-2
                    quaffle: 30, // M * L * T^-2
                    bludger: 30, // M * L * T^-2
                    snitch: 10, // M * L * T^-2
                },
            },
            snitch: {
                size: 0.2, // L
                mass: 0.2, // M

                force: 5, // M * L * T^-2
                stiction: 1, // T^-1

                interaction: {
                    hole: 10, // M * L * T^-2
                    quaffle: 10, // M * L * T^-2
                    bludger: 10, // M * L * T^-2
                    snitch: 5, // M * L * T^-2
                },
            },
        },

        // instances

        players: [
            {
                initType: 'player',
                initPosition: {x: 0, y: -90, z: 0},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
        ],

        goals: [
            {
                initType: 'hole',
                initPosition: {x: 0, y: -80, z: -40},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
        ],

        balls: [
            {
                initType: 'quaffle',
                initPosition: {x: -10, y: -80, z: -40},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
            {
                initType: 'bludger',
                initPosition: {x: 10, y: -80, z: -40},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
            {
                initType: 'snitch',
                initPosition: {x: 0, y: -70, z: -40},
                initQuaternion: {x: 0, y: 0, z: 0, w: 1},
            }, // dummy!
        ],
    };
};
