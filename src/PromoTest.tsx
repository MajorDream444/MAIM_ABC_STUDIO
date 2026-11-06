import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {CameraPose, PoolScene} from './PoolWorld';
const POSES: CameraPose[] = [
  {frame: 0, angle: 0.0, radius: 9.5, height: 7.5, look: [0, -0.8, -0.6]},
  {frame: 59, angle: 0.15, radius: 8.6, height: 6.5, look: [0, -0.8, -0.8]},
];
export const PromoTest = () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill style={{backgroundColor: '#050505'}}>
    <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping}} camera={{fov: 50, near: 0.1, far: 60, position: [0, 8, 9]}}>
      <PoolScene poses={POSES} lineUntilS={0}/>
    </ThreeCanvas>
  </AbsoluteFill>;
};
