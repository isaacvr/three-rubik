function puzzle(){
	//CONSTANTS
	VOXEL = 2;
	DIMENS = [3, 3, 3];
	var pivotCenter = new THREE.Vector3(0, 0, 0);
		
	this.userMovingFace = false; //To prevent moving the cube while trying to move a face

	var meshToCubiesMap; //Map using cubie mesh uuid as key and cubie as values
	var cubiesMap; //Map using cubie uuid as key and cubie as value
	var normalizedCubiesToCoordsMap; //Map using cubie uuid as key and Vector3 as value to represent normalized coordinates.
	var clickableCubies; //Array with meshes for raycaster
	var cubiesMoving = []; //Array with cubies actually moving
	var angleSteps = 13, actualStep, angleDelta; //Params for moving animation; TBD remove magical number, calculate according to size
	var movingType; //Which face we are moving. The value indicates face's normal
	var scrambling, scramblingIndex = 0;	
	var clickStart; //Intersection point between raycaster and puzzle, used to detect which face was clicked
	var clickedCubie; //Stores clicked cubie to calculate movement
	var directionMoving; //Vector describing mouse's move while pressed
	
	var cubieMat = new THREE.MeshPhongMaterial({
		map: THREE.ImageUtils.loadTexture('img/stickers.png')
	});
		
	//Setting vectors for UV mapping
	var redText    = [new THREE.Vector2(0/2, 2/3), new THREE.Vector2(1/2, 2/3), new THREE.Vector2(1/2, 3/3), new THREE.Vector2(0/2, 3/3)];
	var orangeText = [new THREE.Vector2(1/2, 2/3), new THREE.Vector2(2/2, 2/3), new THREE.Vector2(2/2, 3/3), new THREE.Vector2(1/2, 3/3)];
	var blueText   = [new THREE.Vector2(0/2, 1/3), new THREE.Vector2(1/2, 1/3), new THREE.Vector2(1/2, 2/3), new THREE.Vector2(0/2, 2/3)];
	var greenText  = [new THREE.Vector2(1/2, 1/3), new THREE.Vector2(2/2, 1/3), new THREE.Vector2(2/2, 2/3), new THREE.Vector2(1/2, 2/3)];
	var yellowText = [new THREE.Vector2(0/2, 0/3), new THREE.Vector2(1/2, 0/3), new THREE.Vector2(1/2, 1/3), new THREE.Vector2(0/2, 1/3)];
	var whiteText  = [new THREE.Vector2(1/2, 0/3), new THREE.Vector2(2/2, 0/3), new THREE.Vector2(2/2, 1/3), new THREE.Vector2(1/2, 1/3)];
	var blackText  = new THREE.Vector2(0, 0);
	
	this.init = function(scene){
		this.initCameraX = VOXEL * DIMENS[0] * 2;
		this.initCameraY = VOXEL * DIMENS[1] * 2;
		this.initCameraZ = VOXEL * DIMENS[2] * 2;
		
		var cubieGeom;
		
		clickableCubies = [];
		meshToCubiesMap = [];
		cubiesMap = [];
		normalizedCubiesToCoordsMap = [];
		for(var y = 0; y < DIMENS[1]; y++){
			for(var x = 0; x < DIMENS[0]; x++){
				for(var z = 0; z < DIMENS[2]; z++){					
					cubieGeom = new THREE.BoxGeometry(VOXEL, VOXEL, VOXEL);
					
					cubieGeom.faceVertexUvs[0] = [];
					cubieGeom.faceVertexUvs[0][0]  = (x == DIMENS[0] - 1) ? [redText[0],    redText[1],    redText[3]]    : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][1]  = (x == DIMENS[0] - 1) ? [redText[1],    redText[2],    redText[3]]    : [blackText, blackText, blackText];					
					cubieGeom.faceVertexUvs[0][2]  = (x == 0) 			  ? [orangeText[0], orangeText[1], orangeText[3]] : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][3]  = (x == 0) 			  ? [orangeText[1], orangeText[2], orangeText[3]] : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][4]  = (y == DIMENS[1] - 1) ? [blueText[0],   blueText[1],   blueText[3]]   : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][5]  = (y == DIMENS[1] - 1) ? [blueText[1],   blueText[2],   blueText[3]]   : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][6]  = (y == 0) 			  ? [greenText[0],  greenText[1],  greenText[3]]  : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][7]  = (y == 0) 			  ? [greenText[1],  greenText[2],  greenText[3]]  : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][8]  = (z == DIMENS[2] - 1) ? [yellowText[0], yellowText[1], yellowText[3]] : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][9]  = (z == DIMENS[2] - 1) ? [yellowText[1], yellowText[2], yellowText[3]] : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][10] = (z == 0) 			  ? [whiteText[0],  whiteText[1],  whiteText[3]]  : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][11] = (z == 0) 			  ? [whiteText[1],  whiteText[2],  whiteText[3]]  : [blackText, blackText, blackText];
									
					//Mesh is offsetted to its position and then added to an Object3D placed in the center
					//This way, when we rotate Object3D, we pivot meshes around center
					var cubie = new THREE.Mesh(cubieGeom, cubieMat);
					cubie.position.set(
						(x - DIMENS[0]/2) * VOXEL + 1/2 * VOXEL, 
						(y - DIMENS[1]/2) * VOXEL + 1/2 * VOXEL, 
						(z - DIMENS[2]/2) * VOXEL + 1/2 * VOXEL
					);				
					clickableCubies.push(cubie);					
					var cubiePivot = new THREE.Object3D();
					cubiePivot.add(cubie);
					cubiePivot.position.set(pivotCenter.x, pivotCenter.y, pivotCenter.z);
					cubiesMap[cubiePivot.uuid] = cubiePivot;
					meshToCubiesMap[cubie.uuid] = cubiePivot;
					//In a 3x3x3, center will be (0, 0, 0), blue center (0, 1, 0), etc.
					normalizedCubiesToCoordsMap[cubiePivot.uuid] = new THREE.Vector3(x - DIMENS[0]/2 + 1/2, y - DIMENS[1]/2 + 1/2, z - DIMENS[2]/2 + 1/2);			
					if(insideCube(x, y, z))
						continue;
					scene.add(cubiePivot);
				}
			}
		}

		actualStep = angleSteps;
		scrambling = false;
		scramblingIndex = 0;
		directionMoving = new THREE.Vector3();
	}
	
	//Method used for mouse pressed event
	this.findFaceClicked = function(raycaster, controls){
		if(actualStep !== angleSteps)
			return;	
		var intersects = raycaster.intersectObjects(clickableCubies, true);
		if (intersects.length) {
			this.userMovingFace = true;
			controls.enabled = false;
			clickStart = intersects[0].point;
			clickedCubie = meshToCubiesMap[intersects[0].object.uuid];
		}		
	}
	
	//Method used for mouse moved event
	this.guessDirectionMoving = function(raycaster){
		var intersects = raycaster.intersectObjects(clickableCubies, true);
		if (intersects.length) {
			intersects[0].point.sub(clickStart);
			if(intersects[0].point.length() >= 1){
				//Detect direction turning
				var index = getMaximum(intersects[0].point);
				directionMoving.setComponent(index, directionMoving.getComponent(index) + intersects[0].point.getComponent(index));
			}
		}
	}
	
	//Method used for mouse released event
	this.guessMovingFaceAndDirection = function(controls){
		//We "unnormalize" cubie's center coordinates
		var cubieCenter = normalizedCubiesToCoordsMap[clickedCubie.uuid].clone();
		cubieCenter.multiplyScalar(VOXEL);
		
		//We can know the face that was clicked because it'll be the corresponding to the biggest component of distance vector between center and point clicked
		var distance = new THREE.Vector3();
		distance.subVectors(clickStart, cubieCenter);
		
		//faceClicked will be the normal vector of the face clicked
		var index = getMaximum(distance);
		var value = Math.abs(distance.getComponent(index)) / distance.getComponent(index);
		var faceClicked = new THREE.Vector3();
		faceClicked.setComponent(index, value);

		//Find face to move
		//We find the highest value in directionMoving and it's sign
		index = getMaximum(directionMoving);
		value = Math.abs(directionMoving.getComponent(index)) / directionMoving.getComponent(index);
		var direction = new THREE.Vector3();
		direction.setComponent(index, value);

		//The face we are trying to move is the perpendicular to the one we clicked and the direction we moved the mouse -> cross product
		var faceToMove = new THREE.Vector3();
		faceToMove.crossVectors(faceClicked, direction);
		
		//Find the layer
		//faceToMove is a vector normal to the face we are moving, only one component should be different from 0 
		index = getMaximum(faceToMove);
		var layer = normalizedCubiesToCoordsMap[clickedCubie.uuid].getComponent(index) + DIMENS[index]/2 - 1/2;

		//We want to know the sign of the not null component
		var inverted = new THREE.Vector3(1, 1, 1);
		inverted = inverted.dot(faceToMove) < 0;
		if(inverted)
			faceToMove.negate();
		
		//Reset everything for next move
		directionMoving = new THREE.Vector3();
		controls.enabled = true;
		this.userMovingFace = false;
		
		//Sometimes faceToMove can be (0,0,0), we want to prevent it
		if(faceToMove.length())
			this.moveCuboid(faceToMove, layer, inverted);
	}
	
	this.moveCuboid = function(normal, layer, inverted){
		cubiesMoving.length = 0;
		var layersColliding = false;
		var index = getMaximum(normal);
		
		Object.keys(normalizedCubiesToCoordsMap).forEach(
			function(key){
				//console.log(normalizedCubiesToCoordsMap[key]);
				if(normalizedCubiesToCoordsMap[key].getComponent(index) - 1/2 + DIMENS[index]/2 === layer)
					cubiesMoving.push(cubiesMap[key]);
				//All cubies in same layer should be separated by 1 unit
				//If we have half, it means we turned an even layer to an odd one or viceversa
				if(Math.abs(layer - (normalizedCubiesToCoordsMap[key].getComponent(index) - 1/2 + DIMENS[index]/2)) === 1/2)
						layersColliding = true;
			});	
		/*
		cubiesMoving.forEach(function(e){
			console.log(normalizedCubiesToCoordsMap[e.uuid]); 			
		});
		console.log(cubiesMoving.length);
		*/
		angleDelta = ((inverted) ? -1 : 1) * Math.PI / 2 / angleSteps;
		movingType = normal;
		
		if(layersColliding){
			actualStep = 1;
			return;
		}
		else
			actualStep--;		
		
		updateNormalizedCoords(normal, inverted);
	}
	
	this.animate = function(){
		if(actualStep === angleSteps)
			return;
		actualStep--;
		var doNextMove = false;
		cubiesMoving.forEach(function(c){			
			rotateAroundWorldAxis(c, movingType, angleDelta);
			if(actualStep < 0){
				if(movingType.x !== 0)
					c.rotation.x = Math.round(c.rotation.x / Math.PI * 2) * Math.PI / 2;
				else if(movingType.y !== 0)
					c.rotation.y = Math.round(c.rotation.y / Math.PI * 2) * Math.PI / 2;
				else if(movingType.z !== 0)
					c.rotation.z = Math.round(c.rotation.z / Math.PI * 2) * Math.PI / 2;
				doNextMove = true;
			}
		});
		if(doNextMove){
			actualStep = angleSteps;
			if(scrambling)
				this.scramble();
		}
	}
	
	this.scramble = function(){
		if(!(DIMENS[0] === DIMENS[1] && DIMENS[1] === DIMENS[2]))
			return;
		scrambling = true;
		var normal = new THREE.Vector3();
		var index = Math.floor(Math.random() * 3);
		normal.setComponent(index, 1);
		var layer = Math.floor(Math.random() * DIMENS[index]);
		var inverted = Math.floor(((Math.random() * 2) % 2 === 0));
		scramblingIndex++;
		if(scramblingIndex === 40){
			scrambling = false;
			scramblingIndex = 0;
		}
		this.moveCuboid(normal, layer, inverted);
	}
	
	this.isScrambling = function(){
		return scrambling;
	}
	
	this.reset = function(scene){
		scene.children.splice(1, scene.children.length - 1);
		this.init(scene);
	}
	
	this.changeDimensions = function(x, y, z){
		if(x)
			DIMENS[0] = x;
		if(y)
			DIMENS[1] = y;
		if(z)
			DIMENS[2] = z;
	}
	
	//Applies 90 degree turn to coords
	/*
	If we want to make a turn in x, x component stays the same and y and z are turned 90 degrees.
	a stores value of x component
	b stores cross product with normal
	New value of coord is (old x normal + old.x) in case move is inverted and (old x -normal + old.x) if not
	*/
	function updateNormalizedCoords(normal, inverted){
		cubiesMoving.forEach(function(e){
			var old = normalizedCubiesToCoordsMap[e.uuid];
			var a = new THREE.Vector3();
			a.multiplyVectors(old, normal);
			var b = new THREE.Vector3();
			b.crossVectors(old, normal);
			if(!inverted)
				b.negate();
			normalizedCubiesToCoordsMap[e.uuid].addVectors(a, b);
		});
		/*
		cubiesMoving.forEach(function(e){
			console.log(normalizedCubiesToCoordsMap[e.uuid]); 			
		});
		console.log(cubiesMoving.length);
		*/
	}
	
	//Used to find surface cubies so inner ones are not rendered
	function insideCube(x, y, z){
		return !(x == 0 || (x == DIMENS[0] - 1) || y == 0 || (y == DIMENS[1] - 1) || z == 0 || z == (DIMENS[2] - 1));
	}
	
	// Rotate an object around an arbitrary axis in world space   
	function rotateAroundWorldAxis(object, axis, radians) {
		var rotWorldMatrix = new THREE.Matrix4();
		rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
	
		rotWorldMatrix.multiply(object.matrix); // pre-multiply
	
		object.matrix = rotWorldMatrix;
		object.rotation.setFromRotationMatrix(object.matrix);
	}
	
	//Returns the index of the biggest component (0->x; 1-> y; 2->z)
	function getMaximum(vector){
		var max = Math.max(Math.max(Math.abs(vector.x), Math.abs(vector.y)), Math.abs(vector.z));		
		if(max === Math.abs(vector.x))
			return 0;
		if(max === Math.abs(vector.y))
			return 1;
		else if(max === Math.abs(vector.z))
			return 2;
	}
}