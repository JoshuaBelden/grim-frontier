import { describe, it, expect } from 'vitest';
import { Tile, Grid } from './grid';

describe('Grid', () => {
  describe('Uses an axial coordinate system', () => {
    it('Tiles can be created', () => {
      const tile = new Tile(0, 0);
      expect(tile).toBeDefined();
    });

    it('Tiles know its neighbors', () => {
      const tile = new Tile(0, 0);
      const neighbors = tile.getNeighbors();
      expect(neighbors).toBeDefined();
      expect(neighbors.length).toBe(6);
    });

    it('Tile can calculate distance to another hex', () => {
      const tile1 = new Tile(0, 0);
      const tile2 = new Tile(2, -1);

      expect(tile1.distanceTo(tile2)).toBe(2);
    });
  });

  describe('Has basic behavior', () => {
    it('Can be created', () => {
      const grid = new Grid(3);
      const tile = grid.getTile(0, 0);
      expect(tile).toBeDefined();
    });

    it('Can get neighboring hexes', () => {
      const grid = new Grid(3).getTile(0, 0);
      const neighbors = grid.getNeighbors();

      expect(neighbors).toBeDefined();
      expect(neighbors.length).toBe(6);
    });

    it('Can check if impassable', () => {
      const tile = new Grid(3).getTile(0, 0);
      expect(tile.isImpassable()).toBe(false);
    });
  });

  describe('Pathfinding', () => {
    it('Can find path on open terrain', () => {
      const grid = new Grid(3);
      const path = grid.findPath(grid.getTile(0, 0), grid.getTile(2, -1));

      // Path should exist on open terrain
      expect(path).toBeDefined();
    });

    it('Can not find path across impassable terrain, like water', () => {
    });

    it('Path costs more over difficult terrain, like mountains.', () => {
      const grid = new Grid(3);
      grid.getTile(1, 0).terrain = 'mountain';
      const path = grid.findPath(grid.getTile(0, 0), grid.getTile(2, 0));

      // Path should be longer due to mountain cost
      expect(path).toBeDefined();
      expect(path.length).toBe(3);
    });
  });
});
