'use strict';

var Scene = function (container, onrender) {
    // three.js scene

    var scene = new THREE.Scene();

    // main camera

    scene.camera = new THREE.PerspectiveCamera(
        // FOV, aspect, near, far
        90, 1, 0.1, 1000
    );

    // main canvas

    scene.renderer = new THREE.WebGLRenderer();
    $(scene.renderer.domElement)
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
        })
        .appendTo(container);

    scene.resize = function () {
        var width = $(container).width();
        var height = $(container).height();

        scene.camera.aspect = width / height;
        scene.camera.updateProjectionMatrix();
        scene.renderer.setSize(width, height);
    };

    // rendering loop

    scene.onrender = onrender;

    scene.render = function () {
        scene.onrender();

        requestAnimationFrame(scene.render);
        scene.renderer.render(scene, scene.camera);
    };

    return scene;
};
