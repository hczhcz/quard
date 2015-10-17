'use strict';

// basic 3d scene object

var Scene = function (container, resizeBind, oninit, onrender) {
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
    this.onrender();

    this.renderer.render(this, this.camera);

    var scene = this;
    requestAnimationFrame(function () {
        scene.render();
    });
};

// game scene

var GameScene = function (container, resizeBind, settings, oninit, onrender) {
    return Scene.call(this, container, resizeBind, function () {
        this.settings = settings;

        // fog

        this.fog = new THREE.Fog(
            // color, near, far
            0xc00080, 2, 2 * this.settings.zone.size
        );

        // the big sphere

        this.zone = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshLambertMaterial({
                // color: 0x808080,
                envMap: THREE.ImageUtils.loadTextureCube(
                    ['background.jpg', 'background.jpg', 'background.jpg', 'background.jpg', 'background.jpg', 'background.jpg'],
                    THREE.CubeRefractionMapping
                ),
                side: THREE.BackSide,
            })
        );
        this.zone.scale.multiplyScalar(this.settings.zone.size);
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

        for (var i in this.settings.players) {
            this.addObject('player', this.settings.players[i]);
        }

        for (var i in this.settings.goals) {
            this.addObject('goal', this.settings.goals[i]);
        }

        for (var i in this.settings.balls) {
            this.addObject('ball', this.settings.balls[i]);
        }

        // the handler

        oninit.call(this);
    }, function () {
        // the handler

        onrender.call(this);
    });
};
GameScene.prototype = Object.create(Scene.prototype);

GameScene.prototype.addObject = function (mode, instance) {
};
