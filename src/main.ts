import { Game } from './app/game';

const params = new URLSearchParams(location.search);
const game = new Game(document.getElementById('app')!, {
  reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('still'),
  debug: params.has('debug'),
});
game.start();
