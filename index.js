var RetractableSphere = require('threejs-geometry-retractable-sphere')
var hitTest = require('threejs-hittest');

function noop() {}

function CubeMapPainter(pointers, camera, renderer) {

	var brushScene = new THREE.Scene();

	var cubeMapCamera = new THREE.CubeCamera(0.01, 10, 256, THREE.FloatType, THREE.RGBAFormat);
	brushScene.add(cubeMapCamera);

	var brushMatParams = {
		depthWrite: false,
		side: THREE.BackSide,
		transparent: true
	};

	var brushPivot = new THREE.Object3D();
	var brushMesh = new RetractableSphere(32, 16, brushMatParams);
	brushMesh.rotation.x = Math.PI * 0.5;
	brushMesh.material.uniforms.fullness.value = 0.1;
	brushMesh.material.uniforms.color.value.setRGB(1, 1, 1);

	brushPivot.add(brushMesh);
	brushScene.add(brushPivot);

	this.drawScreenDot = this.drawScreenDot.bind(this);
	this.updateScreenDot = this.updateScreenDot.bind(this);
	this.pointers = pointers;

	this.camera = camera;
	this.renderer = renderer;
	this.brushScene = brushScene;
	this.brushPivot = brushPivot;
	this.brushMesh = brushMesh;
	this.cubeMapCamera = cubeMapCamera;
	this.meshes = [];
	this.queue = [];

	this.state = false;
	this.setState(true);
}

CubeMapPainter.prototype.updateScreenDot = function(x, y, id) {
	this.drawScreenDot(x, y, id, true);
}

CubeMapPainter.prototype.drawScreenDot = function(x, y, id, preventDraw) {
	x = (x / window.innerWidth) * 2 - 1;
	y = (y / window.innerHeight) * 2 - 1;
	
	var hits = hitTest(x, y, this.camera, this.meshes);
	
	if (hits.length > 0)
	{
		var hit = hits[0];
		var hitObject = hit.object;
		var hitFace = hit.face;
		var vertices = hitObject.geometry.vertices;
		var hitVerticesWorld;
		var vertexIndices = [hitFace.a, hitFace.b, hitFace.c];
		if(vertices) {
			hitVerticesWorld = vertexIndices.map(function(vertIndex) {
				return vertices[vertIndex].clone().applyMatrix4(hitObject.matrixWorld);
			});
		} else {
			hitVerticesWorld = vertexIndices.map(function(vertIndex) {
				var positions = hitObject.geometry.attributes.position.array;
				return new THREE.Vector3(
					positions[3*vertIndex],
					positions[3*vertIndex+1],
					positions[3*vertIndex+2]
				)
			});
		}
		var incident = hit.point.clone().sub(this.camera.position).normalize();
		var normalWorld = hit.face.normal.clone().applyMatrix4(new THREE.Matrix4().extractRotation( hitObject.matrixWorld ));
		
		var bary = THREE.Triangle.barycoordFromPoint(hit.point, hitVerticesWorld[0], hitVerticesWorld[1], hitVerticesWorld[2]);

		var hitVertexNormalsWorld;
		if(vertices) {
			hitVertexNormalsWorld = hit.face.vertexNormals.map(function(vertexNormal) {
				return vertexNormal.clone().applyMatrix4(new THREE.Matrix4().extractRotation( hitObject.matrixWorld ));
			});
		} else {
			hitVertexNormalsWorld = vertexIndices.map(function(vertIndex) {
				var normals = hitObject.geometry.attributes.normal.array;
				return new THREE.Vector3(
					normals[3*vertIndex],
					normals[3*vertIndex+1],
					normals[3*vertIndex+2]
				);
			});
		}

		var weightedVertexNormal = 
			hitVertexNormalsWorld[0].multiplyScalar(bary.x).add(
			hitVertexNormalsWorld[1].multiplyScalar(bary.y)).add(
			hitVertexNormalsWorld[2].multiplyScalar(bary.z));

		normalWorld = weightedVertexNormal;
		var reflection = incident.reflect(normalWorld);
		
		// console.log('show');
		this.brushPivot.visible = true;
		this.brushPivot.lookAt(reflection);
		// brushMesh.material.uniforms.color.value.setRGB(Math.random(), Math.random(), Math.random());
		
		if(!preventDraw) {
			this.queue.push(reflection.clone());
			// this.cubeMapCamera.updateCubeMap(this.renderer, this.brushScene);
		}
	} else {
		this.brushPivot.visible = false;
		// console.log('hide');
	}
}

CubeMapPainter.prototype.addMesh = function(mesh) {
	this.meshes.push(mesh);
}

var backupMatrix = new THREE.Matrix4();
CubeMapPainter.prototype.processQueue = function() {
	backupMatrix.copy(this.brushPivot.matrixWorld);
	for (var i = 0; i < this.queue.length; i++) {
		this.brushPivot.lookAt(this.queue[i]);
		this.cubeMapCamera.updateCubeMap(this.renderer, this.brushScene);
	}
	this.brushPivot.matrixWorld.copy(backupMatrix);
	for (var i = this.queue.length - 1; i >= 0; i--) {
		this.queue.splice(i, 1);
	};

}

CubeMapPainter.prototype.setState = function(state) {
	if(this.state === state) return;
	this.state = state;
	var op = state ? 'add' : 'remove';
	this.pointers.onPointerDownSignal[op](this.drawScreenDot);
	this.pointers.onPointerDragSignal[op](this.drawScreenDot);
	this.pointers.onPointerMoveSignal[op](this.updateScreenDot);
}

CubeMapPainter.prototype.isActive = function() {
	return this.state;
}
module.exports = CubeMapPainter;
