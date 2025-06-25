import Phaser from 'phaser';

export default class Game extends Phaser.Scene {
  private players: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private tokens: Phaser.GameObjects.Sprite[] = [];
  private obstacles: Phaser.GameObjects.Rectangle[] = [];
  private powerUps: Phaser.GameObjects.Sprite[] = [];
  private gridSize = 7;
  private cellSize = 80;
  private playerId: string = Math.random().toString(36).substring(2); // Temp ID
  private score = 0;
  private health = 100;
  private speed = 1;
  private scoreText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private powerUpText!: Phaser.GameObjects.Text;

  constructor() {
    super('game');
  }

  preload() {
    console.log('Loading assets...');
    this.load.image('player', 'assets/player.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('obstacle', 'https://via.placeholder.com/70x70.png?text=Wall');
    this.load.image('speedBoost', 'https://via.placeholder.com/40x40.png?text=Speed');
    this.load.audio('coin', 'assets/coin.wav');
    this.load.audio('powerUp', 'https://www.soundjay.com/buttons/beep-01a.mp3');
  }

  create() {
    const graphics = this.add.graphics({ lineStyle: { width: 2, color: 0xaaaaaa } });
    for (let x = 0; x <= this.gridSize; x++) {
      for (let y = 0; y <= this.gridSize; y++) {
        graphics.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
      }
    }

    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(1, this.gridSize - 2) * this.cellSize + 40;
      const y = Phaser.Math.Between(1, this.gridSize - 2) * this.cellSize + 40;
      const obstacle = this.add.rectangle(x, y, this.cellSize - 20, this.cellSize - 20, 0x666666);
      this.obstacles.push(obstacle);
    }

    this.players[this.playerId] = this.add.sprite(40, 40, 'player').setScale(0.5).setOrigin(0, 0);
    console.log('Player created at:', this.players[this.playerId].x, this.players[this.playerId].y);

    this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, { font: '16px Arial', color: '#ffffff' });
    this.healthText = this.add.text(10, 30, `Health: ${this.health}%`, { font: '16px Arial', color: '#ff4444' });
    this.timerText = this.add.text(10, 50, 'Time: 90', { font: '16px Arial', color: '#ffffff' });
    this.powerUpText = this.add.text(10, 70, 'Power-Ups: None', { font: '16px Arial', color: '#ffff00' });

    const cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      console.log('Key pressed:', event.key);
      const player = this.players[this.playerId];
      let newX = player.x;
      let newY = player.y;
      if (
        (event.key === 'ArrowUp' || (cursors && cursors.up && cursors.up.isDown)) &&
        this.canMove(player.x, newY - this.cellSize)
      ) {
        newY -= this.cellSize * this.speed;
      }
      if (
        (event.key === 'ArrowDown' || (cursors && cursors.down && cursors.down.isDown)) &&
        this.canMove(player.x, newY + this.cellSize)
      ) {
        newY += this.cellSize * this.speed;
      }
      if (
        (event.key === 'ArrowLeft' || (cursors && cursors.left && cursors.left.isDown)) &&
        this.canMove(newX - this.cellSize, player.y)
      ) {
        newX -= this.cellSize * this.speed;
      }
      if (
        (event.key === 'ArrowRight' || (cursors && cursors.right && cursors.right.isDown)) &&
        this.canMove(newX + this.cellSize, player.y)
      ) {
        newX += this.cellSize * this.speed;
      }

      if (
        newX >= 40 && newX < this.gridSize * this.cellSize &&
        newY >= 40 && newY < this.gridSize * this.cellSize
      ) {
        player.setPosition(newX, newY);
        this.checkCollisions();
      }
    });

    this.time.addEvent({
      delay: 4000,
      callback: () => this.spawnToken(),
      callbackScope: this,
      loop: true,
    });

    this.time.addEvent({
      delay: 10000,
      callback: () => this.spawnPowerUp(),
      callbackScope: this,
      loop: true,
    });

    let timeLeft = 90;
    this.timerText = this.add.text(10, 50, `Time: ${timeLeft}`, { font: '16px Arial', color: '#ffffff' });
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        this.health = Math.max(0, this.health - 0.5);
        this.healthText.setText(`Health: ${Math.round(this.health)}%`);
        this.timerText.setText(`Time: ${timeLeft}`);
        if (timeLeft <= 0 || this.health <= 0) {
          this.scene.pause();
          this.add.text(200, 280, 'Game Over!', { font: '24px Arial', color: '#ff0000' });
        }
      },
      loop: true,
    });
  }

  canMove(x: number, y: number): boolean {
    return !this.obstacles.some(obstacle =>
      Math.abs(obstacle.x - x) < this.cellSize / 2 && Math.abs(obstacle.y - y) < this.cellSize / 2
    );
  }

  spawnToken() {
    const x = Phaser.Math.Between(0, this.gridSize - 1) * this.cellSize + 40;
    const y = Phaser.Math.Between(0, this.gridSize - 1) * this.cellSize + 40;
    if (this.canMove(x, y)) {
      const token = this.add.sprite(x, y, 'coin').setScale(0.5);
      this.tokens.push(token);
    }
  }

  spawnPowerUp() {
    const x = Phaser.Math.Between(0, this.gridSize - 1) * this.cellSize + 40;
    const y = Phaser.Math.Between(0, this.gridSize - 1) * this.cellSize + 40;
    if (this.canMove(x, y)) {
      const powerUp = this.add.sprite(x, y, 'speedBoost').setScale(0.3);
      this.powerUps.push(powerUp);
    }
  }

  checkCollisions() {
    const player = this.players[this.playerId];
    this.tokens.forEach((token, index) => {
      if (Math.abs(token.x - player.x) < 20 && Math.abs(token.y - player.y) < 20) {
        this.sound.play('coin');
        token.destroy();
        this.tokens.splice(index, 1);
        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);
        fetch('http://localhost:3000/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: this.playerId, score: this.score }),
        });
      }
    });

    this.powerUps.forEach((powerUp, index) => {
      if (Math.abs(powerUp.x - player.x) < 20 && Math.abs(powerUp.y - player.y) < 20) {
        this.sound.play('powerUp');
        powerUp.destroy();
        this.powerUps.splice(index, 1);
        this.speed = 2;
        this.powerUpText.setText('Power-Up: Speed Boost (8s)');
        fetch('http://localhost:3000/api/power-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: this.playerId, powerUpType: 'speedBoost' }),
        });
        this.time.delayedCall(8000, () => {
          this.speed = 1;
          this.powerUpText.setText('Power-Ups: None');
        });
      }
    });
  }

  update() {
    this.tokens.forEach(token => token.setScale(0.5 * (1 + 0.1 * Math.sin(this.time.now / 200))));
    this.powerUps.forEach(powerUp => powerUp.setScale(0.3 * (1 + 0.1 * Math.sin(this.time.now / 200))));
  }
}