/// <reference path="typings/three/three.d.ts"/>

THREE = require('three');

var View = require('threejs-managed-view').View;
var hitTest = require('threejs-hittest');
var FPS = require('threejs-camera-controller-first-person-desktop');
var Checkerboard = require('threejs-texture-checkerboard');

var Pointers = require('input-unified-pointers');

var view = new View({	
	useRafPolyfill: false 
});

var brushScene = new THREE.Scene();

var cubeMapCamera = new THREE.CubeCamera(0.01, 10, 256);
brushScene.add(cubeMapCamera);

//var fps = new FPS(view.camera, view.canvas);

var step = 0;
var radius = 8;

view.renderManager.onEnterFrame.add(function(){
	//fps.update();	
	step += 0.04;
	var angle = step * 0.01 * Math.PI * 2;
	
	view.camera.position.set(
		Math.cos(angle) * radius,
		2,
		Math.sin(angle) * radius			
	);
	
	view.camera.lookAt(mesh.position);
});

view.renderer.autoClear = false;

//var geom = new THREE.CubeGeometry(1, 32, 32);
var geom = new THREE.TorusKnotGeometry(1, 0.25, 100, 16);
var mat = new THREE.MeshPhongMaterial({ 
	color: 0x555555, 
	envMap: cubeMapCamera.renderTarget, 
	combine: THREE.AddOperation
});

var mesh = new THREE.Mesh(geom, mat);

view.scene.add(mesh);

var brushMat = new THREE.MeshBasicMaterial({ 
	color: 0xffffff, 	
	depthWrite: false
 });
var brushMesh = new THREE.Mesh(geom, brushMat);
brushMesh.scale.multiplyScalar(0.25);
brushMesh.position.x = 3;

brushScene.add(brushMesh);

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

view.scene.add(planeMesh);

var pointers = new Pointers(view.canvas);

function drawDot(x, y) {
	x = (x / window.innerWidth) * 2 - 1;
	y = (y / window.innerHeight) * 2 - 1;
	
	var hits = hitTest(x, y, view.camera, [mesh]);
	
	if (hits.length > 0)
	{
		var incident = hits[0].point.clone().sub(view.camera.position).normalize();
		var normalWorld = hits[0].face.normal.clone().applyMatrix4(new THREE.Matrix4().extractRotation( hits[0].object.matrixWorld ));
				
		var reflection = incident.reflect(normalWorld);
		console.log(hits[0].face.normal);
		
		brushMesh.position.copy(reflection);
		brushMesh.material.color.setRGB(Math.random(), Math.random(), Math.random());
		
		cubeMapCamera.updateCubeMap(view.renderer, brushScene);
		
		// I - 2.0 * dot(N, I) * N
		
		//debugger;
	}
}

pointers.onPointerDownSignal.add(drawDot);
pointers.onPointerDragSignal.add(drawDot);

//pointers.on
 
//hitTest(x, y, camera, objects, recursive)