import { box, type Box } from '../core/collision';
import { v3, type Vec3 } from '../core/vec';

export interface LevelBox extends Box {
  color: string;
}
export interface Level {
  spawn: Vec3;
  waterY: number;
  boxes: LevelBox[];
}
const lb = (color: string, ...c: [number, number, number, number, number, number]): LevelBox => ({ ...box(...c), color });

/** M1 test island: a grassy main island, steps up to a lookout, a ruined wall and pillars, and stepping stones out to an islet. */
export const TEST_ISLAND: Level = {
  spawn: v3(0, 0.6, 1),
  waterY: 0.3,
  boxes: [
    lb('#8f9d63', -6, -2, -6, 6, 0.6, 6), // main island (grass)
    lb('#a58a66', 2, 0.6, -1, 3, 0.9, 0), // step 1
    lb('#a58a66', 3, 0.6, -1, 4, 1.2, 0), // step 2
    lb('#b5a58c', 4, 0.6, -2, 5.5, 1.6, 1), // lookout
    lb('#c9b79c', -4, 0.6, -4, -2, 1.8, -3.6), // ruined wall
    lb('#c9b79c', -4, 0.6, -3.6, -3.6, 1.2, -2), // broken wall end
    lb('#9c8f80', 7.4, -1.5, 0, 8.6, 0.55, 1.2), // stepping stone 1
    lb('#9c8f80', 9.8, -1.5, 0.3, 11, 0.75, 1.5), // stepping stone 2
    lb('#9c8f80', 12.2, -1.5, 0, 13.4, 0.95, 1.2), // stepping stone 3
    lb('#8f9d63', 14.6, -2, -2, 19, 1.1, 3), // islet
    lb('#b8ad9c', -9, -3, 3, -8, 3.2, 4), // pillar (ruin)
    lb('#b8ad9c', -12, -3, -6, -10.5, 5, -4.5), // tall pillar (ruin)
    lb('#b8ad9c', 16, 1.1, -1.5, 17, 3.4, -0.5), // islet column
  ],
};
