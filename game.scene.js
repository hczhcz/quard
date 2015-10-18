'use strict';

// basic 3d scene object

var Scene = function (container, resizeBind, oninit, onrender) {
    // time management

    this.timeRender = new Date().getTime();
    this.timeNow = new Date().getTime();

    // main camera

    this.camera = new THREE.PerspectiveCamera(
        // FOV, aspect, near, far
        90, 1, 0.1, 1000
    );

    // main canvas

    this.renderer = new THREE.WebGLRenderer();
    $(this.renderer.domElement)
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
        })
        .appendTo(container);

    var scene = this;
    var resizeHandler = function () {
        var width = $(container).width();
        var height = $(container).height();

        scene.camera.aspect = width / height;
        scene.camera.updateProjectionMatrix();
        scene.renderer.setSize(width, height);
    };
    resizeHandler();
    resizeBind(resizeHandler);

    // handlers

    this.oninit = oninit;
    this.onrender = onrender;

    // init

    this.oninit();
    this.render();
};

Scene.prototype = new THREE.Scene();

Scene.prototype.render = function () {
    this.timeNow = new Date().getTime();

    this.onrender();
    this.renderer.render(this, this.camera);

    this.timeRender = this.timeNow;

    var scene = this;
    requestAnimationFrame(function () {
        scene.render();
    });
};

// game scene

var GameScene = function (container, resizeBind, settings, oninit, onrender) {
    return Scene.call(this, container, resizeBind, function () {
        // fog

        this.fog = new THREE.Fog(
            // color, near, far
            0xc00080, 2, 2 * settings.zone.size
        );

        // the big sphere

        this.zone = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshLambertMaterial({
                // color: 0x808080,
                envMap: THREE.ImageUtils.loadTextureCube(
                    [
                        'background.jpg',
                        'background.jpg',
                        'background.jpg',
                        'background.jpg',
                        'background.jpg',
                        'background.jpg'
                    ],
                    THREE.CubeRefractionMapping
                ),
                side: THREE.BackSide,
            })
        );
        this.zone.scale.multiplyScalar(settings.zone.size);
        this.zone.material.refractionRatio = 0.6;
        this.add(this.zone);

        // light // TODO

        this.light = new THREE.PointLight(
            // hex, intensity, distance, decay
            0xffffff, 1, 1000, 1
        );
        this.light.position.set(0, 0, 100);
        this.add(this.light);

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
        // objects

        for (var i in this.children) {
            var object = this.children[i];

            if (!object.game) {
                continue;
            }

            object.draw();
        }

        // camera

        var me = settings.players[settings.me];
        var meObject = me.getObject();

        var step = 1 - Math.pow(0.995, this.timeNow - this.timeRender);

        this.camera.position.lerp(
            new THREE.Vector3(0, 0, 5)
                .applyQuaternion(meObject.quaternion)
                .add(meObject.position),
            step
        );

        this.camera.quaternion.slerp(
            meObject.quaternion,
            step
        );

        // the handler

        onrender.call(this);
    });
};

GameScene.prototype = Object.create(Scene.prototype);

GameScene.prototype.addObject = function (settings, mode, instance) {
    var object = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshLambertMaterial({
            color: 0x808080, // TODO
        })
    );

    object.game = instance;

    // drawing

    var scene = this;
    var lastType = undefined;
    object.draw = function () {
        if (object.game.type != lastType) {
            var physics = settings.physics[object.game.type];

            object.scale.set(physics.size, physics.size, physics.size);
            // TODO

            lastType = object.game.type;
        }

        object.position.copy(
            object.game.predictedPosition
        );
        object.rotation.setFromVector3(
            object.game.predictedRotation, 'YZX'
        );
    };

    // apply

    object.game.getObject = function () {
        return object;
    };

    this.add(object);
};
