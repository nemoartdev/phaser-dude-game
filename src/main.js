// Importa la librería Phaser para crear el juego
import Phaser from "phaser";

// Configuración principal del juego: render, tamaño, física y ciclo de vida de la escena
var config = {
  type: Phaser.AUTO, // Selecciona WebGL o Canvas automáticamente
  width: 800, // Ancho de la pantalla
  height: 600, // Alto de la pantalla
  physics: {
    default: "arcade", // Motor de física arcade
    arcade: {
      gravity: { y: 300 }, // Gravedad vertical
      debug: false, // Desactiva el modo debug
    },
  },
  scene: {
    preload: preload, // Función para precargar recursos
    create: create, // Función para crear objetos y configuraciones
    update: update, // Función que se ejecuta en cada frame
  },
};

// Variables globales para los objetos y estado del juego
var player; // Jugador
var stars; // Grupo de estrellas
var bombs; // Grupo de bombas
var platforms; // Grupo de plataformas
var cursors; // Controles de teclado
var score = 0; // Puntuación
var gameOver = false; // Estado de fin de juego
var scoreText; // Texto de puntuación

// Inicializa el juego con la configuración definida
var game = new Phaser.Game(config);

// Precarga imágenes y sprites antes de iniciar la escena
function preload() {
  this.load.image("sky", "assets/sky.png"); // Fondo
  this.load.image("ground", "assets/platform.png"); // Plataforma
  this.load.image("star", "assets/star.png"); // Estrella
  this.load.image("bomb", "assets/bomb.png"); // Bomba
  this.load.spritesheet("dude", "assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48,
  }); // Sprite del jugador
}

// Crea los objetos del juego y configura la escena
function create() {
  this.add.image(400, 300, "sky"); // Agrega el fondo

  platforms = this.physics.add.staticGroup(); // Grupo de plataformas estáticas
  platforms.create(400, 568, "ground").setScale(2).refreshBody(); // Plataforma principal
  platforms.create(600, 400, "ground"); // Plataforma secundaria
  platforms.create(50, 250, "ground"); // Otra plataforma
  platforms.create(750, 220, "ground"); // Otra plataforma

  player = this.physics.add.sprite(100, 450, "dude"); // Crea el jugador
  player.setBounce(0.2); // Rebote al caer
  player.setCollideWorldBounds(true); // Limita al área de juego

  // Animaciones del jugador
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });
  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });
  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  cursors = this.input.keyboard.createCursorKeys(); // Habilita controles de flechas

  // Crea grupo de estrellas y las distribuye en la escena
  stars = this.physics.add.group({
    key: "star",
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });
  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // Rebote aleatorio
  });

  // Grupo de bombas (enemigos)
  bombs = this.physics.add.group();

  // Muestra la puntuación en pantalla
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontsize: "32px",
    fill: "#000",
  });

  // Colisiones entre objetos
  this.physics.add.collider(player, platforms); // Jugador-plataformas
  this.physics.add.collider(stars, platforms); // Estrellas-plataformas
  this.physics.add.collider(bombs, platforms); // Bombas-plataformas

  // Detecta cuando el jugador recoge una estrella
  this.physics.add.overlap(player, stars, collectStar, null, this);

  // Detecta cuando el jugador toca una bomba
  this.physics.add.collider(player, bombs, hitBomb, null, this);
}

// Lógica de movimiento y animación del jugador en cada frame
function update() {
  if (gameOver) {
    return; // Si el juego terminó, no actualiza nada
  }

  if (cursors.left.isDown) {
    player.setVelocityX(-160); // Mueve a la izquierda
    player.anims.play("left", true); // Animación izquierda
  } else if (cursors.right.isDown) {
    player.setVelocityX(160); // Mueve a la derecha
    player.anims.play("right", true); // Animación derecha
  } else {
    player.setVelocityX(0); // Detiene el movimiento horizontal
    player.anims.play("turn"); // Animación de quieto
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330); // Salta si está en el suelo
  }
}

// Función que se ejecuta cuando el jugador recoge una estrella
function collectStar(player, star) {
  star.disableBody(true, true); // Desactiva la estrella
  score += 10; // Suma puntos
  scoreText.setText("Score: " + score); // Actualiza el texto

  // Si no quedan estrellas activas, las reinicia y agrega una bomba
  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });
    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);
    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;
  }
}

// Función que se ejecuta cuando el jugador toca una bomba
function hitBomb(player, bomb) {
  this.physics.pause(); // Pausa la física del juego
  player.setTint(0xff0000); // Cambia el color del jugador
  player.anims.play("turn"); // Animación de quieto
  gameOver = true; // Marca el juego como terminado
}
