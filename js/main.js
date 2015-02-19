var camera, renderer, scene, controls, stats, raycaster, puzzle;

init();

function init() {
	scene = new THREE.Scene();
	
	//lights
	var light = new THREE.AmbientLight(0xffffff);
	scene.add(light);		
	
	//puzzle
	puzzle = new puzzle();
	puzzle.init(scene);
	
	//camera
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
	camera.lookAt(scene.position);
	camera.position.x = puzzle.initCameraX;
	camera.position.y = puzzle.initCameraY;
	camera.position.z = puzzle.initCameraZ;		
	
	//camera controls
	controls = new THREE.OrbitControls(camera);
	controls.noPan = true;
	
	// renderer
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xeeeeee, 1);
	
	//append renderer to HTML
	var container = document.getElementById('container');
	container.appendChild(renderer.domElement);	
	
	//FPS counter
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );	
	
	//Events
	window.addEventListener('resize', onWindowResize, false);
	
	document.addEventListener('mousedown',  onPressed,  false);
	document.addEventListener('mousemove',  onMoved,    false);
	document.addEventListener('mouseup',    onReleased, false);
	document.addEventListener('touchstart', onPressed,  false);
	document.addEventListener('touchmove',  onMoved,    false);
	document.addEventListener('touchend',   onReleased, false);	
	
	raycaster = new THREE.Raycaster();
	render();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	render();
}

function onPressed(event){
	event.preventDefault();
	
	var vector = new THREE.Vector3();
	if(event.targetTouches){
		if(event.targetTouches.length){
			event.clientX = event.targetTouches[0].pageX;
			event.clientY = event.targetTouches[0].pageY;
		}
	}
	vector.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5 );
	vector.unproject(camera);

	raycaster.ray.set(camera.position, vector.sub(camera.position).normalize());
	puzzle.findFaceClicked(raycaster, controls);
}

function onMoved(event){
	if(puzzle.userMovingFace){
		event.preventDefault();
		
		var vector = new THREE.Vector3();
		if(event.targetTouches){
			if(event.targetTouches.length){
				event.clientX = event.targetTouches[0].pageX;
				event.clientY = event.targetTouches[0].pageY;
			}
		}
		vector.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5 );
		vector.unproject(camera);
	
		raycaster.ray.set(camera.position, vector.sub(camera.position).normalize());
		puzzle.guessDirectionMoving(raycaster);		
	}
}

function onReleased(event){
	event.preventDefault();
	if(puzzle.userMovingFace){
		puzzle.guessMovingFaceAndDirection(controls);
	}
}

function render(){	
	requestAnimationFrame(render);	
	controls.update();
	puzzle.animate();
	stats.update();
	renderer.render(scene, camera);
}