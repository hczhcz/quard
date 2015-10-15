'use strict';

// Scene object

var Scene = function (container, resizeBind, onrender) {
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

    this.onrender = onrender;
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
