function puzzle(){
	//CONSTANTS
	VOXEL = 2;
	X_DIMENS = 2;
	Y_DIMENS = 3;
	Z_DIMENS = 4;
	var pivotCenter = new THREE.Vector3(0, 0, 0);
		
	this.userMovingFace = false; //To prevent moving the cube while trying to move a face

	var cubies; //Array with Object3Ds translated from pivot point (center of puzzle)
	var meshToCubiesMap; //Map using cubie mesh uuid as key and Object3D as values
	var cubiesMap; //Map using cubie uuid as key and Object3D as value
	var normalizedCubiesToCoordsMap; //Map using cubie uuid as key and Vector3 as value to represent normalized coordinates.
	var clickableCubies; //Array with meshes for raycaster
	var cubiesMoving = []; //Array with cubies actually moving
	var angleSteps = 13, actualStep, angleDelta; //Params for moving animation; TBD remove magical number, calculate according to size
	var movingType; //Which face we are moving. The value indicates face's normal
	var scrambling, scramblingIndex = 0;	
	var clickStart //Intersection point between raycaster and puzzle, used to detect which face was clicked
	var directionMoving = {xCount: 0, yCount: 0, zCount: 0}; //"Statistic" method to determine direction done (DIRTY)
	
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
		this.initCameraX = VOXEL * X_DIMENS * 2;
		this.initCameraY = VOXEL * Y_DIMENS * 2;
		this.initCameraZ = VOXEL * Z_DIMENS * 2;
		
		var cubieGeom;
		
		clickableCubies = [];
		meshToCubiesMap = [];
		cubiesMap = [];
		normalizedCubiesToCoordsMap = [];
		cubies = new Array(Y_DIMENS);
		for(var y = 0; y < Y_DIMENS; y++){
			cubies[y] = new Array(X_DIMENS);
			for(var x = 0; x < X_DIMENS; x++){
				cubies[y][x] = new Array(Z_DIMENS);
				for(var z = 0; z < Z_DIMENS; z++){					
					cubieGeom = new THREE.BoxGeometry(VOXEL, VOXEL, VOXEL);
					
					cubieGeom.faceVertexUvs[0] = [];
					cubieGeom.faceVertexUvs[0][0]  = (x == X_DIMENS - 1) ? [redText[0],    redText[1],    redText[3]]    : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][1]  = (x == X_DIMENS - 1) ? [redText[1],    redText[2],    redText[3]]    : [blackText, blackText, blackText];					
					cubieGeom.faceVertexUvs[0][2]  = (x == 0) 			 ? [orangeText[0], orangeText[1], orangeText[3]] : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][3]  = (x == 0) 			 ? [orangeText[1], orangeText[2], orangeText[3]] : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][4]  = (y == Y_DIMENS - 1) ? [blueText[0],   blueText[1],   blueText[3]]   : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][5]  = (y == Y_DIMENS - 1) ? [blueText[1],   blueText[2],   blueText[3]]   : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][6]  = (y == 0) 			 ? [greenText[0],  greenText[1],  greenText[3]]  : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][7]  = (y == 0) 			 ? [greenText[1],  greenText[2],  greenText[3]]  : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][8]  = (z == Z_DIMENS - 1) ? [yellowText[0], yellowText[1], yellowText[3]] : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][9]  = (z == Z_DIMENS - 1) ? [yellowText[1], yellowText[2], yellowText[3]] : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][10] = (z == 0) 			 ? [whiteText[0],  whiteText[1],  whiteText[3]]  : [blackText, blackText, blackText];
					cubieGeom.faceVertexUvs[0][11] = (z == 0) 			 ? [whiteText[1],  whiteText[2],  whiteText[3]]  : [blackText, blackText, blackText];
									
					var cubie = new THREE.Mesh(cubieGeom, cubieMat);
					cubie.position.set(
						(x - X_DIMENS / 2) * VOXEL + 1/2 * VOXEL, 
						(y - Y_DIMENS / 2) * VOXEL + 1/2 * VOXEL, 
						(z - Z_DIMENS / 2) * VOXEL + 1/2 * VOXEL
					);
					//cubie.name = y + " " + x + " " + z;					
					clickableCubies.push(cubie);					
					var cubiePivot = new THREE.Object3D();
					cubiePivot.add(cubie);
					cubiePivot.position.set(pivotCenter.x, pivotCenter.y, pivotCenter.z);
					//cubiePivot.name = y + " " + x + " " + z;
					cubies[y][x][z] = cubiePivot;
					cubiesMap[cubiePivot.uuid] = cubiePivot;
					meshToCubiesMap[cubie.uuid] = cubiePivot;
					//In a 3x3x3, center will be (0, 0, 0), blue center (0, 1, 0), etc.
					normalizedCubiesToCoordsMap[cubiePivot.uuid] = new THREE.Vector3(x - X_DIMENS / 2 + 1/2, y - Y_DIMENS / 2 + 1/2, z - Z_DIMENS / 2 + 1/2);			
					if(insideCube(x, y, z))
						continue;
					scene.add(cubiePivot);
				}
			}
		}

		actualStep = angleSteps;
		scrambling = false;
		scramblingIndex = 0;
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
		}		
	}
	
	//Method used for mouse moved event
	this.guessDirectionMoving = function(raycaster){
		var intersects = raycaster.intersectObjects(clickableCubies, true);
		if (intersects.length) {
			intersects[0].point.sub(clickStart);
			if(intersects[0].point.length() >= 1){
				//Detect direction turn
				var maxVal = Math.max(Math.max(Math.abs(intersects[0].point.x), Math.abs(intersects[0].point.y)), Math.abs(intersects[0].point.z));		
				if(maxVal === Math.abs(intersects[0].point.x))
					directionMoving.xCount += 1 * intersects[0].point.x;
				else if(maxVal === Math.abs(intersects[0].point.y))
					directionMoving.yCount += 1 * intersects[0].point.y;
				else if(maxVal === Math.abs(intersects[0].point.z))
					directionMoving.zCount += 1 * intersects[0].point.z;
			}
		}
	}
	
	//Method used for mouse released event
	this.guessMovingFaceAndDirection = function(controls){
		//Find cubie clicked coordinates in matrix
		//Origin is in the middle of the puzzle so we sum half of it to clickStart coordinates
		clickStart.add(new THREE.Vector3(X_DIMENS / 2 * VOXEL, Y_DIMENS / 2 * VOXEL, Z_DIMENS / 2 * VOXEL));
		var x = Math.floor(Math.round(clickStart.x) / VOXEL);
		var y = Math.floor(Math.round(clickStart.y) / VOXEL);
		var z = Math.floor(Math.round(clickStart.z) / VOXEL);
			
		//Find face clicked
		/*
		Because we are clicking on surface, x,y,z are going to be either max value or 0
		In case it max value, then we substract one to avoid overflows
		If it's 0 it can be problematic with L,B,D faces because intersecting pieces can be
		confused (yellow-orange edge, for instance, if x is less than z, means we are clicking
		in the orange face to move the yellow one)
		*/
		var faceClicked;
		//Red face
		if(x === X_DIMENS){
			faceClicked = 'x';
			x--;
		}
		//Blue face
		else if(y === Y_DIMENS){
			faceClicked = 'y';
			y--;
		}
		//White face
		else if(z === Z_DIMENS){
			faceClicked = 'z';
			z--;
		}
		//Yellow-orange-green corner
		else if(x === 0 && y === 0 && z === 0){
			var minVal = Math.min(Math.min(Math.abs(clickStart.x), Math.abs(clickStart.y)), Math.abs(clickStart.z));		
				if(minVal === Math.abs(clickStart.x))
					faceClicked = 'x';
				else if(minVal === Math.abs(clickStart.y))
					faceClicked = 'y';
				else if(minVal === Math.abs(clickStart.z))
					faceClicked = 'z';
		}
		//Yellow-green edge
		else if(z === 0 && y === 0)
			faceClicked = (clickStart.z < clickStart.y) ? 'z' : 'y';
		//Orange-green yellow
		else if(x === 0 && y === 0)
			faceClicked = (clickStart.x < clickStart.y) ? 'x' : 'y';
		//Yellow-orange edge
		else if(x === 0 && z === 0)
			faceClicked = (clickStart.x < clickStart.z) ? 'x' : 'z';
		//Orange face
		else if(x === 0)
			faceClicked = 'x';
		//Green face
		else if(y === 0)
			faceClicked = 'y';
		//Yellow face
		else if(z === 0)
			faceClicked = 'z';		
		
		//Find face to move
		//We find the highest value in directionMoving and it's sign
		var direction = Math.max(Math.max(Math.abs(directionMoving.xCount), Math.abs(directionMoving.yCount)), Math.abs(directionMoving.zCount));		
		if(direction === Math.abs(directionMoving.xCount))
			direction = (Math.abs(directionMoving.xCount) / directionMoving.xCount > 0) ? '+x' : '-x';
		else if(direction === Math.abs(directionMoving.yCount))
			direction = (Math.abs(directionMoving.yCount) / directionMoving.yCount > 0) ? '+y' : '-y';
		else if(direction === Math.abs(directionMoving.zCount))
			direction = (Math.abs(directionMoving.zCount) / directionMoving.zCount > 0) ? '+z' : '-z';
		var faceToMove;
		//If we click in any x face and move the mouse in the y direction, we want to move a face in z
		//TBD this has to be done with vectors, somehow
		if(faceClicked === 'x' && direction.indexOf('y') !== -1)
			faceToMove = 'z';
		else if(faceClicked === 'x' && direction.indexOf('z') !== -1)
			faceToMove = 'y';
		else if(faceClicked === 'y' && direction.indexOf('x') !== -1)
			faceToMove = 'z';
		else if(faceClicked === 'y' && direction.indexOf('z') !== -1)
			faceToMove = 'x';	
		else if(faceClicked === 'z' && direction.indexOf('y') !== -1)
			faceToMove = 'x';
		else if(faceClicked === 'z' && direction.indexOf('x') !== -1)
			faceToMove = 'y';
			
		//Find the layer
		var layer;
		switch(faceToMove){
			case 'x':
				layer = x;
				break;
			case 'y':
				layer = y;
				break;
			case 'z':
				layer = z;
				break;
		}
		
		//Find rotation direction
		var inverted;
		if(faceToMove === 'x'){
			if(faceClicked === 'z'){
				if(z === Z_DIMENS - 1)
					inverted = direction.indexOf('+') !== -1;
				else
					inverted = direction.indexOf('+') === -1;
			}else{
				if(y === Y_DIMENS - 1)
					inverted = direction.indexOf('+') === -1;
				else
					inverted = direction.indexOf('+') !== -1;
			}
		}else if(faceToMove === 'y'){
			if(faceClicked === 'x'){
				if(x === X_DIMENS - 1)
					inverted = direction.indexOf('+') !== -1;
				else
					inverted = direction.indexOf('+') === -1;
			}else{
				if(z === Z_DIMENS - 1)
					inverted = direction.indexOf('+') === -1;
				else
					inverted = direction.indexOf('+') !== -1;
			}
		}else if(faceToMove === 'z'){
			if(faceClicked === 'y'){
				if(y === Y_DIMENS - 1)
					inverted = direction.indexOf('+') !== -1;
				else
					inverted = direction.indexOf('+') === -1;
			}else{
				if(x === X_DIMENS - 1)
					inverted = direction.indexOf('+') === -1;
				else
					inverted = direction.indexOf('+') !== -1;
			}
		}
		
		directionMoving = {xCount: 0, yCount: 0, zCount: 0}
		controls.enabled = true;
		this.userMovingFace = false;
		this.move(faceToMove, layer, inverted);
	}
	
	this.move = function(type, layer, inverted){
		cubiesMoving.length = 0;
		
		for(var y = 0; y < Y_DIMENS; y++){
			if(type === 'y' && y !== layer)
				continue;
			for(var x = 0; x < X_DIMENS; x++){
				if(type === 'x' && x !== layer)
					continue;
				for(var z = 0; z < Z_DIMENS; z++){
					if(type === 'z' && z !== layer)
						continue;
					cubiesMoving.push(cubies[(type === 'y') ? layer : y][(type === 'x') ? layer : x][(type === 'z') ? layer : z]);
				}
			}
		}
		angleDelta = ((inverted) ? -1 : 1) * Math.PI / 2 / angleSteps;
		actualStep--;
		
		movingType = type;
		updateMatrix(layer, inverted);
	}
	
	this.moveCuboid = function(type, layer, inverted){
		cubiesMoving.length = 0;
		
		Object.keys(normalizedCubiesToCoordsMap).forEach(
			function(key){
				//console.log(normalizedCubiesToCoordsMap[key]);
				switch(type){
					case 'x':
						if((normalizedCubiesToCoordsMap[key].x - 1/2 + X_DIMENS/2) === layer)
							cubiesMoving.push(cubiesMap[key]);
						break;
					case 'y':
						if((normalizedCubiesToCoordsMap[key].y - 1/2 + Y_DIMENS/2) === layer)
							cubiesMoving.push(cubiesMap[key]);
						break;
					case 'z':
						if((normalizedCubiesToCoordsMap[key].z - 1/2 + Z_DIMENS/2) === layer)
							cubiesMoving.push(cubiesMap[key]);
						break;
				}				
			});	
		/*
		cubiesMoving.forEach(function(e){
			console.log(normalizedCubiesToCoordsMap[e.uuid]); 			
		});
		console.log(cubiesMoving.length);
		*/
		angleDelta = ((inverted) ? -1 : 1) * Math.PI / 2 / angleSteps;
		actualStep--;
		
		movingType = type;
		
		var normal;
		switch(type){
			case 'x':
				normal = new THREE.Vector3(1, 0, 0);
				break;
			case 'y':
				normal = new THREE.Vector3(0, 1, 0);
				break;
			case 'z':				
				normal = new THREE.Vector3(0, 0, 1);
				break;
		}		
		
		updateNormalizedCoords(normal, inverted);
	}
	
	this.animate = function(){
		if(actualStep === angleSteps)
			return;
		actualStep--;
		var doNextMove = false;
		cubiesMoving.forEach(function(c){
			switch(movingType){
				case 'x':
					rotateAroundWorldAxis(c, new THREE.Vector3(1, 0, 0), angleDelta);
					break;
				case 'y':
					rotateAroundWorldAxis(c, new THREE.Vector3(0, 1, 0), angleDelta);
					break;
				case 'z':
					rotateAroundWorldAxis(c, new THREE.Vector3(0, 0, 1), angleDelta);
					break;
			}
			if(actualStep < 0){
				switch(movingType){
					case 'x':
						c.rotation.x = Math.round(c.rotation.x / Math.PI * 2) * Math.PI / 2;
						break;
					case 'y':
						c.rotation.y = Math.round(c.rotation.y / Math.PI * 2) * Math.PI / 2;
						break;
					case 'z':
						c.rotation.z = Math.round(c.rotation.z / Math.PI * 2) * Math.PI / 2;
						break;
				}
				actualStep = angleSteps;
				doNextMove = true;
			}
		});
		if(doNextMove){
			if(scrambling)
				this.scramble();
		}
	}
	
	this.scramble = function(){
		scrambling = true;
		var axis = ['x', 'y', 'z']
		axis = axis[Math.floor(Math.random() * 3)];
		var layer = Math.floor(Math.random() * ((axis === 'x') ? X_DIMENS : (axis === 'y') ? Y_DIMENS : Z_DIMENS));
		var inverted = Math.floor(((Math.random() * 2) % 2 === 0));
		scramblingIndex++;
		if(scramblingIndex === 100){
			scrambling = false;
			scramblingIndex = 0;
		}
		this.move(axis, layer, inverted);
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
			X_DIMENS = x;
		if(y)
			Y_DIMENS = y;
		if(z)
			Z_DIMENS = z;
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
	
	function updateMatrix(layer, inverted){
		if(movingType === 'x'){
			//Extract face
			var face = new Array(Y_DIMENS);
			for(var y = 0; y < Y_DIMENS; y++){
				face[y] = new Array(Z_DIMENS);
				for(var z = 0; z < Z_DIMENS; z++){
					face[y][z] = cubies[y][layer][z];
				}
			}
			//Rotate
			face = rotate(face, inverted);
			//Push face
			for(var y = 0; y < Y_DIMENS; y++){			
				for(var z = 0; z < Z_DIMENS; z++){
					cubies[y][layer][z] = face[y][z];
				}
			}
		}else if(movingType === 'y'){
			//Extract face
			var face = new Array(X_DIMENS);
			for(var x = 0; x < X_DIMENS; x++){
				face[x] = new Array(Z_DIMENS);
				for(var z = 0; z < Z_DIMENS; z++){
					face[x][z] = cubies[layer][x][z];
				}
			}
			//Rotate
			face = rotate(face, !inverted);
			//Push face
			for(var x = 0; x < X_DIMENS; x++){			
				for(var z = 0; z < Z_DIMENS; z++){
					cubies[layer][x][z] = face[x][z];
				}
			}
		}if(movingType === 'z'){
			//Extract face
			var face = new Array(Y_DIMENS);
			for(var y = 0; y < Y_DIMENS; y++){
				face[y] = new Array(X_DIMENS);
				for(var x = 0; x < X_DIMENS; x++){
					face[y][x] = cubies[y][x][layer];
				}
			}
			//Rotate
			face = rotate(face, !inverted);
			//Push face
			for(var y = 0; y < Y_DIMENS; y++){			
				for(var x = 0; x < X_DIMENS; x++){
					cubies[y][x][layer] = face[y][x];
				}
			}
		}
	}
	
	function rotate(matrix, inverted) {
		var result = Array(matrix[0].length);
		for (i=0; i<result.length; i++) {
			result[i] = Array(matrix.length);
		}
		for (i=0; i<matrix.length; i++) {
			for (j=0; j<matrix[0].length; j++) {
				result[j][i] = ((inverted) ? matrix[matrix.length-i-1][j] : matrix[i][matrix[0].length-j-1]);
		}
		}
		return result;
	}
	
	//Used to find surface cubies so inner ones are not rendered
	function insideCube(x, y, z){
		return !(x == 0 || (x == X_DIMENS - 1) || y == 0 || (y == Y_DIMENS - 1) || z == 0 || z == (Z_DIMENS - 1));
	}
	
	// Rotate an object around an arbitrary axis in world space   
	var rotWorldMatrix;
	function rotateAroundWorldAxis(object, axis, radians) {
		rotWorldMatrix = new THREE.Matrix4();
		rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
	
		rotWorldMatrix.multiply(object.matrix); // pre-multiply
	
		object.matrix = rotWorldMatrix;
		object.rotation.setFromRotationMatrix(object.matrix);
	}
}