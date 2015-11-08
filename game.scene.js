'use strict';

// basic 3d scene object

var Scene = function (container, resizeBind, oninit, onrender) {
    // time management

    this.timeRender = new Date().getTime();
    this.timeNow = new Date().getTime();

    // main camera

    this.camera = new THREE.PerspectiveCamera(
        // FOV, aspect, near, far
        75, 1, 0.1, 1000
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
            0xc00080, 2, 3 * settings.zone.size
        );

        // the big sphere

        this.zone = new THREE.Mesh(
            new THREE.SphereGeometry(1, 128, 128),
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

        this.zoneInner = new THREE.Mesh(
            new THREE.SphereGeometry(1, 64, 64),
            new THREE.MeshLambertMaterial({
                color: 0x808080,
                transparent: true,
                opacity: 0.1,
                wireframe: true,
                side: THREE.DoubleSide,
            })
        );
        this.zoneInner.scale.multiplyScalar(settings.zone.inner);
        this.add(this.zoneInner);

        // lights

        this.light = new THREE.PointLight(
            // hex, intensity, distance, decay
            0xffffff, 1, 1000, 1
        );
        this.add(this.light);

        this.camLight = new THREE.SpotLight(
            // hex, intensity, distance, angle, exponent, decay
            0xffffff, 3, 1000, 1, 50, 1
        );
        this.add(this.camLight);

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

        // call handler

        oninit.call(this);
    }, function () {
        // do rendering

        this.renderObjects();
        this.renderPlayerView(settings.players[settings.me]);

        // call handler

        onrender.call(this);
    });
};

GameScene.prototype = Object.create(Scene.prototype);

GameScene.prototype.addObject = function (settings, mode, instance) {
    var object = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        undefined // set later
    );

    // drawing

    var scene = this;
    var lastType = undefined;
    object.drawType = function () { // TODO: move this to renderObject
        var physics = settings.physics[instance.type];

        if (instance.type != lastType) {
            object.scale.set(physics.size, physics.size, physics.size);

            if (!physics.getDisplayMat) {
                var material;

                switch (instance.type) {
                    case 'player':
                        material = new THREE.MeshLambertMaterial({
                            color: 0x202020,
                            transparent: true,
                            opacity: 0.8,
                        });
                        break;

                    case 'hole':
                        material = new THREE.MeshBasicMaterial({
                            // color: 0x4000ff,
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
                        });
                        break;

                    case 'quaffle':
                        material = new THREE.MeshLambertMaterial({
                            color: 0xc0c0c0,
                        });
                        break;

                    case 'bludger':
                        material = new THREE.MeshPhongMaterial({
                            color: 0x000000,
                        });
                        break;

                    case 'snitch':
                        material = new THREE.MeshPhongMaterial({
                            color: 0xffc020,
                        });
                        break;

                    default:
                        throw new Error();
                }

                physics.getDisplayMat = function () {
                    return material;
                };
            }
            object.material = physics.getDisplayMat();

            lastType = instance.type;
        }

        // special objects of players

        if (instance.type == 'player') {
            if (!physics.getMagicMat) {
                var magicGeometry = new THREE.SphereGeometry(1.1, 32, 32);
                var magicMaterial = new THREE.MeshLambertMaterial({
                    color: 0x40FF40,
                    transparent: true,
                    opacity: 0.5,
                });
                physics.getMagicMat = function () {
                    return {
                        geometry: magicGeometry,
                        material: magicMaterial,
                    };
                };
            }

            if (instance.magicStatus > 0) {
                object.magicObject.geometry = new THREE.SphereGeometry(
                    1.1, 8 + Math.round(24 * instance.magicStatus), 32,
                    0, 2 * Math.PI * instance.magicStatus
                );
                object.magicObject.material = physics.getMagicMat().material;
                object.magicObject.visible = true;
            } else if (instance.magicStatus < 0) {
                object.magicObject.geometry = physics.getMagicMat().geometry;
                object.magicObject.material = new THREE.MeshLambertMaterial({
                    color: 0x40FF40,
                    transparent: true,
                    opacity: -0.5 * instance.magicStatus,
                });
                object.magicObject.visible = true;
            } else {
                object.magicObject.visible = false;
            }
        }
    };

    // apply

    instance.getObject = function () {
        return object;
    };

    object.game = instance;

    this.add(object);

    // special objects of players

    if (instance.type == 'player') {
        object.magicObject = new THREE.Mesh(
            undefined, undefined // set later
        );
        object.magicObject.rotation.set(-0.5 * Math.PI, 0.5 * Math.PI, 0, 'XYZ');
        object.add(object.magicObject);
    }
};

GameScene.prototype.renderObject = function (object, instance) {
    object.drawType(); // TODO

    object.position.copy(
        instance.predictedPosition
    );
    object.rotation.setFromVector3(
        instance.predictedRotation, 'YZX'
    );
};

GameScene.prototype.renderObjects = function () {
    for (var i in this.children) {
        var object = this.children[i];

        if (!object.game) {
            continue;
        }

        this.renderObject(object, object.game);
    }
};

GameScene.prototype.renderPlayerView = function (me) {
    var object = me.getObject();
    var step = 0.05; // 1 - Math.pow(0.75, 0.01 * (this.timeNow - this.timeRender));

    this.camera.position.lerp(
        new THREE.Vector3(0, 1, 10)
            .applyQuaternion(object.quaternion)
            .add(object.position),
        step
    );
    this.camera.quaternion.slerp(
        object.quaternion,
        step
    );

    this.camLight.position.copy(
        new THREE.Vector3(0, 0, 1)
            .applyQuaternion(object.quaternion)
            .add(object.position)
    );
    this.camLight.target = object;
};

