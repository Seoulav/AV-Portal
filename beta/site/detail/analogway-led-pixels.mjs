import {buildTileScreens} from './analogway-tile-guide.mjs';
// Convert an LED wall's actual pixel dimensions to covering 4K60 output tiles.
// This adapter does not change the Analog Way resource evaluator.
const TILE_WIDTH = 3840;
const TILE_HEIGHT = 2160;
const MAX_COLUMNS = 6;
const MAX_ROWS = 6;

export function deriveLedWallTiles(width,height) {
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||
     width>MAX_COLUMNS*TILE_WIDTH||height>MAX_ROWS*TILE_HEIGHT)return null;
  const columns=Math.ceil(width/TILE_WIDTH);
  const rows=Math.ceil(height/TILE_HEIGHT);
  return {width,height,columns,rows,outputs:columns*rows,
    coverWidth:columns*TILE_WIDTH,coverHeight:rows*TILE_HEIGHT};
}

export function parseLedWallQuery(search) {
  const params=new URLSearchParams(search);
  const rawWidth=params.get('ledw'),rawHeight=params.get('ledh');
  if(rawWidth===null||rawHeight===null||![rawWidth,rawHeight].every(value=>/^\d+$/.test(value)))return null;
  const width=Number(rawWidth),height=Number(rawHeight);
  const wall=deriveLedWallTiles(width,height);
  if(!wall)return null;
  const rawLayers=params.get('layers');
  if(rawLayers!==null&&!/^\d+$/.test(rawLayers))return null;
  const groupLayers=rawLayers===null?0:Number(rawLayers);
  if(!Number.isSafeInteger(groupLayers)||groupLayers>8)return null;
  // A nine-group wall exceeds the unchanged evaluator's screen limit.
  const groups=buildTileScreens(wall.columns,wall.rows,0).length;
  if(groups>8)return null;
  return {width,height,groupLayers};
}