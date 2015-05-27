/// <reference path="typings/three/three.d.ts"/>

THREE = require('three');

var View = require('threejs-managed-view').View;
var Checkerboard = require('threejs-texture-checkerboard');
var CubeMapPainter = require('./');

var Pointers = require('input-unified-pointers');

var view = new View({	
	useRafPolyfill: false 
});

var pointers = new Pointers(view.canvas);

var step = 0;
var radius = 4;

view.renderManager.onEnterFrame.add(function(){
	step += 0.04;
	var angle = step * 0.01 * Math.PI * 2;
	
	view.camera.position.set(
		Math.cos(angle) * radius,
		2,
		Math.sin(angle) * radius			
	);
	
	view.camera.lookAt(mesh.position);

	painter.processQueue();
});

view.renderer.autoClear = false;

var painter = new CubeMapPainter(pointers, view.camera, view.renderer);

var ambientLight = new THREE.AmbientLight(0x555555);
view.scene.add(ambientLight);
	
var light = new THREE.DirectionalLight();
view.scene.add(light);

// ---- Plane
var checkerboard = new Checkerboard();

var plane = new THREE.PlaneBufferGeometry(10, 10);
var planeMat = new THREE.MeshPhongMaterial({ map: checkerboard, color: 0xffffff});
var planeMesh = new THREE.Mesh(plane, planeMat);
planeMesh.material.side = THREE.DoubleSide;
planeMesh.rotation.x = 90 * Math.PI / 180.0;
planeMesh.position.y = -1;


//var geom = new THREE.CubeGeometry(1, 32, 32);
var geom = new THREE.TorusKnotGeometry(0.6, 0.4, 128, 32);
var mat = new THREE.MeshBasicMaterial({ 
	color: 0, 
	envMap: painter.cubeMapCamera.renderTarget, 
	combine: THREE.AddOperation
});

var mesh = new THREE.Mesh(geom, mat);

view.scene.add(mesh);

painter.addMesh(mesh);

view.scene.add(planeMesh);
