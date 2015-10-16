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

        player: {
            size: 1, // L
            mass: 1, // M

            force: 10, // M * L * T^-2
            stiction: 0.5, // T^-1

            interaction: {
                // player: 0, // M * L * T^-2
                hole: 0, // M * L * T^-2
                quaffle: 0, // M * L * T^-2
                bludger: 0, // M * L * T^-2
                snitch: 0, // M * L * T^-2
            },

            instances: [
                [0, -90, 0] // TODO
            ],
        },
        hole: {
            size: 1, // L
            mass: 0, // M, not movable

            interaction: {
                player: 0, // M * L * T^-2
                // hole: 0, // M * L * T^-2
                quaffle: 0, // M * L * T^-2
                bludger: 0, // M * L * T^-2
                snitch: 0, // M * L * T^-2
            }
        }

        // balls
        // inspired by Quidditch in HP :)

        quaffle: {
            size: 1, // L
            mass: 0.5, // M

            force: 0, // M * L * T^-2
            stiction: 1, // T^-1

            interaction: {
                player: 0, // M * L * T^-2
                hole: 0, // M * L * T^-2
                // quaffle: 0, // M * L * T^-2
                bludger: 0, // M * L * T^-2
                snitch: 0, // M * L * T^-2
            }
        },
        bludger: {
            size: 0.5, // L
            mass: 2, // M

            force: 20, // M * L * T^-2
            stiction: 2, // T^-1

            interaction: {
                player: 0, // M * L * T^-2
                hole: 30, // M * L * T^-2
                quaffle: 30, // M * L * T^-2
                // bludger: 0, // M * L * T^-2
                snitch: 10, // M * L * T^-2
            }
        },
        snitch: {
            size: 0.2, // L
            mass: 0.2, // M

            force: 5, // M * L * T^-2
            stiction: 1, // T^-1

            interaction: {
                player: 0, // M * L * T^-2
                hole: 10, // M * L * T^-2
                quaffle: 10, // M * L * T^-2
                bludger: 10, // M * L * T^-2
                // snitch: 0, // M * L * T^-2
            }
        },
    }
};
