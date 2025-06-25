import Phaser from 'phaser';
import Game from './scenes/Game';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 560, // 7 * 80
  height: 560,
  scene: [Game],
  parent: 'game',
};

new Phaser.Game(config);