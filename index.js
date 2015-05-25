var RetractableSphere = require('threejs-geometry-retractable-sphere')
var hitTest = require('threejs-hittest');
var DatGuiKeyboardHelper = require('dat-gui-keyboard-helper');
var exportCubeMap = require('threejs-cubemap-exporter');

function noop() {}

function CubeMapPainter(pointers, camera, renderer) {

	var datGui = new DatGuiKeyboardHelper();

	var brushScene = new THREE.Scene();

	var cubeMapCamera = new THREE.CubeCamera(0.01, 10, 256);
	brushScene.add(cubeMapCamera);

	var brushMatParams = {
		depthWrite: false,
		side: THREE.BackSide
	};
	var brushPivot = new THREE.Object3D();
	var brushMesh = new RetractableSphere(32, 16, brushMatParams);
	brushMesh.rotation.x = Math.PI * 0.5;
	brushMesh.material.uniforms.fullness.value = 1;
	brushMesh.material.uniforms.color.value.setRGB(1, 1, 1);

	brushPivot.add(brushMesh);
	brushScene.add(brushPivot);

	datGui.addSlider(brushMesh.material.uniforms.fullness, 'value', noop, ']', '[', 0.01, 'brush size', 0, 1 );
	datGui.addButton(this, 'exportCubeMap', 'E', 'export cubemap');

	this.drawScreenDot = this.drawScreenDot.bind(this);
	pointers.onPointerDownSignal.add(this.drawScreenDot);
	pointers.onPointerDragSignal.add(this.drawScreenDot);

	this.camera = camera;
	this.renderer = renderer;
	this.brushPivot = brushPivot;
	this.brushScene = brushScene;
	this.cubeMapCamera = cubeMapCamera;
	this.meshes = [];
}

CubeMapPainter.prototype.drawScreenDot = function(x, y) {
	x = (x / window.innerWidth) * 2 - 1;
	y = (y / window.innerHeight) * 2 - 1;
	
	var hits = hitTest(x, y, this.camera, this.meshes);
	
	if (hits.length > 0)
	{
		var incident = hits[0].point.clone().sub(this.camera.position).normalize();
		var normalWorld = hits[0].face.normal.clone().applyMatrix4(new THREE.Matrix4().extractRotation( hits[0].object.matrixWorld ));
				
		var reflection = incident.reflect(normalWorld);
		console.log(hits[0].face.normal);
		
		this.brushPivot.lookAt(reflection);
		// brushMesh.material.uniforms.color.value.setRGB(Math.random(), Math.random(), Math.random());
		
		this.cubeMapCamera.updateCubeMap(this.renderer, this.brushScene);
	}
}

CubeMapPainter.prototype.addMesh = function(mesh) {
	this.meshes.push(mesh);
}

CubeMapPainter.prototype.exportCubeMap = function() {
	var name = window.prompt('Name the cubemap.', 'cubemap.png');
	exportCubeMap(this.renderer, this.brushScene, this.cubeMapCamera, name, function() {
		console.log('success');
	})
}
module.exports = CubeMapPainter;
